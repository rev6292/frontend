<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\products.php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 商品一覧の取得
    $stmt = $db->prepare("SELECT p.id, p.name, p.barcode, p.category_id, p.cost_price, p.supplier_id, p.last_updated, p.description,
                                 ir.current_stock, ir.minimum_stock
                          FROM products p
                          JOIN inventory_records ir ON p.id = ir.product_id
                          WHERE ir.store_id = :store_id"); // 仮のstore_idでフィルタリング

    // TODO: フロントエンドからstore_idを受け取るロジックを追加
    // 現状は仮のstore_idを使用
    $store_id = 'store1'; // 仮の店舗ID。実際には認証情報などから取得

    $stmt->bindParam(':store_id', $store_id);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($products);

} else {
    // サポートされていないメソッド
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("message" => "Method not allowed."));
}

// データベース接続を閉じる (PDOはスクリプト終了時に自動的に閉じられるが、明示的に閉じることも可能)
$db = null;
?>