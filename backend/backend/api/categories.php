<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\categories.php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // カテゴリ一覧の取得
    try {
        $stmt = $db->prepare("SELECT id, name, parent_id FROM categories");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($categories);
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