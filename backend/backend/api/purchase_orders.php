<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\purchase_orders.php

header('Content-Type: application/json');
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// データベース接続のデバッグ
if ($db === null) {
    http_response_code(500);
    echo json_encode(["message" => "データベース接続に失敗しました。config.phpの設定を確認してください。", "db_name" => DB_NAME]);
    exit();
}

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

// デバッグログ: 受信したHTTPメソッドをファイルに記録
file_put_contents('php_method_debug.log', date('Y-m-d H:i:s') . ' - Received method: ' . $method . "\n", FILE_APPEND);

switch ($method) {

    case 'GET':
        // GETパラメータを明確に分離
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        $storeId = isset($_GET['storeId']) ? $_GET['storeId'] : null;

        try {
            if ($id) {
                // 特定の発注書を取得
                $stmt = $db->prepare("
                    SELECT po.id, po.order_date, po.completed_date, po.supplier_id, s.name AS supplier_name, po.store_id, po.status, po.notes, po.created_by_id,
                           poi.product_id, p.name AS product_name, p.barcode, poi.quantity, poi.cost_price_at_order, poi.is_received
                    FROM purchase_orders po
                    JOIN suppliers s ON po.supplier_id = s.id
                    LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
                    LEFT JOIN products p ON poi.product_id = p.id
                    WHERE po.id = :id
                    " . ($storeId ? "AND po.store_id = :storeId" : "") . "
                ");
                $stmt->bindParam(':id', $id);
                if ($storeId) $stmt->bindParam(':storeId', $storeId);
                $stmt->execute();
                $rawOrder = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (empty($rawOrder)) {
                    http_response_code(404); // Not Found
                    echo json_encode(["message" => "指定された発注書が見つかりません。"]);
                    exit();
                }

                $purchaseOrder = [
                    'id' => $rawOrder[0]['id'],
                    'orderDate' => $rawOrder[0]['order_date'],
                    'completedDate' => $rawOrder[0]['completed_date'],
                    'supplierId' => $rawOrder[0]['supplier_id'],
                    'supplierName' => $rawOrder[0]['supplier_name'],
                    'storeId' => $rawOrder[0]['store_id'],
                    'status' => $rawOrder[0]['status'],
                    'notes' => $rawOrder[0]['notes'],
                    'createdById' => $rawOrder[0]['created_by_id'],
                    'items' => []
                ];

                foreach ($rawOrder as $row) {
                    if ($row['product_id']) {
                        $purchaseOrder['items'][] = [
                            'productId' => $row['product_id'],
                            'productName' => $row['product_name'],
                            'barcode' => $row['barcode'],
                            'quantity' => (int)$row['quantity'],
                            'costPriceAtOrder' => (float)$row['cost_price_at_order'],
                            'isReceived' => (bool)$row['is_received']
                        ];
                    }
                }

                http_response_code(200);
                echo json_encode($purchaseOrder);

            } else {
                // GETパラメータとSQLクエリのデバッグログ
                error_log("GET request for purchase orders. storeId: " . ($storeId ?? 'null'));

                // 全ての発注書を取得 (デバッグ用: 最も単純なクエリ)
                $sql = "
                    SELECT id, order_date, supplier_id, store_id, status
                    FROM purchase_orders
                    ORDER BY order_date DESC
                ";
                
                error_log("Executing simplified SQL: " . $sql);

                $stmt = $db->prepare($sql);
                $stmt->execute();
                $purchaseOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

                error_log("Rows found after simplified fetchAll: " . count($purchaseOrders));

                // 実際に接続しているデータベース名を取得して出力
                $currentDbName = $db->query("SELECT DATABASE()")->fetchColumn();
                error_log("Connected to database: " . $currentDbName);

                http_response_code(200);
                echo json_encode($purchaseOrders);
            }
        } catch (PDOException $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $orderDate = $data['orderDate'] ?? null;
        $supplierId = $data['supplierId'] ?? null;
        $storeId = $data['storeId'] ?? null;
        $items = $data['items'] ?? [];
        $notes = $data['notes'] ?? null;
        $createdById = $data['createdById'] ?? null;

        if (!$orderDate || !$supplierId || !$storeId || empty($items) || !$createdById) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "必要なデータが不足しています。"]);
            exit();
        }

        $db->beginTransaction();
        try {
            // purchase_orders テーブルに挿入
            $purchaseOrderId = uniqid('po_'); // ユニークなIDを生成
            $stmt = $db->prepare("INSERT INTO purchase_orders (id, order_date, supplier_id, store_id, status, notes, created_by_id) VALUES (:id, :orderDate, :supplierId, :storeId, 'ORDERED', :notes, :createdById)");
            $stmt->bindParam(':id', $purchaseOrderId);
            $stmt->bindParam(':orderDate', $orderDate);
            $stmt->bindParam(':supplierId', $supplierId);
            $stmt->bindParam(':storeId', $storeId);
            $stmt->bindParam(':notes', $notes);
            $stmt->bindParam(':createdById', $createdById);
            $stmt->execute();

            // purchase_order_items テーブルに挿入
            $stmtItem = $db->prepare("INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost_price_at_order, is_received) VALUES (:purchaseOrderId, :productId, :quantity, :costPriceAtOrder, FALSE)");
            foreach ($items as $item) {
                $stmtItem->bindParam(':purchaseOrderId', $purchaseOrderId);
                $stmtItem->bindParam(':productId', $item['productId']);
                $stmtItem->bindParam(':quantity', $item['quantity']);
                $stmtItem->bindParam(':costPriceAtOrder', $item['costPriceAtOrder']);
                $stmtItem->execute();
            }

            $db->commit();
            http_response_code(201); // Created
            echo json_encode(["message" => "発注書が正常に作成されました。", "id" => $purchaseOrderId]);

        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // 発注書の更新 (例: ステータス更新、アイテムの受領など)
        $data = json_decode(file_get_contents("php://input"), true);
        $purchaseOrderId = $data['purchaseOrderId'] ?? null;
        $receivedItems = $data['receivedItems'] ?? []; // [{ productId, quantity }]
        $userId = $data['userId'] ?? null;

        if (!$purchaseOrderId || empty($receivedItems) || !$userId) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "必要なデータが不足しています。"]);
            exit();
        }

        $db->beginTransaction();
        try {
            $allReceived = true;
            foreach ($receivedItems as $receivedItem) {
                $productId = $receivedItem['productId'];
                $quantity = $receivedItem['quantity'];

                // purchase_order_items の is_received を更新
                $stmtUpdateItem = $db->prepare("UPDATE purchase_order_items SET is_received = TRUE WHERE purchase_order_id = :purchaseOrderId AND product_id = :productId");
                $stmtUpdateItem->bindParam(':purchaseOrderId', $purchaseOrderId);
                $stmtUpdateItem->bindParam(':productId', $productId);
                $stmtUpdateItem->execute();

                // inventory_records の current_stock を更新
                $stmtUpdateStock = $db->prepare("UPDATE inventory_records SET current_stock = current_stock + :quantity, last_updated = NOW() WHERE product_id = :productId");
                $stmtUpdateStock->bindParam(':quantity', $quantity);
                $stmtUpdateStock->bindParam(':productId', $productId);
                $stmtUpdateStock->execute();

                // outbound_logs に入庫履歴を記録
                $stmtLog = $db->prepare("INSERT INTO outbound_logs (product_id, store_id, quantity, outbound_date, type, operator_id) VALUES (:productId, (SELECT store_id FROM purchase_orders WHERE id = :purchaseOrderId), :quantity, NOW(), 'intake', :operatorId)");
                $stmtLog->bindParam(':productId', $productId);
                $stmtLog->bindParam(':purchaseOrderId', $purchaseOrderId);
                $stmtLog->bindParam(':quantity', $quantity);
                $stmtLog->bindParam(':operatorId', $userId);
                $stmtLog->execute();
            }

            // 全てのアイテムが受領済みかチェックし、purchase_orders のステータスを更新
            $stmtCheckAllReceived = $db->prepare("SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = :purchaseOrderId AND is_received = FALSE");
            $stmtCheckAllReceived->bindParam(':purchaseOrderId', $purchaseOrderId);
            $stmtCheckAllReceived->execute();
            if ($stmtCheckAllReceived->fetchColumn() == 0) {
                $stmtUpdateStatus = $db->prepare("UPDATE purchase_orders SET status = 'COMPLETED', completed_date = NOW() WHERE id = :purchaseOrderId");
                $stmtUpdateStatus->bindParam(':purchaseOrderId', $purchaseOrderId);
                $stmtUpdateStatus->execute();
            } else {
                $stmtUpdateStatus = $db->prepare("UPDATE purchase_orders SET status = 'PARTIALLY_RECEIVED' WHERE id = :purchaseOrderId");
                $stmtUpdateStatus->bindParam(':purchaseOrderId', $purchaseOrderId);
                $stmtUpdateStatus->execute();
            }

            $db->commit();
            http_response_code(200); // OK
            echo json_encode(["message" => "発注書が正常に処理されました。", "updatedStatus" => $stmtUpdateStatus->fetchColumn()]);

        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["message" => "Method not allowed."]);
        break;
}

$db = null;
?>