/* =========================================================================
   HN NUTRITION — storefront (index)
   ========================================================================= */
(function () {
  "use strict";

  var grid    = document.getElementById("grid");
  var chipsEl = document.getElementById("chips");
  var countEl = document.getElementById("count");
  var titleEl = document.getElementById("catalogTitle");
  var subEl   = document.getElementById("catalogSub");

  if (!grid) return; /* not on the shop page */

  var activeCat = HN.qs("cat") || "All";
  var searchQ   = (HN.qs("q") || "").toLowerCase().trim();

  function buildChips() {
    var cats = [HN.t("cat_all")].concat(DB.categories());
    chipsEl.innerHTML = cats.map(function (c, i) {
      var rawCat  = i === 0 ? "All" : c;
      var pressed = rawCat === activeCat;
      return '<button class="chip" data-cat="' + HN.escape(rawCat) + '" aria-pressed="' + pressed + '">' +
             HN.escape(c) + '</button>';
    }).join("");
    chipsEl.querySelectorAll(".chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeCat = btn.getAttribute("data-cat");
        searchQ   = "";
        var url = activeCat === "All" ? "index.html" : "index.html?cat=" + encodeURIComponent(activeCat);
        history.replaceState(null, "", url + "#catalog");
        chipsEl.querySelectorAll(".chip").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn);
        });
        render();
      });
    });
  }

  function matches(p) {
    if (searchQ) {
      var hay = (p.name + " " + p.brand + " " + p.category).toLowerCase();
      return hay.indexOf(searchQ) !== -1;
    }
    return activeCat === "All" || p.category === activeCat;
  }

  function flavorPills(p) {
    return p.flavors.slice(0, 3).map(function (f) {
      return '<span class="flavor-dot">' + HN.escape(f.name) + '</span>';
    }).join("") + (p.flavors.length > 3 ? '<span class="flavor-dot">+' + (p.flavors.length - 3) + '</span>' : "");
  }

  function card(p, isFirst) {
    var isAr  = HN.currentLang === "ar";
    var pName  = (isAr && p.name_ar)  ? p.name_ar  : p.name;
    var pBrand = (isAr && p.brand_ar) ? p.brand_ar : p.brand;
    var img = p.flavors[0] && p.flavors[0].image ? p.flavors[0].image : "assets/img/logo.png";
    var badge = p.badge
      ? '<span class="card__badge ' + (/best/i.test(p.badge) ? "card__badge--accent" : "") + '">' + HN.escape(p.badge) + '</span>'
      : "";
    var variantCount = p.flavors.reduce(function (n, f) { return n + f.variants.length; }, 0);
    var imgAttrs = isFirst ? 'fetchpriority="high"' : 'loading="lazy"';
    return (
      '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="card__media">' + badge +
          '<span class="card__cat">' + HN.escape(p.category) + '</span>' +
          '<img src="' + HN.escape(img) + '" alt="' + HN.escape(pName) + '" ' + imgAttrs + '>' +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__brand">' + HN.escape(pBrand) + '</span>' +
          '<h3 class="card__name">' + HN.escape(pName) + '</h3>' +
          '<div class="card__flavors">' + flavorPills(p) +
            '<span class="flavor-dot">' + variantCount + ' ' + HN.t("sizes") + '</span></div>' +
          '<div class="card__foot">' +
            '<span class="price"><small>' + HN.t("price_from") + '</small>' + HN.price(HN.minPrice(p)) + '</span>' +
            '<span class="card__view" aria-hidden="true">' + HN.icon("arrow") + '</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function render() {
    var items = DB.all().filter(matches);

    if (searchQ) {
      titleEl.textContent = HN.t("catalog_search", { q: searchQ });
      subEl.textContent   = HN.t("catalog_search_sub");
    } else if (activeCat === "All") {
      titleEl.textContent = HN.t("catalog_all");
      subEl.textContent   = HN.t("catalog_all_sub");
    } else {
      titleEl.textContent = activeCat;
      subEl.textContent   = HN.t("catalog_cat_sub", { cat: activeCat.toLowerCase() });
    }

    var n = items.length;
    countEl.textContent = n + " " + HN.t(n === 1 ? "product" : "products");

    if (!n) {
      grid.innerHTML =
        '<div class="empty" style="grid-column:1/-1"><h3>' + HN.t("empty_title") + '</h3>' +
        '<p>' + HN.t("empty_p") + '</p>' +
        '<a class="btn btn--outline" href="index.html" style="margin-top:16px">' + HN.t("empty_btn") + '</a></div>';
      return;
    }
    grid.innerHTML = items.map(function (p, i) { return card(p, i === 0); }).join("");
  }

  grid.innerHTML = '<div class="card card--skel"></div>'.repeat(6);

  DB.init().then(function () {
    buildChips();
    render();
  });

  document.addEventListener("hn:langchange", function () {
    buildChips();
    render();
  });
})();
