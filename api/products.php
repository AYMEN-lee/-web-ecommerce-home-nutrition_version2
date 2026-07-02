<?php
/* =============================================================================
   HN NUTRITION — products API
   GET    products.php          → all products
   GET    products.php?id=xxx   → single product
   POST   products.php          → create / update  (admin)
   DELETE products.php?id=xxx   → delete           (admin)
   ============================================================================= */
require __DIR__ . '/config.php';
cors();

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

/* ---- GET ------------------------------------------------------------------ */
if ($method === 'GET') {
    if ($id) {
        $stmt = db()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) json_err('Product not found', 404);
        json_ok(hydrate($product));
    }

    $products = db()->query('SELECT * FROM products ORDER BY created_at ASC')->fetchAll();
    json_ok(array_map('hydrate', $products));
}

/* ---- POST (create / update) ----------------------------------------------- */
if ($method === 'POST') {
    require_admin();
    $data = body();

    if (empty($data['id']) || empty($data['name']) || empty($data['brand'])) {
        json_err('Missing required fields: id, name, brand');
    }

    $pdo = db();

    $pdo->prepare(
        'INSERT INTO products (id, name, brand, category, badge, tagline, description)
         VALUES (:id,:name,:brand,:category,:badge,:tagline,:description)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), brand=VALUES(brand), category=VALUES(category),
           badge=VALUES(badge), tagline=VALUES(tagline), description=VALUES(description)'
    )->execute([
        'id'          => $data['id'],
        'name'        => $data['name'],
        'brand'       => $data['brand'],
        'category'    => $data['category']    ?? '',
        'badge'       => $data['badge']       ?? '',
        'tagline'     => $data['tagline']     ?? '',
        'description' => $data['description'] ?? '',
    ]);

    // Replace flavors (cascade deletes variants automatically)
    $pdo->prepare('DELETE FROM flavors WHERE product_id = ?')->execute([$data['id']]);

    foreach (($data['flavors'] ?? []) as $fi => $flavor) {
        $pdo->prepare('INSERT INTO flavors (product_id, name, image, sort_order) VALUES (?,?,?,?)')
            ->execute([$data['id'], $flavor['name'] ?? '', $flavor['image'] ?? '', $fi]);
        $flavorId = (int) $pdo->lastInsertId();
        foreach (($flavor['variants'] ?? []) as $v) {
            $pdo->prepare('INSERT INTO variants (flavor_id, weight, price, stock) VALUES (?,?,?,?)')
                ->execute([$flavorId, $v['weight'] ?? '', (int)($v['price'] ?? 0), (int)($v['stock'] ?? 0)]);
        }
    }

    json_ok(['id' => $data['id']]);
}

/* ---- DELETE --------------------------------------------------------------- */
if ($method === 'DELETE') {
    require_admin();
    if (!$id) json_err('Missing id');
    db()->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    json_ok(null);
}

json_err('Method not allowed', 405);

/* ---- helpers -------------------------------------------------------------- */
function hydrate(array $product): array {
    $pdo = db();
    $fStmt = $pdo->prepare('SELECT * FROM flavors WHERE product_id = ? ORDER BY sort_order');
    $fStmt->execute([$product['id']]);
    $product['flavors'] = [];
    foreach ($fStmt->fetchAll() as $flavor) {
        $vStmt = $pdo->prepare('SELECT weight, price, stock FROM variants WHERE flavor_id = ?');
        $vStmt->execute([$flavor['id']]);
        $variants = array_map(function ($v) {
            return ['weight' => $v['weight'], 'price' => (int)$v['price'], 'stock' => (int)$v['stock']];
        }, $vStmt->fetchAll());
        $product['flavors'][] = ['name' => $flavor['name'], 'image' => $flavor['image'], 'variants' => $variants];
    }
    return $product;
}
