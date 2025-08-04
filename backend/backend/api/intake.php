<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\intake.php

require_once dirname(dirname(__DIR__)) . '/Database.php';
require_once __DIR__ . '/cors_headers.php';

// 一時的なCORS対応（新しいドメイン用）
$allowed_origins = [
    "https://frontend-one-zeta-49.vercel.app",
    "https://frontend-scbtrgvnq-rev6292s-projects.vercel.app",
    "http://localhost:3000"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    // プリフライトリクエストへの対応
    http_response_code(200);
    exit();
} elseif ($method === 'POST') {
    // デバッグ用ログ
    error_log("Intake API called with method: " . $method);
    error_log("Request body: " . file_get_contents("php://input"));
    
    // リクエストボディからデータを受信
    $data = json_decode(file_get_contents("php://input"));

    $items = $data->items ?? [];
    $supplierId = $data->supplierId ?? null;
    $operatorId = $data->operatorId ?? null;
    $storeId = $data->storeId ?? null;

    // デバッグ用ログ
    error_log("Items count: " . count($items));
    error_log("Supplier ID: " . $supplierId);
    error_log("Operator ID: " . $operatorId);
    error_log("Store ID: " . $storeId);
    
    if (empty($items) || !$supplierId || !$operatorId || !$storeId) {
        http_response_code(400); // Bad Request
        echo json_encode(["success" => false, "errors" => ["必要なデータが不足しています。"]]);
        exit();
    }

    $db->beginTransaction();
    try {
        $successCount = 0;
        $errors = [];

        // 在庫更新と入庫ログの記録
        foreach ($items as $item) {
            $productId = $item->productId ?? null;
            $quantity = $item->quantity ?? null;
            $costPrice = $item->costPrice ?? null;

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

            // 入庫履歴は現在のテーブル構造では記録しない
            // 必要に応じて別のテーブルを作成するか、outbound_logsテーブルを拡張する

            $successCount++;
        }

        $db->commit();
        http_response_code(200);
        echo json_encode(["success" => true, "errors" => $errors]);

    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500); // Internal Server Error
        echo json_encode(["success" => false, "errors" => ["データベースエラー: " . $e->getMessage()]]);
    }
} else {
    // サポートされていないメソッド
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "errors" => ["Method not allowed."]]);
}

$db = null;
?>