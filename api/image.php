<?php
/* =============================================================================
   HN NUTRITION — flavor image proxy
   GET api/image.php?fid=<flavor_id>
   Serves base64 images stored in DB as real binary with long-lived cache.
   ============================================================================= */
require __DIR__ . '/config.php';

$fid = (int) ($_GET['fid'] ?? 0);
if (!$fid) { http_response_code(400); exit; }

$stmt = db()->prepare('SELECT image FROM flavors WHERE id = ?');
$stmt->execute([$fid]);
$row = $stmt->fetch();

if (!$row || !$row['image']) {
    header('Location: ../assets/img/logo.png', true, 302);
    exit;
}

$raw = $row['image'];

/* ---- Data URI (base64-encoded upload) → decode and stream as binary ------- */
if (substr($raw, 0, 5) === 'data:') {
    $semi  = strpos($raw, ';');
    $mime  = substr($raw, 5, $semi - 5);              /* e.g. image/jpeg */
    $b64   = substr($raw, strpos($raw, ',') + 1);
    $data  = base64_decode($b64);
    if ($data === false) {
        header('Location: ../assets/img/logo.png', true, 302);
        exit;
    }
    $etag = '"' . md5($data) . '"';
    /* 304 Not Modified for returning visitors */
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    if ($ifNoneMatch === $etag) {
        http_response_code(304);
        exit;
    }
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: ' . $etag);
    header('Content-Length: ' . strlen($data));
    echo $data;
    exit;
}

/* ---- Relative file path (e.g. assets/img/...) → redirect to web root ----- */
if (substr($raw, 0, 4) !== 'http') {
    header('Location: ../' . ltrim($raw, '/'), true, 302);
    exit;
}

/* ---- External URL → redirect ----------------------------------------------- */
header('Location: ' . $raw, true, 302);
exit;
