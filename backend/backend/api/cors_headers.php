<?php
// 許可するオリジンを動的に設定
$allowed_origins = [
    "https://frontend-one-zeta-49.vercel.app",
    "https://frontend-zzyeqs1fo-rev6292s-projects.vercel.app",
    "https://frontend-auu6vf0fr-rev6292s-projects.vercel.app",
    "https://frontend-xw5ny2zmz-rev6292s-projects.vercel.app",
    "https://frontend-7h00ytkqr-rev6292s-projects.vercel.app",
    "https://frontend-hwfwfxyov-rev6292s-projects.vercel.app",
    "https://frontend-aif93rjnd-rev6292s-projects.vercel.app",
    "https://frontend-nqzst4x80-rev6292s-projects.vercel.app",
    "https://frontend-30j9d5hy3-rev6292s-projects.vercel.app",
    "https://frontend-dbmqedsjr-rev6292s-projects.vercel.app",
    // 必要に応じてローカル開発環境のURLも追加
    "http://localhost:3000" 
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

// 許可するHTTPメソッド
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// 許可するHTTPヘッダー
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// Cookieの送受信を許可
header("Access-Control-Allow-Credentials: true");

// プリフライトリクエストへの対応
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
