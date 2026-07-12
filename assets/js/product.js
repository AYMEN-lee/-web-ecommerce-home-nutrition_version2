/* =========================================================================
   HN NUTRITION — product detail
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("pd");

  DB.init().then(function () {

    var product = DB.get(HN.qs("id"));

    if (!product) {
      var renderNotFound = function () {
        root.innerHTML =
          '<div class="empty"><h3>' + HN.t("pd_not_found") + '</h3>' +
          '<p>' + HN.t("pd_not_found_p") + '</p>' +
          '<a class="btn btn--accent" href="index.html" style="margin-top:16px">' + HN.t("pd_back_shop") + '</a></div>';
      };
      renderNotFound();
      document.addEventListener("hn:langchange", renderNotFound);
      return;
    }

    /* selection state */
    var state = { flavorIdx: 0, weightIdx: 0, qty: 1 };

    function flavor()  { return product.flavors[state.flavorIdx]; }
    function variant() { return flavor().variants[state.weightIdx]; }

    /* returns the AR version of a product field when available, else English */
    function pText(field) {
      var ar = product[field + "_ar"];
      return (HN.currentLang === "ar" && ar) ? ar : (product[field] || "");
    }

    function stockTag(stock) {
      if (stock <= 0) return '<span class="pd__stock"><span class="dot dot--out"></span>' + HN.t("pd_out_of_stock") + '</span>';
      return '<span class="pd__stock"><span class="dot dot--in"></span>' + HN.t("pd_in_stock") + '</span>';
    }

    function build() {
      document.title = pText("name") + " — HN Nutrition";
      var crumb = document.getElementById("crumbCat");
      if (crumb) crumb.textContent = product.category;

      root.innerHTML =
        '<div class="pd">' +
          '<div class="pd__gallery">' +
            '<div class="pd__stage"><img id="pdImg" src="' + HN.escape(flavor().image) +
              '" alt="' + HN.escape(pText("name")) + '"></div>' +
          '</div>' +
          '<div class="pd__info">' +
            '<div class="pd__brand">' + HN.escape(pText("brand")) + ' · ' + HN.escape(product.category) + '</div>' +
            '<h1>' + HN.escape(pText("name")) + '</h1>' +
            (pText("tagline") ? '<div class="pd__tagline">' + HN.escape(pText("tagline")) + '</div>' : '') +
            '<div class="pd__price" id="pdPrice"></div>' +
            '<div id="pdStock"></div>' +
            '<p class="pd__desc">' + HN.escape(pText("description")) + '</p>' +

            '<div class="opt' + (product.flavors.length < 2 ? ' is-hidden' : '') + '"' +
              (product.flavors.length < 2 ? ' style="display:none"' : '') + '>' +
              '<div class="opt__label">' + HN.t("pd_flavor") + ': <b id="flavorName"></b></div>' +
              '<div class="flavor-swatches" id="swatches"></div>' +
            '</div>' +

            '<div class="opt">' +
              '<div class="opt__label">' + HN.t("pd_size") + ': <b id="weightName"></b></div>' +
              '<div class="seg" id="weights"></div>' +
            '</div>' +

            '<div class="qty-row">' +
              '<div class="stepper">' +
                '<button type="button" id="qMinus" aria-label="Decrease">−</button>' +
                '<input id="qInput" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity">' +
                '<button type="button" id="qPlus" aria-label="Increase">+</button>' +
              '</div>' +
            '</div>' +

            '<div class="pd__actions">' +
              '<button class="btn btn--accent btn--lg" id="buyNow">' + HN.t("pd_buy_now") + '</button>' +
              '<button class="btn btn--outline btn--lg" id="addCart">' + HN.icon("cart") + ' ' + HN.t("pd_add_cart") + '</button>' +
            '</div>' +

            '<div class="pd__meta">' +
              '<div>' + HN.icon("shield") + ' ' + HN.t("pd_authentic") + '</div>' +
              '<div>' + HN.icon("truck") + ' ' + HN.t("pd_delivery") + '</div>' +
              '<div>' + HN.icon("flask") + ' ' + HN.t("pd_lab_tested") + '</div>' +
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
      var v   = variant();
      var max = Math.max(0, v.stock);

      document.getElementById("pdPrice").innerHTML = HN.money(v.price) + ' <span class="cur">DA</span>';
      document.getElementById("pdStock").innerHTML = stockTag(v.stock);
      var fn = document.getElementById("flavorName"); if (fn) fn.textContent = flavor().name;
      document.getElementById("weightName").textContent = v.weight;

      if (state.qty > max) state.qty = Math.max(1, max);
      var input = document.getElementById("qInput");
      input.value = state.qty;
      input.max   = max;

      var minus = document.getElementById("qMinus");
      var plus  = document.getElementById("qPlus");
      minus.disabled = state.qty <= 1 || max === 0;
      plus.disabled  = state.qty >= max || max === 0;

      var buy     = document.getElementById("buyNow");
      var add     = document.getElementById("addCart");
      var soldOut = max === 0;
      buy.disabled = soldOut; add.disabled = soldOut;
      buy.textContent = soldOut ? HN.t("pd_sold_out") : HN.t("pd_buy_now");
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
        name:      product.name,
        brand:     product.brand,
        flavor:    flavor().name,
        weight:    v.weight,
        price:     v.price,
        image:     flavor().image,
        qty:       state.qty,
        stock:     v.stock
      };
    }

    function wire() {
      document.getElementById("qMinus").addEventListener("click", function () { setQty(state.qty - 1); });
      document.getElementById("qPlus").addEventListener("click",  function () { setQty(state.qty + 1); });
      document.getElementById("qInput").addEventListener("input", function () {
        var n = parseInt(this.value, 10);
        if (!isNaN(n)) setQty(n);
      });
      document.getElementById("qInput").addEventListener("blur", function () { refresh(); });

      document.getElementById("addCart").addEventListener("click", function () {
        if (variant().stock <= 0) return;
        DB.addToCart(buildCartItem());
        HN.updateBadge();
        HN.toast(HN.t("pd_added_cart", { qty: state.qty, name: pText("name") }));
      });

      document.getElementById("buyNow").addEventListener("click", function () {
        if (variant().stock <= 0) return;
        DB.addToCart(buildCartItem());
        HN.updateBadge();
        location.href = "cart.html";
      });
    }

    build();
    document.addEventListener("hn:langchange", build);

  }); // DB.init().then

})();
