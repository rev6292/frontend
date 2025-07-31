<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\Database.php

require_once __DIR__ . '/config.php';

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    /**
     * データベース接続を取得する
     *
     * @return PDO|null データベース接続オブジェクト、またはnull（接続失敗時）
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4") // 文字コード設定
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // エラーモード設定
        } catch(PDOException $exception) {
            error_log("データベース接続エラー: " . $exception->getMessage());
            // 本番環境では詳細なエラーメッセージをクライアントに返さない
            // throw new Exception("データベース接続に失敗しました。");
            return null; // 接続失敗時はnullを返す
        }

        return $this->conn;
    }

    /**
     * CORSヘッダーを設定する
     */
    public static function setCorsHeaders() {
        // OPTIONSリクエストの場合はここで終了
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
?>