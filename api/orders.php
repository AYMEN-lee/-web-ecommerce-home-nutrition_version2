<?php
/* =============================================================================
   HN NUTRITION — orders API
   GET    orders.php                        → all orders          (admin)
   POST   orders.php                        → place order
   PATCH  orders.php                        → update status       (admin)
   DELETE orders.php?ref=HN-XXX            → delete one          (admin)
   DELETE orders.php                        → delete all          (admin)
   DELETE orders.php?action=clear_cancelled → delete cancelled    (admin)
   ============================================================================= */
require __DIR__ . '/config.php';
cors();

$method = $_SERVER['REQUEST_METHOD'];
$ref    = $_GET['ref']    ?? null;
$action = $_GET['action'] ?? null;

/* ---- GET all orders ------------------------------------------------------- */
if ($method === 'GET') {
    require_admin();
    $pdo    = db();
    $orders = $pdo->query('SELECT * FROM orders ORDER BY placed_at DESC')->fetchAll();
    foreach ($orders as &$order) {
        $stmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $stmt->execute([$order['id']]);
        $order = to_js($order, $stmt->fetchAll());
    }
    unset($order);
    json_ok($orders);
}

/* ---- POST — place order --------------------------------------------------- */
if ($method === 'POST') {
    $d = body();
    $c = $d['customer'] ?? [];

    if (empty($d['ref'])) json_err('Missing ref');

    $pdo = db();
    $pdo->prepare(
        'INSERT INTO orders
           (ref, first_name, last_name, phone, wilaya, city, address,
            delivery_type, subtotal, delivery_cost, total, payment, status, placed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $d['ref'],
        $c['firstName']  ?? '', $c['lastName'] ?? '', $c['phone']   ?? '',
        $c['wilaya']     ?? '', $c['city']     ?? '', $c['address'] ?? '',
        $d['deliveryType'] ?? 'office',
        (int)($d['subtotal'] ?? 0), (int)($d['delivery'] ?? 0), (int)($d['total'] ?? 0),
        $d['payment']  ?? 'Cash on delivery',
        'pending',
        $d['placedAt'] ?? date('Y-m-d H:i:s'),
    ]);
    $orderId = (int) $pdo->lastInsertId();

    $iStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, name, brand, flavor, weight, price, qty, image)
         VALUES (?,?,?,?,?,?,?,?,?)'
    );
    foreach (($d['items'] ?? []) as $item) {
        $iStmt->execute([
            $orderId,
            $item['productId'] ?? '', $item['name']   ?? '', $item['brand']  ?? '',
            $item['flavor']    ?? '', $item['weight']  ?? '',
            (int)($item['price'] ?? 0), (int)($item['qty'] ?? 1),
            $item['image'] ?? '',
        ]);
    }

    json_ok(['ref' => $d['ref']]);
}

/* ---- PATCH — update status ------------------------------------------------ */
if ($method === 'PATCH') {
    require_admin();
    $d = body();
    if (empty($d['ref']) || empty($d['status'])) json_err('Missing ref or status');
    $allowed = ['pending', 'confirmed', 'cancelled'];
    if (!in_array($d['status'], $allowed, true)) json_err('Invalid status');
    db()->prepare('UPDATE orders SET status = ? WHERE ref = ?')->execute([$d['status'], $d['ref']]);
    json_ok(null);
}

/* ---- DELETE --------------------------------------------------------------- */
if ($method === 'DELETE') {
    require_admin();

    if ($action === 'clear_cancelled') {
        // Delete all cancelled orders (items cascade)
        db()->exec("DELETE FROM orders WHERE status = 'cancelled'");
        json_ok(null);
    }

    if ($ref) {
        // Delete single order
        db()->prepare('DELETE FROM orders WHERE ref = ?')->execute([$ref]);
        json_ok(null);
    }

    // Delete ALL orders
    db()->exec('DELETE FROM orders');
    json_ok(null);
}

json_err('Method not allowed', 405);

/* ---- helper: DB row → JS-compatible shape --------------------------------- */
function to_js(array $o, array $items): array {
    return [
        'ref'          => $o['ref'],
        'status'       => $o['status'],
        'deliveryType' => $o['delivery_type'],
        'subtotal'     => (int) $o['subtotal'],
        'delivery'     => (int) $o['delivery_cost'],
        'total'        => (int) $o['total'],
        'payment'      => $o['payment'],
        'placedAt'     => $o['placed_at'],
        'customer'     => [
            'firstName' => $o['first_name'],
            'lastName'  => $o['last_name'],
            'phone'     => $o['phone'],
            'wilaya'    => $o['wilaya'],
            'city'      => $o['city'],
            'address'   => $o['address'],
        ],
        'items' => array_map(fn($i) => [
            'productId' => $i['product_id'],
            'name'      => $i['name'],
            'brand'     => $i['brand'],
            'flavor'    => $i['flavor'],
            'weight'    => $i['weight'],
            'price'     => (int) $i['price'],
            'qty'       => (int) $i['qty'],
            'image'     => $i['image'],
        ], $items),
    ];
}
