/* =========================================================================
   HN NUTRITION — data layer
   Frontend-only store backed by localStorage. Swap these functions for real
   API calls when the backend is ready (the page code never touches storage
   directly — it only calls DB.*).
   ========================================================================= */
(function (window) {
  "use strict";

  var KEYS = {
    products: "hn_products",
    cart: "hn_cart",
    seed: "hn_seed_version",
    admin: "hn_admin_ok"
  };

  // Bump this when the seed catalog changes to re-seed on next load.
  var SEED_VERSION = "5";

  /* ---- Seed catalog -----------------------------------------------------
     Currency is Algerian Dinar (DZD). Each product has flavors; each flavor
     has its own image and a list of weight variants (price + stock).
     Stock is what caps the quantity a customer can order.
  ------------------------------------------------------------------------ */
  var SEED = [
    {
      id: "ostrovit-creatine",
      name: "Creatine Monohydrate",
      brand: "OstroVit",
      category: "Creatine",
      badge: "Best Seller",
      tagline: "2600 mg creatine monohydrate daily",
      description:
        "Micronized 200-mesh creatine monohydrate for strength, power output and lean mass. No added colors, fillers or sugar — just pure, fast-dissolving creatine. Take one serving daily, training day or not.",
      flavors: [
        {
          name: "Watermelon",
          image: "assets/img/ostrovit-watermelon.jpg",
          variants: [
            { weight: "300 g", price: 2600, stock: 24 },
            { weight: "500 g", price: 3900, stock: 18 }
          ]
        },
        {
          name: "Natural",
          image: "assets/img/ostrovit-natural.png",
          variants: [
            { weight: "300 g", price: 2400, stock: 30 },
            { weight: "500 g", price: 3700, stock: 22 },
            { weight: "1000 g", price: 6500, stock: 12 }
          ]
        }
      ]
    },
    {
      id: "ostrovit-whey",
      name: "WPC 80 Whey Protein",
      brand: "OstroVit",
      category: "Protein",
      badge: "New",
      tagline: "22 g protein per serving",
      description:
        "High-quality whey protein concentrate to support muscle recovery and growth. Mixes smooth, tastes clean, and packs a full amino profile in every scoop.",
      flavors: [
        {
          name: "Chocolate",
          image: "assets/img/whey-choco.svg",
          variants: [
            { weight: "700 g", price: 4500, stock: 20 },
            { weight: "2270 g", price: 12900, stock: 9 }
          ]
        },
        {
          name: "Vanilla",
          image: "assets/img/whey-vanilla.svg",
          variants: [
            { weight: "700 g", price: 4500, stock: 16 },
            { weight: "2270 g", price: 12900, stock: 7 }
          ]
        },
        {
          name: "Strawberry",
          image: "assets/img/whey-straw.svg",
          variants: [
            { weight: "700 g", price: 4500, stock: 11 },
            { weight: "2270 g", price: 12900, stock: 5 }
          ]
        }
      ]
    },
    {
      id: "ostrovit-preworkout",
      name: "AAKG Pre-Workout",
      brand: "OstroVit",
      category: "Pre-Workout",
      tagline: "Pump • focus • energy",
      description:
        "Arginine alpha-ketoglutarate pre-workout formula for bigger pumps and sharper focus. Hits fast — take it 20 minutes before you train.",
      flavors: [
        {
          name: "Orange",
          image: "assets/img/preworkout.svg",
          variants: [
            { weight: "200 g", price: 2900, stock: 18 },
            { weight: "400 g", price: 4900, stock: 10 }
          ]
        },
        {
          name: "Lemon",
          image: "assets/img/preworkout.svg",
          variants: [
            { weight: "200 g", price: 2900, stock: 14 },
            { weight: "400 g", price: 4900, stock: 8 }
          ]
        }
      ]
    },
    {
      id: "ostrovit-bcaa",
      name: "BCAA 2:1:1",
      brand: "OstroVit",
      category: "Amino Acids",
      tagline: "Branched-chain amino acids",
      description:
        "A 2:1:1 ratio of leucine, isoleucine and valine to protect muscle and speed recovery. Sip it through your session.",
      flavors: [
        {
          name: "Mango",
          image: "assets/img/bcaa.svg",
          variants: [
            { weight: "200 g", price: 3200, stock: 15 },
            { weight: "400 g", price: 5500, stock: 9 }
          ]
        },
        {
          name: "Cola",
          image: "assets/img/bcaa.svg",
          variants: [
            { weight: "200 g", price: 3200, stock: 12 },
            { weight: "400 g", price: 5500, stock: 6 }
          ]
        }
      ]
    },
    {
      id: "ostrovit-d3k2",
      name: "Vitamin D3 + K2",
      brand: "OstroVit",
      category: "Vitamins",
      tagline: "Bone & immune support",
      description:
        "Daily D3 and K2 to support bones, immunity and overall health — especially useful through low-sunlight months. One capsule a day.",
      flavors: [
        {
          name: "Capsules",
          image: "assets/img/vitamins.svg",
          variants: [
            { weight: "60 caps", price: 1500, stock: 40 },
            { weight: "120 caps", price: 2600, stock: 25 }
          ]
        }
      ]
    },
    {
      id: "ostrovit-gainer",
      name: "Mass Gainer",
      brand: "OstroVit",
      category: "Mass Gainer",
      tagline: "Clean calories for size",
      description:
        "A carb-and-protein blend built for hard gainers who struggle to eat enough. Add it between meals to push your daily calories up.",
      flavors: [
        {
          name: "Chocolate",
          image: "assets/img/gainer.svg",
          variants: [
            { weight: "1000 g", price: 3900, stock: 14 },
            { weight: "3000 g", price: 9900, stock: 6 }
          ]
        },
        {
          name: "Vanilla",
          image: "assets/img/gainer.svg",
          variants: [
            { weight: "1000 g", price: 3900, stock: 10 },
            { weight: "3000 g", price: 9900, stock: 4 }
          ]
        }
      ]
    }
  ];

  /* ---- Storage helpers --------------------------------------------------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed", e);
    }
  }

  function ensureSeed() {
    if (read(KEYS.seed, null) !== SEED_VERSION || !read(KEYS.products, null)) {
      write(KEYS.products, SEED);
      write(KEYS.seed, SEED_VERSION);
    }
  }

  /* ---- Public API -------------------------------------------------------- */
  var DB = {
    /* products */
    all: function () {
      ensureSeed();
      return read(KEYS.products, []);
    },
    get: function (id) {
      return this.all().find(function (p) { return p.id === id; }) || null;
    },
    categories: function () {
      var set = [];
      this.all().forEach(function (p) {
        if (set.indexOf(p.category) === -1) set.push(p.category);
      });
      return set.sort();
    },
    save: function (product) {
      var list = this.all();
      var i = list.findIndex(function (p) { return p.id === product.id; });
      if (i === -1) list.push(product);
      else list[i] = product;
      write(KEYS.products, list);
    },
    remove: function (id) {
      write(KEYS.products, this.all().filter(function (p) { return p.id !== id; }));
    },
    resetCatalog: function () {
      write(KEYS.products, SEED);
      write(KEYS.seed, SEED_VERSION);
    },

    /* cart — items: {key, productId, name, brand, flavor, weight, price, image, qty, stock} */
    cart: function () {
      return read(KEYS.cart, []);
    },
    cartCount: function () {
      return this.cart().reduce(function (n, it) { return n + it.qty; }, 0);
    },
    cartTotal: function () {
      return this.cart().reduce(function (n, it) { return n + it.price * it.qty; }, 0);
    },
    addToCart: function (item) {
      var cart = this.cart();
      var key = item.productId + "|" + item.flavor + "|" + item.weight;
      var existing = cart.find(function (it) { return it.key === key; });
      if (existing) {
        existing.qty = Math.min(existing.qty + item.qty, item.stock);
      } else {
        item.key = key;
        cart.push(item);
      }
      write(KEYS.cart, cart);
      return this.cartCount();
    },
    updateQty: function (key, qty) {
      var cart = this.cart();
      var it = cart.find(function (c) { return c.key === key; });
      if (it) {
        it.qty = Math.max(1, Math.min(qty, it.stock));
        write(KEYS.cart, cart);
      }
    },
    removeFromCart: function (key) {
      write(KEYS.cart, this.cart().filter(function (c) { return c.key !== key; }));
    },
    clearCart: function () {
      write(KEYS.cart, []);
    },

    /* admin gate — frontend only, NOT real security. Replace with backend auth. */
    ADMIN_PASSWORD: "hn-admin",
    isAdmin: function () {
      return sessionStorage.getItem(KEYS.admin) === "1";
    },
    login: function (pw) {
      if (pw === this.ADMIN_PASSWORD) {
        sessionStorage.setItem(KEYS.admin, "1");
        return true;
      }
      return false;
    },
    logout: function () {
      sessionStorage.removeItem(KEYS.admin);
    }
  };

  window.DB = DB;
})(window);
