<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\outbound.php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 出庫履歴の取得
    $storeId = isset($_GET['storeId']) ? $_GET['storeId'] : null;
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;
    $productId = isset($_GET['productId']) ? $_GET['productId'] : null;

    try {
        $whereConditions = [];
        $params = [];

        if ($storeId && $storeId !== 'all') {
            $whereConditions[] = "ol.store_id = :storeId";
            $params[':storeId'] = $storeId;
        }

        if ($startDate) {
            $whereConditions[] = "ol.outbound_date >= :startDate";
            $params[':startDate'] = $startDate . ' 00:00:00';
        }

        if ($endDate) {
            $whereConditions[] = "ol.outbound_date <= :endDate";
            $params[':endDate'] = $endDate . ' 23:59:59';
        }

        if ($productId) {
            $whereConditions[] = "ol.product_id = :productId";
            $params[':productId'] = $productId;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        $sql = "
            SELECT 
                ol.id,
                ol.product_id,
                p.name AS product_name,
                p.barcode,
                ol.quantity,
                ol.outbound_date,
                ol.store_id,
                s.name AS store_name,
                ol.notes
            FROM outbound_logs ol
            JOIN products p ON ol.product_id = p.id
            JOIN stores s ON ol.store_id = s.id
            $whereClause
            ORDER BY ol.outbound_date DESC
            LIMIT 1000
        ";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $outboundLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($outboundLogs);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "データベースエラー: " . $e->getMessage()));
    }

} elseif ($method === 'POST') {
    // 出庫記録の追加
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->productId) || !isset($data->quantity) || !isset($data->storeId)) {
        http_response_code(400);
        echo json_encode(array("message" => "商品ID、数量、店舗IDが必要です。"));
        exit();
    }

    try {
        $db->beginTransaction();

        // 出庫記録を追加
        $stmt = $db->prepare("
            INSERT INTO outbound_logs (product_id, quantity, outbound_date, store_id, notes)
            VALUES (:productId, :quantity, NOW(), :storeId, :notes)
        ");
        $stmt->bindParam(':productId', $data->productId);
        $stmt->bindParam(':quantity', $data->quantity);
        $stmt->bindParam(':storeId', $data->storeId);
        $notes = isset($data->notes) ? $data->notes : null;
        $stmt->bindParam(':notes', $notes);
        $stmt->execute();

        // 在庫数を更新
        $stmt = $db->prepare("
            UPDATE inventory_records 
            SET current_stock = current_stock - :quantity,
                last_updated = NOW()
            WHERE product_id = :productId AND store_id = :storeId
        ");
        $stmt->bindParam(':quantity', $data->quantity);
        $stmt->bindParam(':productId', $data->productId);
        $stmt->bindParam(':storeId', $data->storeId);
        $stmt->execute();

        $db->commit();

        http_response_code(201);
        echo json_encode(array("message" => "出庫記録が正常に追加されました。"));

    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(array("message" => "データベースエラー: " . $e->getMessage()));
    }

} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}

$db = null;
?> 