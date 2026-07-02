/* =========================================================================
   HN NUTRITION — admin panel (frontend only)
   Lets the admin add / edit / remove products, their flavors and weight
   variants (price + stock). Persists to localStorage via DB.*.
   NOTE: the password gate is client-side only and NOT real security — it
   just keeps the UI tidy. Replace with proper backend auth later.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("adminRoot");
  var modal = document.getElementById("modal");
  var modalBody = document.getElementById("modalBody");
  var modalTitle = document.getElementById("modalTitle");

  var editing = null;   // product being edited, or null for new
  var draft = null;     // working copy

  /* ---- gate -------------------------------------------------------------- */
  function showGate() {
    root.innerHTML =
      '<div class="login-gate">' +
        '<img class="brand__mark" src="assets/img/logo.png" alt="">' +
        '<h1>Admin access</h1>' +
        '<p>Sign in to manage the catalog.</p>' +
        '<div class="field"><label for="pw">Password <span class="req">*</span></label>' +
          '<input id="pw" type="password" placeholder="Enter password"></div>' +
        '<button class="btn btn--accent btn--block btn--lg" id="loginBtn">Sign in</button>' +
        '<p class="hint">Demo password: <b>hn-admin</b> — change ADMIN_PASSWORD in data.js.</p>' +
      '</div>';
    var pw = document.getElementById("pw");
    function attempt() {
      if (DB.login(pw.value)) { renderAdmin(); }
      else { HN.toast("Wrong password", "shield"); pw.value = ""; pw.focus(); }
    }
    document.getElementById("loginBtn").addEventListener("click", attempt);
    pw.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    pw.focus();
  }

  /* ---- dashboard --------------------------------------------------------- */
  var activeTab = "catalog";
  var orderFilter = "all";

  function renderAdmin() {
    var products = DB.all();
    var orders   = DB.orders();
    /* normalize any legacy "new" status to "pending" in storage */
    var needsSave = false;
    orders.forEach(function (o) {
      if (!o.status || o.status === "new") { o.status = "pending"; needsSave = true; }
    });
    if (needsSave) localStorage.setItem("hn_orders", JSON.stringify(orders));

    var orderCounts = { all: orders.length, pending: 0, confirmed: 0, cancelled: 0 };
    orders.forEach(function (o) {
      if (o.status === "pending")   orderCounts.pending++;
      else if (o.status === "confirmed") orderCounts.confirmed++;
      else if (o.status === "cancelled") orderCounts.cancelled++;
    });
    var filteredOrders = orderFilter === "all"
      ? orders
      : orders.filter(function (o) { return o.status === orderFilter; });
    var totalVariants = products.reduce(function (n, p) {
      return n + p.flavors.reduce(function (m, f) { return m + f.variants.length; }, 0);
    }, 0);

    root.innerHTML =
      /* page title + add button */
      '<div class="admin-head">' +
        '<div><h1>' + (activeTab === "catalog" ? "Catalog" : "Orders") + '</h1>' +
          '<div class="sub">' +
            (activeTab === "catalog"
              ? products.length + ' products · ' + totalVariants + ' variants'
              : orders.length + ' order' + (orders.length !== 1 ? 's' : '') + ' total') +
          '</div></div>' +
        '<div class="admin-actions">' +
          (activeTab === "catalog"
            ? '<button class="btn btn--accent" id="addBtn">+ Add product</button>'
            : (orderFilter === "cancelled" && orderCounts.cancelled
                ? '<button class="btn btn--ghost btn-sm" id="clearCancelledBtn">Remove all cancelled</button>'
                : '')) +
        '</div>' +
      '</div>' +

      /* tab bar */
      '<div class="admin-tabs">' +
        '<button class="admin-tab' + (activeTab === "catalog" ? " active" : "") + '" id="tabCatalog">' +
          'Catalog <span class="tab-count">' + products.length + '</span></button>' +
        '<button class="admin-tab' + (activeTab === "orders" ? " active" : "") + '" id="tabOrders">' +
          'Orders <span class="tab-count">' + orders.length + '</span></button>' +
      '</div>' +

      /* catalog section */
      '<div id="catalogSection"' + (activeTab !== "catalog" ? ' style="display:none"' : '') + '>' +
        '<div class="table-wrap"><table class="atable"><thead><tr>' +
          '<th>Product</th><th>Category</th><th>Flavors</th><th>Price (DA)</th><th>Stock</th><th></th>' +
        '</tr></thead><tbody id="tbody"></tbody></table></div>' +
      '</div>' +

      /* orders section */
      '<div id="ordersSection"' + (activeTab !== "orders" ? ' style="display:none"' : '') + '>' +
        '<div class="order-filter-bar">' +
          ofBtnHtml("all",       "All",       orderCounts.all) +
          ofBtnHtml("pending",   "Pending",   orderCounts.pending) +
          ofBtnHtml("confirmed", "Confirmed", orderCounts.confirmed) +
          ofBtnHtml("cancelled", "Cancelled", orderCounts.cancelled) +
        '</div>' +
        '<div class="table-wrap" style="margin-bottom:60px">' +
          '<table class="atable"><thead><tr>' +
            '<th>Date</th><th>Ref</th><th>Customer</th><th>Location</th>' +
            '<th>Items</th><th>Total (DA)</th><th>Status</th><th></th>' +
          '</tr></thead><tbody id="ordersTbody"></tbody></table>' +
        '</div>' +
      '</div>';

    /* ---- tab wiring ---- */
    document.getElementById("tabCatalog").addEventListener("click", function () {
      activeTab = "catalog"; renderAdmin();
    });
    document.getElementById("tabOrders").addEventListener("click", function () {
      activeTab = "orders"; renderAdmin();
    });

    /* ---- catalog wiring ---- */
    var tbody = document.getElementById("tbody");
    if (tbody) {
      tbody.innerHTML = products.length
        ? products.map(rowHtml).join("")
        : '<tr><td colspan="6" style="text-align:center;color:var(--ash);padding:40px">No products yet. Add your first one.</td></tr>';

      tbody.querySelectorAll("[data-edit]").forEach(function (b) {
        b.addEventListener("click", function () { openEditor(DB.get(b.getAttribute("data-edit"))); });
      });
      tbody.querySelectorAll("[data-del]").forEach(function (b) {
        b.addEventListener("click", function () {
          var p = DB.get(b.getAttribute("data-del"));
          if (confirm('Delete "' + p.name + '"? This cannot be undone.')) {
            DB.remove(p.id); renderAdmin(); HN.toast("Product deleted", "trash");
          }
        });
      });
    }

    var addBtn = document.getElementById("addBtn");
    if (addBtn) addBtn.addEventListener("click", function () { openEditor(null); });

    /* ---- orders wiring ---- */
    ["all", "pending", "confirmed", "cancelled"].forEach(function (f) {
      var btn = document.getElementById("of-" + f);
      if (btn) btn.addEventListener("click", function () { orderFilter = f; renderAdmin(); });
    });

    var ordersTbody = document.getElementById("ordersTbody");
    if (ordersTbody) {
      ordersTbody.innerHTML = filteredOrders.length
        ? filteredOrders.map(orderRowHtml).join("")
        : '<tr><td colspan="8" style="text-align:center;color:var(--ash);padding:40px">' +
            (orderFilter === "all" ? "No orders yet." : "No " + orderFilter + " orders.") +
          '</td></tr>';

      ordersTbody.querySelectorAll(".status-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          DB.updateOrderStatus(sel.getAttribute("data-ref"), sel.value);
          renderAdmin();
        });
      });
      ordersTbody.querySelectorAll("[data-del-order]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (confirm("Delete this order? This cannot be undone.")) {
            DB.removeOrder(btn.getAttribute("data-del-order"));
            renderAdmin();
            HN.toast("Order deleted", "trash");
          }
        });
      });
    }

    var clearBtn = document.getElementById("clearOrdersBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (confirm("Delete ALL orders? This cannot be undone.")) {
          localStorage.setItem("hn_orders", "[]");
          renderAdmin();
          HN.toast("All orders cleared", "trash");
        }
      });
    }

    var clearCancelledBtn = document.getElementById("clearCancelledBtn");
    if (clearCancelledBtn) {
      clearCancelledBtn.addEventListener("click", function () {
        if (confirm("Delete all cancelled orders? This cannot be undone.")) {
          var remaining = DB.orders().filter(function (o) { return o.status !== "cancelled"; });
          localStorage.setItem("hn_orders", JSON.stringify(remaining));
          orderFilter = "all";
          renderAdmin();
          HN.toast("Cancelled orders removed", "trash");
        }
      });
    }
  }

  function ofBtnHtml(filter, label, count) {
    return '<button class="order-filter-btn' + (orderFilter === filter ? ' active' : '') + '" id="of-' + filter + '">' +
      label + ' <span class="tab-count">' + count + '</span></button>';
  }

  var STATUS_LABELS = { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled" };
  var STATUS_COLORS = { pending: "var(--accent)", confirmed: "#3b82f6", cancelled: "var(--ash-dim)" };

  function orderRowHtml(o) {
    var c = o.customer || {};
    var itemsSummary = (o.items || []).map(function (it) {
      return (
        '<div class="order-item-row">' +
          (it.image
            ? '<img src="' + HN.escape(it.image) + '" class="order-item-thumb" alt="">'
            : '<div class="order-item-thumb order-item-thumb--placeholder"></div>') +
          '<div>' +
            '<div style="font-weight:600">' + HN.escape(it.name) + '</div>' +
            '<div class="muted" style="font-size:12px">' +
              HN.escape(it.flavor) + ' · ' + HN.escape(it.weight) +
              ' <span style="color:var(--accent)">×' + it.qty + '</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    var date = o.placedAt ? new Date(o.placedAt).toLocaleString("fr-DZ") : "—";
    var status = (o.status === "new" || !o.status) ? "pending" : o.status;
    var statusColor = STATUS_COLORS[status] || "var(--ash)";

    var statusOpts = Object.keys(STATUS_LABELS).map(function (s) {
      return '<option value="' + s + '"' + (s === status ? " selected" : "") + '>' + STATUS_LABELS[s] + '</option>';
    }).join("");

    return (
      '<tr>' +
        '<td class="mono" style="font-size:12px;white-space:nowrap">' + date + '</td>' +
        '<td class="mono" style="color:var(--accent);white-space:nowrap">' + HN.escape(o.ref) + '</td>' +
        '<td><b>' + HN.escape((c.firstName || "") + ' ' + (c.lastName || "")) + '</b>' +
          '<br><span class="mono" style="font-size:12px">' + HN.escape(c.phone || "") + '</span></td>' +
        '<td style="font-size:13px">' +
          (o.deliveryType === "home"
            ? '<span class="badge-home" style="margin-bottom:6px;display:inline-flex">🏠 Home delivery</span><br>'
            : '<span class="badge-office" style="margin-bottom:6px;display:inline-flex">📦 Delivery office</span><br>') +
          HN.escape(c.wilaya || "") + '<br>' +
          '<span class="muted">' + HN.escape(c.city || "") + (c.address ? ', ' + HN.escape(c.address) : '') + '</span></td>' +
        '<td style="font-size:13px">' + (itemsSummary || "—") + '</td>' +
        '<td class="mono" style="font-weight:700;white-space:nowrap;color:var(--bone)" dir="ltr">' + HN.money(o.total || 0) + ' DA</td>' +
        '<td>' +
          '<select class="status-select" data-ref="' + HN.escape(o.ref) + '" style="' +
            'background:var(--carbon);border:1.5px solid ' + statusColor + ';border-radius:8px;' +
            'padding:6px 10px;color:' + statusColor + ';font-family:var(--mono);font-size:12px;font-weight:700;cursor:pointer">' +
            statusOpts +
          '</select>' +
        '</td>' +
        '<td><button class="btn btn--ghost btn-sm" data-del-order="' + HN.escape(o.ref) + '" title="Delete order">' +
          HN.icon("trash") + '</button></td>' +
      '</tr>'
    );
  }

  function rowHtml(p) {
    var prices = [], stock = 0;
    p.flavors.forEach(function (f) { f.variants.forEach(function (v) { prices.push(v.price); stock += (+v.stock || 0); }); });
    var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    var priceLabel = min === max ? HN.money(min) : HN.money(min) + " – " + HN.money(max);
    var img = p.flavors[0] && p.flavors[0].image ? p.flavors[0].image : "assets/img/logo.png";

    return (
      '<tr>' +
        '<td><div class="atable__prod"><div class="atable__thumb"><img src="' + HN.escape(img) + '" alt=""></div>' +
          '<div><div class="atable__name">' + HN.escape(p.name) + '</div>' +
          '<div class="atable__brand">' + HN.escape(p.brand) + '</div></div></div></td>' +
        '<td><span class="tag">' + HN.escape(p.category) + '</span></td>' +
        '<td class="mono">' + p.flavors.length + '</td>' +
        '<td class="mono" dir="ltr">' + priceLabel + '</td>' +
        '<td class="mono">' + stock + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="btn btn--outline btn-sm" data-edit="' + HN.escape(p.id) + '">Edit</button>' +
          '<button class="btn btn--ghost btn-sm" data-del="' + HN.escape(p.id) + '">Delete</button>' +
        '</div></td>' +
      '</tr>'
    );
  }

  /* ---- editor ------------------------------------------------------------ */
  var CATEGORIES = ["Creatine", "Protein", "Pre-Workout", "Amino Acids", "Vitamins", "Mass Gainer", "Fat Burner", "Accessories"];

  function blankDraft() {
    return {
      id: "", name: "", brand: "", category: "Creatine", badge: "", tagline: "", description: "",
      flavors: [{ name: "", image: "", variants: [{ weight: "", price: "", stock: "" }] }]
    };
  }

  function openEditor(product) {
    editing = product;
    draft = product ? JSON.parse(JSON.stringify(product)) : blankDraft();
    modalTitle.textContent = product ? "Edit product" : "Add product";
    renderEditor();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeEditor() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderEditor() {
    var d = draft;
    var catOpts = CATEGORIES.map(function (c) {
      var sel = c === d.category ? " selected" : "";
      return '<option' + sel + '>' + c + '</option>';
    }).join("");

    modalBody.innerHTML =
      '<div class="field-grid">' +
        ed("name", "Product name", d.name) +
        ed("brand", "Brand", d.brand) +
      '</div>' +
      '<div class="field-grid">' +
        '<div class="field"><label>Category</label><select id="ed-category">' + catOpts + '</select></div>' +
        ed("badge", "Badge (optional)", d.badge, "e.g. Best Seller") +
      '</div>' +
      ed("tagline", "Tagline (optional)", d.tagline, "Short line shown on the product", true) +
      '<div class="field full"><label>Description</label>' +
        '<textarea id="ed-description" rows="3" style="background:var(--ink);border:1.5px solid var(--line);border-radius:10px;padding:13px 14px;color:var(--bone);font-family:inherit;font-size:15px;resize:vertical">' +
          HN.escape(d.description) + '</textarea></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin:22px 0 12px">' +
        '<div class="opt__label" style="margin:0">Flavors & sizes</div>' +
        '<button class="btn btn--outline btn-sm" id="addFlavor">+ Add flavor</button></div>' +
      '<div id="flavors"></div>';

    document.getElementById("ed-category").addEventListener("change", function () { d.category = this.value; });
    bindField("name"); bindField("brand"); bindField("badge"); bindField("tagline"); bindField("description");
    document.getElementById("addFlavor").addEventListener("click", function () {
      d.flavors.push({ name: "", image: "", variants: [{ weight: "", price: "", stock: "" }] });
      renderFlavors();
    });
    renderFlavors();
  }

  function ed(key, label, val, ph, full) {
    return (
      '<div class="field' + (full ? " full" : "") + '"><label>' + label + '</label>' +
        '<input id="ed-' + key + '" value="' + HN.escape(val || "") + '" placeholder="' + (ph || "") + '"></div>'
    );
  }
  function bindField(key) {
    var el = document.getElementById("ed-" + key);
    if (el) el.addEventListener("input", function () { draft[key] = el.value; });
  }

  function renderFlavors() {
    var wrap = document.getElementById("flavors");
    wrap.innerHTML = draft.flavors.map(function (f, fi) {
      var variants = f.variants.map(function (v, vi) {
        return (
          '<div class="variant-row" data-f="' + fi + '" data-v="' + vi + '">' +
            '<div class="field" style="margin:0"><input class="v-weight" placeholder="Weight e.g. 500 g" value="' + HN.escape(v.weight) + '"></div>' +
            '<div class="field" style="margin:0"><input class="v-price" type="number" min="0" placeholder="Price DA" value="' + HN.escape(v.price) + '"></div>' +
            '<div class="field" style="margin:0"><input class="v-stock" type="number" min="0" placeholder="Stock" value="' + HN.escape(v.stock) + '"></div>' +
            '<button class="btn btn--ghost btn-sm v-del" title="Remove size">' + HN.icon("trash") + '</button>' +
          '</div>'
        );
      }).join("");

      return (
        '<div class="flavor-block" data-f="' + fi + '">' +
          '<div class="flavor-block__head">' +
            '<input class="f-name" placeholder="Flavor name e.g. Watermelon (or Natural)" value="' + HN.escape(f.name) + '" style="background:var(--carbon);border:1.5px solid var(--line);border-radius:9px;padding:10px 12px;color:var(--bone)">' +
            (draft.flavors.length > 1 ? '<button class="btn btn--ghost btn-sm f-del">Remove flavor</button>' : '') +
          '</div>' +
          '<div class="field" style="margin-bottom:12px"><label>Image URL or path</label>' +
            '<input class="f-image" placeholder="assets/img/your-image.jpg or https://…" value="' + HN.escape(f.image) + '"></div>' +
          '<div class="field" style="margin-bottom:14px"><label style="cursor:pointer;color:var(--accent)">⤓ Or upload image' +
            '<input type="file" class="f-upload" accept="image/*" style="display:none"></label></div>' +
          variants +
          '<button class="btn btn--outline btn-sm add-variant" style="margin-top:4px">+ Add size</button>' +
        '</div>'
      );
    }).join("");

    wireFlavors(wrap);
  }

  function wireFlavors(wrap) {
    // flavor name / image
    wrap.querySelectorAll(".flavor-block").forEach(function (block) {
      var fi = +block.getAttribute("data-f");
      block.querySelector(".f-name").addEventListener("input", function () { draft.flavors[fi].name = this.value; });
      block.querySelector(".f-image").addEventListener("input", function () { draft.flavors[fi].image = this.value; });

      var del = block.querySelector(".f-del");
      if (del) del.addEventListener("click", function () { draft.flavors.splice(fi, 1); renderFlavors(); });

      block.querySelector(".add-variant").addEventListener("click", function () {
        draft.flavors[fi].variants.push({ weight: "", price: "", stock: "" });
        renderFlavors();
      });

      var upload = block.querySelector(".f-upload");
      upload.addEventListener("change", function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 1.2 * 1024 * 1024) {
          HN.toast("Image too large (max ~1MB). Use a URL instead.", "shield");
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          draft.flavors[fi].image = e.target.result;
          renderFlavors();
          HN.toast("Image attached");
        };
        reader.readAsDataURL(file);
      });
    });

    // variant fields
    wrap.querySelectorAll(".variant-row").forEach(function (row) {
      var fi = +row.getAttribute("data-f"), vi = +row.getAttribute("data-v");
      row.querySelector(".v-weight").addEventListener("input", function () { draft.flavors[fi].variants[vi].weight = this.value; });
      row.querySelector(".v-price").addEventListener("input", function () { draft.flavors[fi].variants[vi].price = this.value; });
      row.querySelector(".v-stock").addEventListener("input", function () { draft.flavors[fi].variants[vi].stock = this.value; });
      row.querySelector(".v-del").addEventListener("click", function () {
        if (draft.flavors[fi].variants.length <= 1) { HN.toast("Each flavor needs at least one size"); return; }
        draft.flavors[fi].variants.splice(vi, 1); renderFlavors();
      });
    });
  }

  /* ---- save -------------------------------------------------------------- */
  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function uniqueId(base) {
    var id = base || "product", n = 1, taken = DB.all().map(function (p) { return p.id; });
    var candidate = id;
    while (taken.indexOf(candidate) !== -1) { candidate = id + "-" + (++n); }
    return candidate;
  }

  function validateAndClean() {
    var d = draft;
    if (!d.name.trim()) return "Add a product name.";
    if (!d.brand.trim()) return "Add a brand.";
    var cleanedFlavors = [];
    for (var i = 0; i < d.flavors.length; i++) {
      var f = d.flavors[i];
      var name = (f.name || "").trim() || (d.flavors.length === 1 ? "Natural" : "");
      if (!name) return "Flavor " + (i + 1) + " needs a name.";
      var variants = [];
      for (var j = 0; j < f.variants.length; j++) {
        var v = f.variants[j];
        if (!String(v.weight).trim()) continue;
        var price = parseInt(v.price, 10);
        var stock = parseInt(v.stock, 10);
        if (isNaN(price) || price < 0) return 'Set a valid price for "' + name + " · " + v.weight + '".';
        if (isNaN(stock) || stock < 0) stock = 0;
        variants.push({ weight: String(v.weight).trim(), price: price, stock: stock });
      }
      if (!variants.length) return 'Add at least one size with a price for "' + name + '".';
      cleanedFlavors.push({ name: name, image: (f.image || "").trim() || "assets/img/logo.png", variants: variants });
    }
    if (!cleanedFlavors.length) return "Add at least one flavor.";

    d.flavors = cleanedFlavors;
    d.name = d.name.trim(); d.brand = d.brand.trim();
    d.tagline = (d.tagline || "").trim(); d.badge = (d.badge || "").trim();
    d.description = (d.description || "").trim();
    if (!editing) d.id = uniqueId(slugify(d.brand + "-" + d.name));
    return null;
  }

  function save() {
    var err = validateAndClean();
    if (err) { HN.toast(err, "shield"); return; }
    DB.save(draft);
    closeEditor();
    renderAdmin();
    HN.toast(editing ? "Product updated" : "Product added");
  }

  /* ---- modal wiring ------------------------------------------------------ */
  document.getElementById("modalClose").addEventListener("click", closeEditor);
  document.getElementById("cancelBtn").addEventListener("click", closeEditor);
  document.getElementById("saveBtn").addEventListener("click", save);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeEditor(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) closeEditor(); });

  /* ---- boot -------------------------------------------------------------- */
  if (DB.isAdmin()) renderAdmin(); else showGate();
})();
