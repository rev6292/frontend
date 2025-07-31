<?php
require_once '../cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // クエリパラメータからstoreId, startDate, endDate, periodLabelを取得
    $storeId = isset($_GET['storeId']) ? $_GET['storeId'] : null;
    $startDateStr = isset($_GET['startDate']) ? $_GET['startDate'] : null;
    $endDateStr = isset($_GET['endDate']) ? $_GET['endDate'] : null;
    $periodLabel = isset($_GET['periodLabel']) ? $_GET['periodLabel'] : null;

    // TODO: 実際には認証情報からユーザーのロールと店舗IDを取得する
    // 現状は仮のデータを使用
    $currentUserId = 'admin'; // 仮の管理者ID

    try {
        // --- 1. 総在庫評価額 ---
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

        // --- 3. 要承認入荷数 (未実装のため0) ---
        $pendingIntakeApprovals = 0; // 現状のDBスキーマでは直接取得できないため0

        // --- 4. 不良在庫品目数と金額 (6ヶ月以上動きなし) ---
        $obsoleteStockItemsCount = 0;
        $obsoleteStockValue = 0;
        $sixMonthsAgo = date('Y-m-d H:i:s', strtotime('-6 months'));

        $stmt = $db->prepare("
            SELECT COUNT(p.id) AS count, SUM(p.cost_price * ir.current_stock) AS total_value
            FROM products p
            JOIN inventory_records ir ON p.id = ir.product_id
            WHERE ir.last_updated < :sixMonthsAgo
            AND (:storeId IS NULL OR ir.store_id = :storeId)
        ");
        $stmt->bindParam(':sixMonthsAgo', $sixMonthsAgo);
        $stmt->bindParam(':storeId', $storeId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $obsoleteStockItemsCount = $result['count'] ?? 0;
        $obsoleteStockValue = $result['total_value'] ?? 0;

        // --- 5. 当月仕入総額 (currentCalendarMonthStats) ---
        $currentMonthTotalMaterialCost = 0;
        $currentMonthStart = date('Y-m-01 00:00:00');
        $currentMonthEnd = date('Y-m-t 23:59:59'); // Y-m-t はその月の最終日

        $stmt = $db->prepare("
            SELECT SUM(quantity * cost_price_at_intake) AS total_cost
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
        $currentMonthTotalMaterialCost = $result['total_cost'] ?? 0;

        // --- 6. 当月入庫アイテム総数 ---
        $totalIntakeItemsThisMonth = 0;
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

        // --- 7. 当月出庫アイテム総数 ---
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

        // --- 8. 当月人気商品ランキング (出庫数TOP5) ---
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

        // --- 9. 在庫推移 (過去6ヶ月) ---
        $inventoryMovement = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = date('Y-m-01 00:00:00', strtotime("-$i months"));
            $monthEnd = date('Y-m-t 23:59:59', strtotime("-$i months"));
            $monthLabel = date('Y-m', strtotime("-$i months"));

            // 入庫
            $stmtIntake = $db->prepare("
                SELECT SUM(quantity) AS total_quantity
                FROM scheduled_intake_items
                WHERE status = 'RECEIVED'
                AND received_date BETWEEN :monthStart AND :monthEnd
                AND (:storeId IS NULL OR store_id = :storeId)
            ");
            $stmtIntake->bindParam(':monthStart', $monthStart);
            $stmtIntake->bindParam(':monthEnd', $monthEnd);
            $stmtIntake->bindParam(':storeId', $storeId);
            $stmtIntake->execute();
            $intake = $stmtIntake->fetch(PDO::FETCH_ASSOC)['total_quantity'] ?? 0;

            // 出庫
            $stmtOutbound = $db->prepare("
                SELECT SUM(quantity) AS total_quantity
                FROM outbound_logs
                WHERE outbound_date BETWEEN :monthStart AND :monthEnd
                AND (:storeId IS NULL OR store_id = :storeId)
            ");
            $stmtOutbound->bindParam(':monthStart', $monthStart);
            $stmtOutbound->bindParam(':monthEnd', $monthEnd);
            $stmtOutbound->bindParam(':storeId', $storeId);
            $stmtOutbound->execute();
            $outbound = $stmtOutbound->fetch(PDO::FETCH_ASSOC)['total_quantity'] ?? 0;

            $inventoryMovement[] = [
                'month' => $monthLabel,
                'intake' => (int)$intake,
                'outbound' => (int)$outbound
            ];
        }

        // --- 10. カテゴリ別 ポートフォリオ分析 ---
        $categoryPerformance = [];
        $threeMonthsAgo = date('Y-m-d H:i:s', strtotime('-3 months'));

        $stmtCategories = $db->prepare("SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL");
        $stmtCategories->execute();
        $parentCategories = $stmtCategories->fetchAll(PDO::FETCH_ASSOC);

        foreach ($parentCategories as $parentCat) {
            $allCatIds = [$parentCat['id']];
            $stmtChildCats = $db->prepare("SELECT id FROM categories WHERE parent_id = :parentId");
            $stmtChildCats->bindParam(':parentId', $parentCat['id']);
            $stmtChildCats->execute();
            $childCats = $stmtChildCats->fetchAll(PDO::FETCH_COLUMN);
            $allCatIds = array_merge($allCatIds, $childCats);

            // 名前付きプレースホルダを動的に生成
            $categoryPlaceholders = [];
            foreach ($allCatIds as $idx => $catId) {
                $categoryPlaceholders[] = ":catId" . $idx;
            }
            $categoryInClause = implode(',', $categoryPlaceholders);

            // 在庫金額
            $stmtInventoryValue = $db->prepare("
                SELECT SUM(p.cost_price * ir.current_stock) AS inventoryValue
                FROM products p
                JOIN inventory_records ir ON p.id = ir.product_id
                WHERE p.category_id IN ($categoryInClause)
                AND (:storeId IS NULL OR ir.store_id = :storeId)
            ");
            foreach ($allCatIds as $idx => $catId) {
                $stmtInventoryValue->bindValue(":catId" . $idx, $catId, PDO::PARAM_STR);
            }
            $stmtInventoryValue->bindParam(':storeId', $storeId);
            $stmtInventoryValue->execute();
            $inventoryValue = $stmtInventoryValue->fetch(PDO::FETCH_ASSOC)['inventoryValue'] ?? 0;

            // 出庫数 (直近3ヶ月)
            $stmtOutboundQty = $db->prepare("
                SELECT SUM(ol.quantity) AS outboundQty
                FROM outbound_logs ol
                JOIN products p ON ol.product_id = p.id
                WHERE ol.outbound_date >= :threeMonthsAgo
                AND p.category_id IN ($categoryInClause)
                AND (:storeId IS NULL OR ol.store_id = :storeId)
            ");
            $stmtOutboundQty->bindParam(':threeMonthsAgo', $threeMonthsAgo);
            foreach ($allCatIds as $idx => $catId) {
                $stmtOutboundQty->bindValue(":catId" . $idx, $catId, PDO::PARAM_STR);
            }
            $stmtOutboundQty->bindParam(':storeId', $storeId);
            $stmtOutboundQty->execute();
            $outboundQtyLast3Months = $stmtOutboundQty->fetch(PDO::FETCH_ASSOC)['outboundQty'] ?? 0;

            // 現在庫数
            $stmtCurrentStock = $db->prepare("
                SELECT SUM(ir.current_stock) AS currentStock
                FROM inventory_records ir
                JOIN products p ON ir.product_id = p.id
                WHERE p.category_id IN ($categoryInClause)
                AND (:storeId IS NULL OR ir.store_id = :storeId)
            ");
            foreach ($allCatIds as $idx => $catId) {
                $stmtCurrentStock->bindValue(":catId" . $idx, $catId, PDO::PARAM_STR);
            }
            $stmtCurrentStock->bindParam(':storeId', $storeId);
            $stmtCurrentStock->execute();
            $currentStockInCategory = $stmtCurrentStock->fetch(PDO::FETCH_ASSOC)['currentStock'] ?? 0;

            $turnoverRate = $currentStockInCategory > 0 ? $outboundQtyLast3Months / $currentStockInCategory : 0;

            if ($inventoryValue > 0) {
                $categoryPerformance[] = [
                    'categoryId' => $parentCat['id'],
                    'categoryName' => $parentCat['name'],
                    'inventoryValue' => (float)$inventoryValue,
                    'turnoverRate' => (float)$turnoverRate
                ];
            }
        }
        // 在庫金額でソート
        usort($categoryPerformance, function($a, $b) {
            return $b['inventoryValue'] <=> $a['inventoryValue'];
        });


        // --- 11. 在庫回転率 (全体) ---
        $inventoryTurnoverRate = 0;
        $outboundValueLast3Months = 0;

        $stmtOutboundValue = $db->prepare("
            SELECT SUM(ol.quantity * p.cost_price) AS total_value
            FROM outbound_logs ol
            JOIN products p ON ol.product_id = p.id
            WHERE ol.outbound_date >= :threeMonthsAgo
            AND (:storeId IS NULL OR ol.store_id = :storeId)
        ");
        $stmtOutboundValue->bindParam(':threeMonthsAgo', $threeMonthsAgo);
        $stmtOutboundValue->bindParam(':storeId', $storeId);
        $stmtOutboundValue->execute();
        $outboundValueLast3Months = $stmtOutboundValue->fetch(PDO::FETCH_ASSOC)['total_value'] ?? 0;

        if ($totalInventoryValue > 0) {
            $inventoryTurnoverRate = ($outboundValueLast3Months * 4) / $totalInventoryValue;
        }


        // --- 12. 要注意在庫リスト (不良在庫と過剰在庫) ---
        $inventoryWatchlist = [];
        // 不良在庫 (6ヶ月以上更新がない商品)
        $stmtObsoleteProducts = $db->prepare("
            SELECT p.id, p.name, p.barcode, p.cost_price, ir.current_stock, ir.minimum_stock, ir.last_updated
            FROM products p
            JOIN inventory_records ir ON p.id = ir.product_id
            WHERE ir.last_updated < :sixMonthsAgo
            AND (:storeId IS NULL OR ir.store_id = :storeId)
            ORDER BY ir.last_updated ASC
        ");
        $stmtObsoleteProducts->bindParam(':sixMonthsAgo', $sixMonthsAgo);
        $stmtObsoleteProducts->bindParam(':storeId', $storeId);
        $stmtObsoleteProducts->execute();
        $obsoleteProducts = $stmtObsoleteProducts->fetchAll(PDO::FETCH_ASSOC);

        foreach ($obsoleteProducts as $prod) {
            $lastUpdatedDate = new DateTime($prod['last_updated']);
            $now = new DateTime();
            $interval = $now->diff($lastUpdatedDate);
            $daysSinceLastUpdate = $interval->days;
            $inventoryWatchlist[] = [
                'product' => [
                    'id' => $prod['id'],
                    'name' => $prod['name'],
                    'barcode' => $prod['barcode'],
                    'costPrice' => (float)$prod['cost_price'],
                    'currentStock' => (int)$prod['current_stock'],
                    'minimumStock' => (int)$prod['minimum_stock'],
                    'lastUpdated' => $prod['last_updated'],
                ],
                'reason' => 'obsolete',
                'daysSinceLastUpdate' => $daysSinceLastUpdate
            ];
        }

        // 過剰在庫 (最低在庫の5倍以上かつ20点以上)
        $stmtExcessProducts = $db->prepare("
            SELECT p.id, p.name, p.barcode, p.cost_price, ir.current_stock, ir.minimum_stock, ir.last_updated
            FROM products p
            JOIN inventory_records ir ON p.id = ir.product_id
            WHERE ir.current_stock > ir.minimum_stock * 5
            AND ir.current_stock > 20
            AND ir.minimum_stock > 0
            AND (:storeId IS NULL OR ir.store_id = :storeId)
        ");
        $stmtExcessProducts->bindParam(':storeId', $storeId);
        $stmtExcessProducts->execute();
        $excessProducts = $stmtExcessProducts->fetchAll(PDO::FETCH_ASSOC);

        foreach ($excessProducts as $prod) {
            $lastUpdatedDate = new DateTime($prod['last_updated']);
            $now = new DateTime();
            $interval = $now->diff($lastUpdatedDate);
            $daysSinceLastUpdate = $interval->days;
            $inventoryWatchlist[] = [
                'product' => [
                    'id' => $prod['id'],
                    'name' => $prod['name'],
                    'barcode' => $prod['barcode'],
                    'costPrice' => (float)$prod['cost_price'],
                    'currentStock' => (int)$prod['current_stock'],
                    'minimumStock' => (int)$prod['minimum_stock'],
                    'lastUpdated' => $prod['last_updated'],
                ],
                'reason' => 'excess',
                'daysSinceLastUpdate' => $daysSinceLastUpdate
            ];
        }
        // daysSinceLastUpdate でソート
        usort($inventoryWatchlist, function($a, $b) {
            return $b['daysSinceLastUpdate'] <=> $a['daysSinceLastUpdate'];
        });


        $response = [
            'totalInventoryValue' => (float)$totalInventoryValue,
            'lowStockItemsCount' => (int)$lowStockItemsCount,
            'pendingIntakeApprovals' => (int)$pendingIntakeApprovals,
            'obsoleteStockItemsCount' => (int)$obsoleteStockItemsCount,
            'selectedPeriodSummary' => [
                'periodLabel' => $periodLabel,
                'supplierPerformances' => [], // TODO: 後で実装
                'totalForPeriod' => 0, // TODO: 後で実装
                'totalForPreviousPeriod' => 0, // TODO: 後で実装
            ],
            'currentCalendarMonthStats' => [
                'month' => date('Y-m'),
                'totalMaterialCost' => (float)$currentMonthTotalMaterialCost,
            ],
            'totalIntakeItemsThisMonth' => (int)$totalIntakeItemsThisMonth,
            'totalOutboundItemsThisMonth' => (int)$totalOutboundItemsThisMonth,
            'topOutboundProductsThisMonth' => $topOutboundProductsThisMonth,
            'inventoryWatchlist' => $inventoryWatchlist,
            'obsoleteStockValue' => (float)$obsoleteStockValue,
            'inventoryTurnoverRate' => (float)$inventoryTurnoverRate,
            'inventoryMovement' => $inventoryMovement,
            'categoryPerformance' => $categoryPerformance,
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