<?php
/* =============================================================================
   HN NUTRITION — orders API
   GET    orders.php                        → all orders          (admin)
   POST   orders.php                        → place order
   PATCH  orders.php                        → update status       (admin)
   DELETE orders.php?ref=HN-XXX            → delete one          (admin)
   DELETE orders.php                        → delete all          (admin)
   DELETE orders.php?action=clear_cancelled → delete cancelled    (admin)

   Stock rules:
     pending  → confirmed : reduce stock,  mark stock_deducted = 1
     confirmed → anything  : restore stock, mark stock_deducted = 0
     delete order where stock_deducted = 1 : restore stock before deleting
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
        date('Y-m-d H:i:s'),
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

/* ---- PATCH — update status (with stock management) ------------------------ */
if ($method === 'PATCH') {
    require_admin();
    $d = body();
    if (empty($d['ref']) || empty($d['status'])) json_err('Missing ref or status');
    $allowed = ['pending', 'confirmed', 'cancelled'];
    if (!in_array($d['status'], $allowed, true)) json_err('Invalid status');

    $pdo = db();

    // Load current order state
    $row = $pdo->prepare('SELECT id, status, stock_deducted FROM orders WHERE ref = ?');
    $row->execute([$d['ref']]);
    $order = $row->fetch();
    if (!$order) json_err('Order not found', 404);

    $newStatus     = $d['status'];
    $oldStatus     = $order['status'];
    $stockDeducted = (bool) $order['stock_deducted'];
    $orderId       = (int) $order['id'];

    if ($newStatus === 'confirmed' && !$stockDeducted) {
        // Confirming → reduce stock and mark deducted
        adjust_stock($pdo, $orderId, 'reduce');
        $pdo->prepare('UPDATE orders SET status = ?, stock_deducted = 1 WHERE id = ?')
            ->execute([$newStatus, $orderId]);

    } elseif ($newStatus !== 'confirmed' && $stockDeducted) {
        // Moving away from confirmed → restore stock
        adjust_stock($pdo, $orderId, 'restore');
        $pdo->prepare('UPDATE orders SET status = ?, stock_deducted = 0 WHERE id = ?')
            ->execute([$newStatus, $orderId]);

    } else {
        // No stock change needed (e.g. pending → cancelled)
        $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')
            ->execute([$newStatus, $orderId]);
    }

    json_ok(null);
}

/* ---- DELETE --------------------------------------------------------------- */
if ($method === 'DELETE') {
    require_admin();
    $pdo = db();

    if ($action === 'clear_cancelled') {
        // Restore stock for any cancelled orders that had stock deducted
        $rows = $pdo->query(
            "SELECT id FROM orders WHERE status = 'cancelled' AND stock_deducted = 1"
        )->fetchAll();
        foreach ($rows as $r) { adjust_stock($pdo, (int)$r['id'], 'restore'); }
        $pdo->exec("DELETE FROM orders WHERE status = 'cancelled'");
        json_ok(null);
    }

    if ($ref) {
        // Single order delete — restore stock if it was deducted
        $row = $pdo->prepare('SELECT id, stock_deducted FROM orders WHERE ref = ?');
        $row->execute([$ref]);
        $order = $row->fetch();
        if ($order) {
            if ($order['stock_deducted']) adjust_stock($pdo, (int)$order['id'], 'restore');
            $pdo->prepare('DELETE FROM orders WHERE id = ?')->execute([$order['id']]);
        }
        json_ok(null);
    }

    // Delete ALL orders — restore stock for any confirmed ones first
    $rows = $pdo->query('SELECT id FROM orders WHERE stock_deducted = 1')->fetchAll();
    foreach ($rows as $r) { adjust_stock($pdo, (int)$r['id'], 'restore'); }
    $pdo->exec('DELETE FROM orders');
    json_ok(null);
}

json_err('Method not allowed', 405);

/* ---- stock helper --------------------------------------------------------- */
/**
 * Add or subtract each order item's qty from the matching variant's stock.
 * Matches variant by: product_id + flavor name + weight.
 */
function adjust_stock(PDO $pdo, int $order_id, string $direction): void {
    $items = $pdo->prepare(
        'SELECT product_id, flavor, weight, qty FROM order_items WHERE order_id = ?'
    );
    $items->execute([$order_id]);

    // 'reduce' uses GREATEST(0, ...) so stock never goes negative
    $sql = $direction === 'reduce'
        ? 'UPDATE variants v
           JOIN flavors f ON f.id = v.flavor_id
           SET v.stock = GREATEST(0, v.stock - ?)
           WHERE f.product_id = ? AND f.name = ? AND v.weight = ?'
        : 'UPDATE variants v
           JOIN flavors f ON f.id = v.flavor_id
           SET v.stock = v.stock + ?
           WHERE f.product_id = ? AND f.name = ? AND v.weight = ?';

    $stmt = $pdo->prepare($sql);
    foreach ($items->fetchAll() as $item) {
        $stmt->execute([$item['qty'], $item['product_id'], $item['flavor'], $item['weight']]);
    }
}

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
