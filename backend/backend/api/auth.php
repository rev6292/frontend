<?php
require_once __DIR__ . '/cors_headers.php';
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\auth.php

require_once __DIR__ . '/../Database.php';

// データベース接続
$database = new Database();
$db = $database->getConnection();

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // POSTリクエストのボディからJSONデータを取得
    $data = json_decode(file_get_contents("php://input"));

    // 必要なデータが存在するか確認
    if (!isset($data->id) || !isset($data->password)) {
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "ユーザーIDとパスワードが必要です。"));
        exit();
    }

    $userId = $data->id;
    $password = $data->password;

    // デバッグログ: 受信したユーザーIDとパスワード
    error_log("DEBUG: Received userId: " . $userId . ", Password: " . $password);

    try {
        // デバッグログ: SQLクエリの準備
        error_log("DEBUG: Preparing SQL query for userId: " . $userId);
        $stmt = $db->prepare("SELECT id, name, role, store_id, hashed_password FROM users WHERE id = :id LIMIT 1");
        $stmt->bindParam(':id', $userId);
        
        // デバッグログ: SQLクエリの実行
        error_log("DEBUG: Executing SQL query.");
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // デバッグログ: データベースから取得したユーザー情報
        if ($user) {
            error_log("DEBUG: User found in DB: " . json_encode($user));
            // デバッグログ: データベースから取得したハッシュ
            error_log("DEBUG: Hashed password from DB: " . $user['hashed_password']);

            // パスワード検証
            $password_match = password_verify($password, $user['hashed_password']);

            // デバッグログ: password_verify() の結果
            error_log("DEBUG: password_verify() result: " . ($password_match ? "TRUE" : "FALSE"));

            if ($password_match) {
                // 認証成功
                http_response_code(200);
                // パスワードハッシュは返さない
                unset($user['hashed_password']);
                echo json_encode($user);
            } else {
                // 認証失敗
                http_response_code(401); // Unauthorized
                echo json_encode(array("message" => "ユーザーIDまたはパスワードが正しくありません。"));
            }
        } else {
            // ユーザーが存在しない場合
            error_log("DEBUG: User not found in DB for userId: " . $userId);
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "ユーザーIDまたはパスワードが正しくありません。"));
        }
    } catch (PDOException $e) {
        // デバッグログ: データベースクエリエラー
        error_log("DEBUG: Database query error: " . $e->getMessage());
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