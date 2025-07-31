<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\dashboard\staff.php

require_once dirname(dirname(__DIR__)) . '/Database.php';

// CORSヘッダーを設定
header("Access-Control-Allow-Origin: https://frontend-2omhcjare-rev6292s-projects.vercel.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400"); // プリフライトリクエストの結果をキャッシュする時間 (24時間)

// OPTIONSリクエストの場合はここで終了
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // クエリパラメータからstoreIdを取得
    $storeId = isset($_GET['storeId']) ? $_GET['storeId'] : null;

    // TODO: 実際には認証情報からユーザーのロールと店舗IDを取得する
    // 現状は仮のデータを使用
    $currentUserId = 'staff1'; // 仮のスタッフID

    try {
        // --- 1. 総在庫評価額 (概算) ---
        $totalInventoryValue = 0;
        $stmt = $db->prepare("
            SELECT SUM(p.cost_price * ir.current_stock) AS total_value
            FROM products p
            JOIN inventory_records ir ON p.id = ir.product_id
            WHERE (:storeId IS NULL OR ir.store_id = :storeId)
        ");
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalInventoryValue = $result['total_value'] ?? 0;
        $approxTotalInventoryValue = '約 ¥' . number_format(floor($totalInventoryValue / 10000) * 10000);

        // --- 2. 在庫僅少品目数 ---
        $lowStockItemsCount = 0;
        $stmt = $db->prepare("
            SELECT COUNT(*) AS count
            FROM inventory_records
            WHERE current_stock < minimum_stock
            AND (:storeId IS NULL OR store_id = :storeId)
        ");
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $lowStockItemsCount = $result['count'] ?? 0;

        // --- 3. 当月入庫アイテム総数 ---
        $totalIntakeItemsThisMonth = 0;
        $currentMonthStart = date('Y-m-01 00:00:00');
        $currentMonthEnd = date('Y-m-t 23:59:59');

        $stmt = $db->prepare("
            SELECT SUM(quantity) AS total_quantity
            FROM scheduled_intake_items
            WHERE status = 'RECEIVED'
            AND received_date BETWEEN :currentMonthStart AND :currentMonthEnd
            AND (:storeId IS NULL OR store_id = :storeId)
        ");
        $stmt->bindParam(':currentMonthStart', $currentMonthStart);
        $stmt->bindParam(':currentMonthEnd', $currentMonthEnd);
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalIntakeItemsThisMonth = $result['total_quantity'] ?? 0;

        // --- 4. 当月出庫アイテム総数 ---
        $totalOutboundItemsThisMonth = 0;
        $stmt = $db->prepare("
            SELECT SUM(quantity) AS total_quantity
            FROM outbound_logs
            WHERE outbound_date BETWEEN :currentMonthStart AND :currentMonthEnd
            AND (:storeId IS NULL OR store_id = :storeId)
        ");
        $stmt->bindParam(':currentMonthStart', $currentMonthStart);
        $stmt->bindParam(':currentMonthEnd', $currentMonthEnd);
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalOutboundItemsThisMonth = $result['total_quantity'] ?? 0;

        // --- 5. 当月人気商品ランキング (出庫数TOP5) ---
        $topOutboundProductsThisMonth = [];
        $stmt = $db->prepare("
            SELECT p.id AS productId, p.name AS productName, SUM(ol.quantity) AS totalQuantity
            FROM outbound_logs ol
            JOIN products p ON ol.product_id = p.id
            WHERE ol.outbound_date BETWEEN :currentMonthStart AND :currentMonthEnd
            AND (:storeId IS NULL OR ol.store_id = :storeId)
            GROUP BY p.id, p.name
            ORDER BY totalQuantity DESC
            LIMIT 5
        ");
        $stmt->bindParam(':currentMonthStart', $currentMonthStart);
        $stmt->bindParam(':currentMonthEnd', $currentMonthEnd);
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $topOutboundProductsThisMonth = $stmt->fetchAll(PDO::FETCH_ASSOC);


        $response = [
            'approxTotalInventoryValue' => $approxTotalInventoryValue,
            'lowStockItemsCount' => (int)$lowStockItemsCount,
            'totalIntakeItemsThisMonth' => (int)$totalIntakeItemsThisMonth,
            'totalOutboundItemsThisMonth' => (int)$totalOutboundItemsThisMonth,
            'topOutboundProductsThisMonth' => $topOutboundProductsThisMonth,
        ];

        http_response_code(200);
        echo json_encode($response);

    } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "データベースエラー: " . $e->getMessage()));
    }
} else {
    // サポートされていないメソッド
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("message" => "Method not allowed."));
}

$db = null;
?>