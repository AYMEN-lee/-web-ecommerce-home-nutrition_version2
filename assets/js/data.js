/* =========================================================================
   HN NUTRITION — data layer (PHP/MySQL backend)

   API_BASE: set to 'api' when the site is served through XAMPP Apache
             (http://localhost/new_gym2/).
   If you keep VS Code Live Server on port 5500 change it to:
             'http://localhost/new_gym2/api'
   ========================================================================= */
(function (window) {
  "use strict";

  var API_BASE = 'api';

  /* ---- in-memory cache --------------------------------------------------- */
  var _cache = { products: [], orders: [] };

  /* ---- cart — stays in localStorage -------------------------------------- */
  var CART_KEY  = 'hn_cart';
  var ADMIN_KEY = 'hn_admin_ok';

  function readLS(key, fallback) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---- fetch helpers ----------------------------------------------------- */
  function apiFetch(path, opts) {
    return fetch(API_BASE + path, Object.assign({ credentials: 'include' }, opts || {}))
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
          return data;
        });
      });
  }
  function apiJSON(method, path, body) {
    return apiFetch(path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  /* ---- public API -------------------------------------------------------- */
  var DB = {

    /* -- initialise: call once per page, await before rendering ------------ */
    init: function () {
      return apiFetch('/products.php')
        .then(function (res) { if (res.ok) _cache.products = res.data; })
        .catch(function (e) { console.warn('HN: products unavailable —', e.message); });
    },

    fetchOrders: function () {
      return apiFetch('/orders.php')
        .then(function (res) { if (res.ok) _cache.orders = res.data; });
    },

    /* -- products (sync reads from cache) ---------------------------------- */
    all: function () { return _cache.products; },

    get: function (id) {
      return _cache.products.find(function (p) { return p.id === id; }) || null;
    },

    categories: function () {
      var seen = [];
      _cache.products.forEach(function (p) {
        if (seen.indexOf(p.category) === -1) seen.push(p.category);
      });
      return seen.sort();
    },

    save: function (product) {
      return apiJSON('POST', '/products.php', product).then(function () { return DB.init(); });
    },

    remove: function (id) {
      return apiFetch('/products.php?id=' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function () { return DB.init(); });
    },

    /* -- cart (synchronous, localStorage) ---------------------------------- */
    cart: function () { return readLS(CART_KEY, []); },

    cartCount: function () {
      return this.cart().reduce(function (n, it) { return n + it.qty; }, 0);
    },

    cartTotal: function () {
      return this.cart().reduce(function (n, it) { return n + it.price * it.qty; }, 0);
    },

    addToCart: function (item) {
      var cart = this.cart();
      var key  = item.productId + '|' + item.flavor + '|' + item.weight;
      var ex   = cart.find(function (it) { return it.key === key; });
      if (ex) ex.qty = Math.min(ex.qty + item.qty, item.stock);
      else    { item.key = key; cart.push(item); }
      writeLS(CART_KEY, cart);
      return this.cartCount();
    },

    updateQty: function (key, qty) {
      var cart = this.cart();
      var it   = cart.find(function (c) { return c.key === key; });
      if (it) { it.qty = Math.max(1, Math.min(qty, it.stock)); writeLS(CART_KEY, cart); }
    },

    removeFromCart: function (key) {
      writeLS(CART_KEY, this.cart().filter(function (c) { return c.key !== key; }));
    },

    clearCart: function () { writeLS(CART_KEY, []); },

    /* -- orders ------------------------------------------------------------ */
    orders: function () { return _cache.orders; },

    saveOrder: function (order) {
      return apiJSON('POST', '/orders.php', order);
    },

    updateOrderStatus: function (ref, status) {
      return apiJSON('PATCH', '/orders.php', { ref: ref, status: status })
        .then(function () {
          var o = _cache.orders.find(function (x) { return x.ref === ref; });
          if (o) o.status = status;
        });
    },

    removeOrder: function (ref) {
      return apiFetch('/orders.php?ref=' + encodeURIComponent(ref), { method: 'DELETE' })
        .then(function () {
          _cache.orders = _cache.orders.filter(function (x) { return x.ref !== ref; });
        });
    },

    clearAllOrders: function () {
      return apiFetch('/orders.php', { method: 'DELETE' })
        .then(function () { _cache.orders = []; });
    },

    clearCancelledOrders: function () {
      return apiFetch('/orders.php?action=clear_cancelled', { method: 'DELETE' })
        .then(function () {
          _cache.orders = _cache.orders.filter(function (o) { return o.status !== 'cancelled'; });
        });
    },

    /* -- admin auth -------------------------------------------------------- */
    isAdmin: function () { return sessionStorage.getItem(ADMIN_KEY) === '1'; },

    login: function (pw) {
      return apiJSON('POST', '/auth.php?action=login', { password: pw })
        .then(function () { sessionStorage.setItem(ADMIN_KEY, '1'); return true; })
        .catch(function () { return false; });
    },

    logout: function () {
      apiFetch('/auth.php?action=logout', { method: 'POST' }).catch(function () {});
      sessionStorage.removeItem(ADMIN_KEY);
    }
  };

  window.DB = DB;
})(window);
