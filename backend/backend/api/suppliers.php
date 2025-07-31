<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\suppliers.php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/cors_headers.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

// デバッグログ: 受信したHTTPメソッドをファイルに記録
file_put_contents('php_method_debug.log', date('Y-m-d H:i:s') . ' - Received method: ' . $method . "\n", FILE_APPEND);

switch ($method) {

    case 'GET':
        try {
            $stmt = $db->prepare("SELECT id, name, contact_person, phone, email, address, line_id FROM suppliers ORDER BY name");
            $stmt->execute();
            $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode($suppliers);
        } catch (PDOException $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $name = $data['name'] ?? null;
        $contactPerson = $data['contactPerson'] ?? null;
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;
        $address = $data['address'] ?? null;
        $lineId = $data['lineId'] ?? null;

        if (!$name) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "仕入先名は必須です。"]);
            exit();
        }

        try {
            $stmt = $db->prepare("INSERT INTO suppliers (name, contact_person, phone, email, address, line_id) VALUES (:name, :contactPerson, :phone, :email, :address, :lineId)");
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':contactPerson', $contactPerson);
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':lineId', $lineId);
            $stmt->execute();

            $newId = $db->lastInsertId();
            http_response_code(201); // Created
            echo json_encode(["message" => "仕入先が追加されました。", "id" => $newId]);
        } catch (PDOException $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $name = $data['name'] ?? null;
        $contactPerson = $data['contactPerson'] ?? null;
        $phone = $data['phone'] ?? null;
        $email = $data['email'] ?? null;
        $address = $data['address'] ?? null;
        $lineId = $data['lineId'] ?? null;

        if (!$id || !$name) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "IDと仕入先名は必須です。"]);
            exit();
        }

        try {
            $stmt = $db->prepare("UPDATE suppliers SET name = :name, contact_person = :contactPerson, phone = :phone, email = :email, address = :address, line_id = :lineId WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':contactPerson', $contactPerson);
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':lineId', $lineId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(["message" => "仕入先が更新されました。"]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["message" => "指定された仕入先が見つかりません。"]);
            }
        } catch (PDOException $e) {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "データベースエラー: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null; // DELETEリクエストは通常URLパラメータでIDを受け取る

        if (!$id) {
            http_response_code(400); // Bad Request
            echo json_encode(["message" => "IDは必須です。"]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM suppliers WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(["message" => "仕入先が削除されました。"]);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(["message" => "指定された仕入先が見つかりません。"]);
            }
        } catch (PDOException $e) {
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