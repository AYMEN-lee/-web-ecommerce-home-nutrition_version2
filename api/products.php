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
        json_ok(hydrate_all([$product])[0]);
    }

    $products = db()->query('SELECT * FROM products ORDER BY created_at ASC')->fetchAll();
    json_ok(hydrate_all($products));
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
        'INSERT INTO products (id, name, brand, category, badge, tagline, description,
                               name_ar, brand_ar, tagline_ar, description_ar)
         VALUES (:id,:name,:brand,:category,:badge,:tagline,:description,
                 :name_ar,:brand_ar,:tagline_ar,:description_ar)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), brand=VALUES(brand), category=VALUES(category),
           badge=VALUES(badge), tagline=VALUES(tagline), description=VALUES(description),
           name_ar=VALUES(name_ar), brand_ar=VALUES(brand_ar),
           tagline_ar=VALUES(tagline_ar), description_ar=VALUES(description_ar)'
    )->execute([
        'id'             => $data['id'],
        'name'           => $data['name'],
        'brand'          => $data['brand'],
        'category'       => $data['category']    ?? '',
        'badge'          => $data['badge']       ?? '',
        'tagline'        => $data['tagline']     ?? '',
        'description'    => $data['description'] ?? '',
        'name_ar'        => ($data['name_ar']        ?? '') ?: null,
        'brand_ar'       => ($data['brand_ar']       ?? '') ?: null,
        'tagline_ar'     => ($data['tagline_ar']     ?? '') ?: null,
        'description_ar' => ($data['description_ar'] ?? '') ?: null,
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
function hydrate_all(array $products): array {
    if (empty($products)) return [];

    $pdo        = db();
    $productIds = array_column($products, 'id');

    // Query 1: all flavors for every product in one shot
    $ph    = implode(',', array_fill(0, count($productIds), '?'));
    $fStmt = $pdo->prepare("SELECT * FROM flavors WHERE product_id IN ($ph) ORDER BY product_id, sort_order");
    $fStmt->execute($productIds);
    $allFlavors = $fStmt->fetchAll();

    if (empty($allFlavors)) {
        return array_map(function ($p) { $p['flavors'] = []; return $p; }, $products);
    }

    // Query 2: all variants for every flavor in one shot
    $flavorIds = array_column($allFlavors, 'id');
    $ph2       = implode(',', array_fill(0, count($flavorIds), '?'));
    $vStmt     = $pdo->prepare("SELECT flavor_id, weight, price, stock FROM variants WHERE flavor_id IN ($ph2)");
    $vStmt->execute($flavorIds);

    // Group variants by flavor_id
    $variantsByFlavor = [];
    foreach ($vStmt->fetchAll() as $v) {
        $variantsByFlavor[$v['flavor_id']][] = [
            'weight' => $v['weight'],
            'price'  => (int) $v['price'],
            'stock'  => (int) $v['stock'],
        ];
    }

    // Group flavors (with variants attached) by product_id
    $flavorsByProduct = [];
    foreach ($allFlavors as $f) {
        $flavorsByProduct[$f['product_id']][] = [
            'name'     => $f['name'],
            'image'    => $f['image'],
            'variants' => $variantsByFlavor[$f['id']] ?? [],
        ];
    }

    // Attach flavors to each product
    foreach ($products as &$product) {
        $product['flavors'] = $flavorsByProduct[$product['id']] ?? [];
    }
    unset($product);

    return $products;
}
