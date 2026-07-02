<?php
/* =============================================================================
   HN NUTRITION — admin auth API
   POST  auth.php?action=login   → validate password, set session
   POST  auth.php?action=logout  → destroy session
   GET   auth.php?action=check   → returns whether session is active
   ============================================================================= */
require __DIR__ . '/config.php';
cors();
boot_session();

$action = $_GET['action'] ?? 'check';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'check') {
    json_ok(['admin' => !empty($_SESSION['hn_admin'])]);
}

if ($action === 'login' && $method === 'POST') {
    $pw = body()['password'] ?? '';
    if ($pw === ADMIN_PASSWORD) {
        $_SESSION['hn_admin'] = true;
        json_ok(['admin' => true]);
    }
    json_err('Wrong password', 401);
}

if ($action === 'logout' && $method === 'POST') {
    $_SESSION = [];
    session_destroy();
    json_ok(null);
}

json_err('Bad request');
