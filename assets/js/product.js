/* =========================================================================
   HN NUTRITION — product detail
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("pd");
  var product = DB.get(HN.qs("id"));

  if (!product) {
    root.innerHTML =
      '<div class="empty"><h3>Product not found</h3>' +
      '<p>This product may have been removed.</p>' +
      '<a class="btn btn--accent" href="index.html" style="margin-top:16px">Back to shop</a></div>';
    return;
  }

  document.title = product.name + " — HN Nutrition";
  var crumb = document.getElementById("crumbCat");
  if (crumb) crumb.textContent = product.category;

  /* selection state */
  var state = { flavorIdx: 0, weightIdx: 0, qty: 1 };

  function flavor() { return product.flavors[state.flavorIdx]; }
  function variant() { return flavor().variants[state.weightIdx]; }

  function stockTag(stock) {
    if (stock <= 0) return '<span class="pd__stock"><span class="dot dot--out"></span>Out of stock</span>';
    if (stock <= 5) return '<span class="pd__stock"><span class="dot dot--low"></span>Only ' + stock + ' left</span>';
    return '<span class="pd__stock"><span class="dot dot--in"></span>In stock</span>';
  }

  function build() {
    root.innerHTML =
      '<div class="pd">' +
        '<div class="pd__gallery">' +
          '<div class="pd__stage"><img id="pdImg" src="' + HN.escape(flavor().image) +
            '" alt="' + HN.escape(product.name) + '"></div>' +
        '</div>' +
        '<div class="pd__info">' +
          '<div class="pd__brand">' + HN.escape(product.brand) + ' · ' + HN.escape(product.category) + '</div>' +
          '<h1>' + HN.escape(product.name) + '</h1>' +
          (product.tagline ? '<div class="pd__tagline">' + HN.escape(product.tagline) + '</div>' : '') +
          '<div class="pd__price" id="pdPrice"></div>' +
          '<div id="pdStock"></div>' +
          '<p class="pd__desc">' + HN.escape(product.description || "") + '</p>' +

          '<div class="opt' + (product.flavors.length < 2 ? ' is-hidden' : '') + '"' +
            (product.flavors.length < 2 ? ' style="display:none"' : '') + '>' +
            '<div class="opt__label">Flavor: <b id="flavorName"></b></div>' +
            '<div class="flavor-swatches" id="swatches"></div>' +
          '</div>' +

          '<div class="opt">' +
            '<div class="opt__label">Size: <b id="weightName"></b></div>' +
            '<div class="seg" id="weights"></div>' +
          '</div>' +

          '<div class="qty-row">' +
            '<div class="stepper">' +
              '<button type="button" id="qMinus" aria-label="Decrease">−</button>' +
              '<input id="qInput" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity">' +
              '<button type="button" id="qPlus" aria-label="Increase">+</button>' +
            '</div>' +
            '<span class="qty-note" id="qNote"></span>' +
          '</div>' +

          '<div class="pd__actions">' +
            '<button class="btn btn--accent btn--lg" id="buyNow">Buy now</button>' +
            '<button class="btn btn--outline btn--lg" id="addCart">' + HN.icon("cart") + ' Add to cart</button>' +
          '</div>' +

          '<div class="pd__meta">' +
            '<div>' + HN.icon("shield") + ' 100% authentic</div>' +
            '<div>' + HN.icon("truck") + ' Delivery to 58 wilayas</div>' +
            '<div>' + HN.icon("flask") + ' Lab-tested quality</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    renderSwatches();
    renderWeights();
    refresh();
    wire();
  }

  function renderSwatches() {
    var el = document.getElementById("swatches");
    if (product.flavors.length < 2) return;
    el.innerHTML = product.flavors.map(function (f, i) {
      return '<button class="swatch" data-i="' + i + '" aria-pressed="' + (i === state.flavorIdx) + '">' +
               '<span class="swatch__img"><img src="' + HN.escape(f.image) + '" alt="' + HN.escape(f.name) + '"></span>' +
               '<span class="swatch__name">' + HN.escape(f.name) + '</span></button>';
    }).join("");
    el.querySelectorAll(".swatch").forEach(function (b) {
      b.addEventListener("click", function () {
        state.flavorIdx = +b.getAttribute("data-i");
        state.weightIdx = 0;
        state.qty = 1;
        el.querySelectorAll(".swatch").forEach(function (s) { s.setAttribute("aria-pressed", s === b); });
        document.getElementById("pdImg").src = flavor().image;
        renderWeights();
        refresh();
      });
    });
  }

  function renderWeights() {
    var el = document.getElementById("weights");
    el.innerHTML = flavor().variants.map(function (v, i) {
      var out = v.stock <= 0;
      return '<button data-i="' + i + '" aria-pressed="' + (i === state.weightIdx) + '"' +
             (out ? ' disabled' : '') + '>' + HN.escape(v.weight) + '</button>';
    }).join("");
    el.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        state.weightIdx = +b.getAttribute("data-i");
        state.qty = 1;
        el.querySelectorAll("button").forEach(function (s) { s.setAttribute("aria-pressed", s === b); });
        refresh();
      });
    });
  }

  function refresh() {
    var v = variant();
    var max = Math.max(0, v.stock);

    document.getElementById("pdPrice").innerHTML = HN.money(v.price) + ' <span class="cur">DA</span>';
    document.getElementById("pdStock").innerHTML = stockTag(v.stock);
    var fn = document.getElementById("flavorName"); if (fn) fn.textContent = flavor().name;
    document.getElementById("weightName").textContent = v.weight;

    // clamp qty to stock
    if (state.qty > max) state.qty = Math.max(1, max);
    var input = document.getElementById("qInput");
    input.value = state.qty;
    input.max = max;

    document.getElementById("qNote").textContent = max > 0
      ? "Max " + max + " per order"
      : "Currently unavailable";

    var minus = document.getElementById("qMinus");
    var plus = document.getElementById("qPlus");
    minus.disabled = state.qty <= 1 || max === 0;
    plus.disabled = state.qty >= max || max === 0;

    var buy = document.getElementById("buyNow");
    var add = document.getElementById("addCart");
    var soldOut = max === 0;
    buy.disabled = soldOut; add.disabled = soldOut;
    buy.textContent = soldOut ? "Sold out" : "Buy now";
  }

  function setQty(n) {
    var max = Math.max(0, variant().stock);
    state.qty = Math.max(1, Math.min(n, max));
    refresh();
  }

  function buildCartItem() {
    var v = variant();
    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      flavor: flavor().name,
      weight: v.weight,
      price: v.price,
      image: flavor().image,
      qty: state.qty,
      stock: v.stock
    };
  }

  function wire() {
    document.getElementById("qMinus").addEventListener("click", function () { setQty(state.qty - 1); });
    document.getElementById("qPlus").addEventListener("click", function () { setQty(state.qty + 1); });
    document.getElementById("qInput").addEventListener("input", function () {
      var n = parseInt(this.value, 10);
      if (!isNaN(n)) setQty(n);
    });
    document.getElementById("qInput").addEventListener("blur", function () { refresh(); });

    document.getElementById("addCart").addEventListener("click", function () {
      if (variant().stock <= 0) return;
      DB.addToCart(buildCartItem());
      HN.updateBadge();
      HN.toast(state.qty + "× " + product.name + " added to cart");
    });

    document.getElementById("buyNow").addEventListener("click", function () {
      if (variant().stock <= 0) return;
      DB.addToCart(buildCartItem());
      HN.updateBadge();
      location.href = "cart.html";
    });
  }

  build();
})();
