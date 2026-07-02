<?php
/* =============================================================================
   HN NUTRITION — API shared config
   ============================================================================= */

// ---- Database ---------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'hn_nutrition');
define('DB_USER', 'root');
define('DB_PASS', '');          // XAMPP default: no password

// ---- Admin password (change this!) ------------------------------------------
define('ADMIN_PASSWORD', 'hn-admin');

// ---- CORS (allows both same-origin Apache and VS Code Live Server) -----------
function cors(): void {
    $allowed = [
        'http://localhost', 'http://127.0.0.1',
        'http://localhost:5500', 'http://127.0.0.1:5500',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

// ---- Session ----------------------------------------------------------------
function boot_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['samesite' => 'Lax', 'httponly' => true]);
        session_start();
    }
}

// ---- PDO singleton ----------------------------------------------------------
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

// ---- Response helpers -------------------------------------------------------
function json_ok(mixed $data = null): never {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}
function json_err(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

// ---- Auth gate --------------------------------------------------------------
function require_admin(): void {
    boot_session();
    if (empty($_SESSION['hn_admin'])) json_err('Unauthorized', 401);
}

// ---- Read JSON body ---------------------------------------------------------
function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}
