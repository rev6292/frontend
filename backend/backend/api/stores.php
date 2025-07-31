<?php
require_once __DIR__ . '/cors_headers.php'; // CORSヘッダーをここで処理

require_once __DIR__ . '/../Database.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 店舗一覧の取得
    try {
        $stmt = $db->prepare("SELECT id, name, address, phone FROM stores");
        $stmt->execute();
        $stores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($stores);
    } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "データベースエラー: " . $e->getMessage()));
    }
} elseif ($method === 'POST') {
    // 店舗の追加
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name)) {
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "店舗名が不足しています。"));
        exit();
    }

    $name = $data->name;
    $address = isset($data->address) ? $data->address : null;
    $phone = isset($data->phone) ? $data->phone : null;

    try {
        // IDを自動生成 (UUIDなど)
        $id = uniqid('store_'); // シンプルなユニークIDを生成

        $stmt = $db->prepare("INSERT INTO stores (id, name, address, phone) VALUES (:id, :name, :address, :phone)");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':address', $address);
        $stmt->bindParam(':phone', $phone);

        if ($stmt->execute()) {
            http_response_code(201); // Created
            echo json_encode(array("message" => "店舗が正常に追加されました。", "id" => $id));
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(array("message" => "店舗の追加に失敗しました。"));
        }
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