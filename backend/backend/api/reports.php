<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\reports.php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $reportType = isset($_GET['type']) ? $_GET['type'] : 'inventory';
    $storeId = isset($_GET['storeId']) ? $_GET['storeId'] : null;
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : null;

    try {
        switch ($reportType) {
            case 'inventory':
                // 在庫レポート
                $sql = "
                    SELECT 
                        p.id,
                        p.name AS product_name,
                        p.barcode,
                        p.cost_price,
                        ir.current_stock,
                        ir.minimum_stock,
                        ir.last_updated,
                        c.name AS category_name,
                        s.name AS store_name
                    FROM products p
                    JOIN inventory_records ir ON p.id = ir.product_id
                    LEFT JOIN categories c ON p.category_id = c.id
                    JOIN stores s ON ir.store_id = s.id
                    WHERE (:storeId IS NULL OR ir.store_id = :storeId)
                    ORDER BY ir.current_stock ASC
                ";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':storeId', $storeId);
                $stmt->execute();
                $report = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'outbound':
                // 出庫レポート
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

                $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

                $sql = "
                    SELECT 
                        p.name AS product_name,
                        p.barcode,
                        SUM(ol.quantity) AS total_outbound,
                        COUNT(ol.id) AS outbound_count,
                        s.name AS store_name
                    FROM outbound_logs ol
                    JOIN products p ON ol.product_id = p.id
                    JOIN stores s ON ol.store_id = s.id
                    $whereClause
                    GROUP BY p.id, p.name, p.barcode, s.name
                    ORDER BY total_outbound DESC
                ";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $report = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'intake':
                // 入庫レポート
                $whereConditions = [];
                $params = [];

                if ($storeId && $storeId !== 'all') {
                    $whereConditions[] = "sii.store_id = :storeId";
                    $params[':storeId'] = $storeId;
                }

                if ($startDate) {
                    $whereConditions[] = "sii.received_date >= :startDate";
                    $params[':startDate'] = $startDate . ' 00:00:00';
                }

                if ($endDate) {
                    $whereConditions[] = "sii.received_date <= :endDate";
                    $params[':endDate'] = $endDate . ' 23:59:59';
                }

                $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

                $sql = "
                    SELECT 
                        p.name AS product_name,
                        p.barcode,
                        SUM(sii.quantity) AS total_intake,
                        COUNT(sii.id) AS intake_count,
                        s.name AS store_name
                    FROM scheduled_intake_items sii
                    JOIN products p ON sii.product_id = p.id
                    JOIN stores s ON sii.store_id = s.id
                    WHERE sii.status = 'RECEIVED'
                    $whereClause
                    GROUP BY p.id, p.name, p.barcode, s.name
                    ORDER BY total_intake DESC
                ";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $report = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'low_stock':
                // 在庫僅少レポート
                $sql = "
                    SELECT 
                        p.id,
                        p.name AS product_name,
                        p.barcode,
                        p.cost_price,
                        ir.current_stock,
                        ir.minimum_stock,
                        (ir.minimum_stock - ir.current_stock) AS shortage,
                        c.name AS category_name,
                        s.name AS store_name
                    FROM products p
                    JOIN inventory_records ir ON p.id = ir.product_id
                    LEFT JOIN categories c ON p.category_id = c.id
                    JOIN stores s ON ir.store_id = s.id
                    WHERE ir.current_stock < ir.minimum_stock
                    AND (:storeId IS NULL OR ir.store_id = :storeId)
                    ORDER BY shortage DESC
                ";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':storeId', $storeId);
                $stmt->execute();
                $report = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            default:
                http_response_code(400);
                echo json_encode(array("message" => "無効なレポートタイプです。"));
                exit();
        }

        http_response_code(200);
        echo json_encode($report);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "データベースエラー: " . $e->getMessage()));
    }

} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}

$db = null;
?> 