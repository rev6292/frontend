<?php
// C:\Users\touka\Desktop\CLI\最新在庫管理\zaiko\backend\api\upload_pdf.php

require_once dirname(dirname(__DIR__)) . '/Database.php';
require_once __DIR__ . '/cors_headers.php';

// リクエストメソッドの確認
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // アップロードディレクトリのパス
    // TODO: 適切なパスに設定してください。例: /home/your_username/public_html/zaiko/pdfs/
    $uploadDir = dirname(dirname(__DIR__)) . '/pdfs/'; 

    // ディレクトリが存在しない場合は作成
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (isset($_FILES['pdf_file'])) {
        $file = $_FILES['pdf_file'];

        // ファイル名にタイムスタンプを追加してユニークにする
        $fileName = uniqid('purchase_order_') . '.pdf';
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            http_response_code(200);
            echo json_encode(["message" => "PDFが正常にアップロードされました。", "filePath" => $filePath, "fileName" => $fileName]);
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(["message" => "PDFのアップロードに失敗しました。", "error" => $file['error']]);
        }
    } else {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "PDFファイルが提供されていません。"]);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Method not allowed."]);
}
?>