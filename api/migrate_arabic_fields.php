<?php
/* =============================================================================
   HN NUTRITION — one-time migration: add Arabic content columns to products
   Run once: http://localhost/new_gym2/api/migrate_arabic_fields.php
   Safe to re-run — skips columns that already exist.
   ============================================================================= */
require __DIR__ . '/config.php';
cors();
require_admin();

$pdo = db();

$columns = [
    ['name_ar',        "ALTER TABLE products ADD COLUMN name_ar        VARCHAR(200) DEFAULT NULL"],
    ['brand_ar',       "ALTER TABLE products ADD COLUMN brand_ar       VARCHAR(100) DEFAULT NULL"],
    ['tagline_ar',     "ALTER TABLE products ADD COLUMN tagline_ar     VARCHAR(300) DEFAULT NULL"],
    ['description_ar', "ALTER TABLE products ADD COLUMN description_ar TEXT         DEFAULT NULL"],
];

$done    = [];
$skipped = [];

foreach ($columns as [$col, $sql]) {
    $check = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = ?"
    );
    $check->execute([$col]);
    if ($check->fetchColumn()) {
        $skipped[] = $col;
    } else {
        $pdo->exec($sql);
        $done[] = $col;
    }
}

json_ok(['added' => $done, 'skipped' => $skipped]);
