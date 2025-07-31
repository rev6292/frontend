<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\intake.php

require_once dirname(dirname(__DIR__)) . '/Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // リクエストボディからデータを受信
    $data = json_decode(file_get_contents("php://input"), true);

    $items = $data['items'] ?? [];
    $supplierId = $data['supplierId'] ?? null;
    $operatorId = $data['operatorId'] ?? null;
    $storeId = $data['storeId'] ?? null;

    if (empty($items) || !$supplierId || !$operatorId || !$storeId) {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "必要なデータが不足しています。"]);
        exit();
    }

    $db->beginTransaction();
    try {
        $successCount = 0;
        $errors = [];

        // 在庫更新と入庫ログの記録
        foreach ($items as $item) {
            $productId = $item['productId'] ?? null;
            $quantity = $item['quantity'] ?? null;
            $costPrice = $item['costPrice'] ?? null;

            if (!$productId || !is_numeric($quantity) || $quantity <= 0 || !is_numeric($costPrice) || $costPrice < 0) {
                $errors[] = "不正なアイテムデータ: " . json_encode($item);
                continue;
            }

            // 1. inventory_records の current_stock を更新
            $stmt = $db->prepare("
                UPDATE inventory_records
                SET current_stock = current_stock + :quantity,
                    last_updated = NOW()
                WHERE product_id = :productId AND store_id = :storeId
            ");
            $stmt->bindParam(':quantity', $quantity, PDO::PARAM_INT);
            $stmt->bindParam(':productId', $productId);
            $stmt->bindParam(':storeId', $storeId);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                // 該当する在庫レコードがない場合、新しく作成
                $stmtInsert = $db->prepare("
                    INSERT INTO inventory_records (product_id, store_id, current_stock, minimum_stock, last_updated)
                    VALUES (:productId, :storeId, :quantity, 0, NOW())
                    ON DUPLICATE KEY UPDATE current_stock = current_stock + :quantity, last_updated = NOW()
                ");
                $stmtInsert->bindParam(':productId', $productId);
                $stmtInsert->bindParam(':storeId', $storeId);
                $stmtInsert->bindParam(':quantity', $quantity, PDO::PARAM_INT);
                $stmtInsert->execute();
            }

            // 2. outbound_logs に入庫履歴を記録 (typeを'intake'として)
            $stmtLog = $db->prepare("
                INSERT INTO outbound_logs (product_id, store_id, quantity, outbound_date, type, operator_id, supplier_id, cost_price_at_outbound)
                VALUES (:productId, :storeId, :quantity, NOW(), 'intake', :operatorId, :supplierId, :costPrice)
            ");
            $stmtLog->bindParam(':productId', $productId);
            $stmtLog->bindParam(':storeId', $storeId);
            $stmtLog->bindParam(':quantity', $quantity, PDO::PARAM_INT);
            $stmtLog->bindParam(':operatorId', $operatorId);
            $stmtLog->bindParam(':supplierId', $supplierId);
            $stmtLog->bindParam(':costPrice', $costPrice);
            $stmtLog->execute();

            $successCount++;
        }

        $db->commit();
        http_response_code(200);
        echo json_encode(["success" => true, "successCount" => $successCount, "errors" => $errors]);

    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
    }
} else {
    // サポートされていないメソッド
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Method not allowed."]);
}

$db = null;
?>