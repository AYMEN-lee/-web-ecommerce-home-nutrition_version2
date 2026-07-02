-- =============================================================================
--  HN NUTRITION — database schema + seed data
--  Run once in phpMyAdmin or: mysql -u root -p < db.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS hn_nutrition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hn_nutrition;

-- -----------------------------------------------------------------------------
--  Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          VARCHAR(120)  PRIMARY KEY,
  name        VARCHAR(200)  NOT NULL,
  brand       VARCHAR(100)  NOT NULL,
  category    VARCHAR(100)  NOT NULL,
  badge       VARCHAR(80)   DEFAULT '',
  tagline     VARCHAR(300)  DEFAULT '',
  description TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS flavors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  VARCHAR(120)  NOT NULL,
  name        VARCHAR(120)  NOT NULL,
  image       MEDIUMTEXT,
  sort_order  INT           DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS variants (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  flavor_id   INT           NOT NULL,
  weight      VARCHAR(60)   NOT NULL,
  price       INT           NOT NULL DEFAULT 0,
  stock       INT           NOT NULL DEFAULT 0,
  FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ref           VARCHAR(30)   UNIQUE NOT NULL,
  first_name    VARCHAR(100)  DEFAULT '',
  last_name     VARCHAR(100)  DEFAULT '',
  phone         VARCHAR(40)   DEFAULT '',
  wilaya        VARCHAR(120)  DEFAULT '',
  city          VARCHAR(120)  DEFAULT '',
  address       VARCHAR(300)  DEFAULT '',
  delivery_type ENUM('home','office') DEFAULT 'office',
  subtotal      INT           NOT NULL DEFAULT 0,
  delivery_cost INT           NOT NULL DEFAULT 0,
  total         INT           NOT NULL DEFAULT 0,
  payment       VARCHAR(80)   DEFAULT 'Cash on delivery',
  status        ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  placed_at     DATETIME      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           NOT NULL,
  product_id  VARCHAR(120)  DEFAULT '',
  name        VARCHAR(200)  NOT NULL,
  brand       VARCHAR(100)  DEFAULT '',
  flavor      VARCHAR(120)  DEFAULT '',
  weight      VARCHAR(60)   DEFAULT '',
  price       INT           NOT NULL DEFAULT 0,
  qty         INT           NOT NULL DEFAULT 1,
  image       MEDIUMTEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
--  Seed catalog (only inserts if table is empty)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO products (id, name, brand, category, badge, tagline, description) VALUES
('ostrovit-creatine',   'Creatine Monohydrate', 'OstroVit', 'Creatine',     'Best Seller', '2600 mg creatine monohydrate daily',   'Micronized 200-mesh creatine monohydrate for strength, power output and lean mass. No added colors, fillers or sugar — just pure, fast-dissolving creatine. Take one serving daily, training day or not.'),
('ostrovit-whey',       'WPC 80 Whey Protein',  'OstroVit', 'Protein',      'New',         '22 g protein per serving',             'High-quality whey protein concentrate to support muscle recovery and growth. Mixes smooth, tastes clean, and packs a full amino profile in every scoop.'),
('ostrovit-preworkout', 'AAKG Pre-Workout',     'OstroVit', 'Pre-Workout',  '',            'Pump • focus • energy',                'Arginine alpha-ketoglutarate pre-workout formula for bigger pumps and sharper focus. Hits fast — take it 20 minutes before you train.'),
('ostrovit-bcaa',       'BCAA 2:1:1',           'OstroVit', 'Amino Acids',  '',            'Branched-chain amino acids',           'A 2:1:1 ratio of leucine, isoleucine and valine to protect muscle and speed recovery. Sip it through your session.'),
('ostrovit-d3k2',       'Vitamin D3 + K2',      'OstroVit', 'Vitamins',     '',            'Bone & immune support',                'Daily D3 and K2 to support bones, immunity and overall health — especially useful through low-sunlight months. One capsule a day.'),
('ostrovit-gainer',     'Mass Gainer',          'OstroVit', 'Mass Gainer',  '',            'Clean calories for size',              'A carb-and-protein blend built for hard gainers who struggle to eat enough. Add it between meals to push your daily calories up.');

-- Creatine flavors
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(1, 'ostrovit-creatine', 'Watermelon', 'assets/img/ostrovit-watermelon.jpg', 0),
(2, 'ostrovit-creatine', 'Natural',    'assets/img/ostrovit-natural.png',    1);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(1, '300 g',  2600, 24), (1, '500 g',  3900, 18),
(2, '300 g',  2400, 30), (2, '500 g',  3700, 22), (2, '1000 g', 6500, 12);

-- Whey flavors
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(3, 'ostrovit-whey', 'Chocolate',  'assets/img/whey-choco.svg',  0),
(4, 'ostrovit-whey', 'Vanilla',    'assets/img/whey-vanilla.svg',1),
(5, 'ostrovit-whey', 'Strawberry', 'assets/img/whey-straw.svg',  2);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(3, '700 g',  4500, 20), (3, '2270 g', 12900, 9),
(4, '700 g',  4500, 16), (4, '2270 g', 12900, 7),
(5, '700 g',  4500, 11), (5, '2270 g', 12900, 5);

-- Pre-Workout flavors
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(6, 'ostrovit-preworkout', 'Orange', 'assets/img/preworkout.svg', 0),
(7, 'ostrovit-preworkout', 'Lemon',  'assets/img/preworkout.svg', 1);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(6, '200 g', 2900, 18), (6, '400 g', 4900, 10),
(7, '200 g', 2900, 14), (7, '400 g', 4900,  8);

-- BCAA flavors
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(8, 'ostrovit-bcaa', 'Mango', 'assets/img/bcaa.svg', 0),
(9, 'ostrovit-bcaa', 'Cola',  'assets/img/bcaa.svg', 1);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(8, '200 g', 3200, 15), (8, '400 g', 5500,  9),
(9, '200 g', 3200, 12), (9, '400 g', 5500,  6);

-- Vitamins
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(10, 'ostrovit-d3k2', 'Capsules', 'assets/img/vitamins.svg', 0);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(10, '60 caps',  1500, 40),
(10, '120 caps', 2600, 25);

-- Mass Gainer flavors
INSERT IGNORE INTO flavors (id, product_id, name, image, sort_order) VALUES
(11, 'ostrovit-gainer', 'Chocolate', 'assets/img/gainer.svg', 0),
(12, 'ostrovit-gainer', 'Vanilla',   'assets/img/gainer.svg', 1);
INSERT IGNORE INTO variants (flavor_id, weight, price, stock) VALUES
(11, '1000 g', 3900, 14), (11, '3000 g', 9900, 6),
(12, '1000 g', 3900, 10), (12, '3000 g', 9900, 4);
