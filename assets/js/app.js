/* =========================================================================
   HN NUTRITION — shared app utilities + i18n
   ========================================================================= */
(function (window, document) {
  "use strict";

  var HN = {};

  /* ---- i18n --------------------------------------------------------------- */
  var STRINGS = {
    en: {
      nav_shop:        "Shop",
      nav_categories:  "Categories",
      nav_admin:       "Admin",
      search_label:    "Search",
      cart_label:      "Cart",
      menu_label:      "Menu",
      lang_switch:     "Arabic",
      eyebrow:         "Professional Sports Nutrition",
      hero_h1:         'Fuel the<br><span class="ol">work.</span> Earn<br>the results.',
      hero_p:          "Authentic, lab-tested supplements — creatine, protein, pre-workout and more. Picked by lifters, delivered to the delivery office or to your door across all 58 wilayas.",
      hero_cta:        "Shop the range",
      stat_wilayas:    "Wilayas served",
      stat_authentic:  "Authentic stock",
      catalog_all:     "All products",
      catalog_all_sub: "Every product is fulfilled cash-on-delivery.",
      catalog_search:  'Search: "{q}"',
      catalog_search_sub: "Showing products that match your search.",
      catalog_cat_sub: "Filtered to {cat}.",
      cat_all:         "All",
      price_from:      "from",
      sizes:           "sizes",
      products:        "products",
      product:         "product",
      empty_title:     "Nothing here yet",
      empty_p:         "No products match this filter. Try another category.",
      empty_btn:       "View all",
      footer_tagline:  "Authentic, lab-tested sports nutrition — delivered across all 58 wilayas. Train hard. Recover right.",
      footer_shop:     "Shop",
      footer_help:     "Help",
      footer_follow:   "Follow",
      footer_creatine: "Creatine",
      footer_protein:  "Protein",
      footer_preworkout: "Pre-Workout",
      footer_vitamins: "Vitamins",
      footer_cart:     "Cart",
      footer_all:      "All products",
      footer_delivery: "Delivery & returns",
      footer_contact:  "Contact us",
      footer_ig:       "Instagram",
      footer_fb:       "Facebook",
      footer_tt:       "TikTok",
      footer_bar:      "CASH ON DELIVERY · 58 WILAYAS"
    },
    ar: {
      nav_shop:        "المتجر",
      nav_categories:  "الفئات",
      nav_admin:       "الإدارة",
      search_label:    "بحث",
      cart_label:      "السلة",
      menu_label:      "القائمة",
      lang_switch:     "English",
      eyebrow:         "تغذية رياضية احترافية",
      hero_h1:         'اعمل<br><span class="ol">بجد.</span> احصد<br>النتائج.',
      hero_p:          "مكملات غذائية أصيلة ومختبرة مخبرياً — كرياتين، بروتين، ما قبل التمرين والمزيد. يختارها الرياضيون، تُوصَّل إلى مكتب التوصيل أو إلى بابك عبر 58 ولاية.",
      hero_cta:        "تسوق المنتجات",
      stat_wilayas:    "ولاية تخدمها",
      stat_authentic:  "مخزون أصيل",
      catalog_all:     "جميع المنتجات",
      catalog_all_sub: "جميع المنتجات بالدفع عند الاستلام.",
      catalog_search:  'بحث: "{q}"',
      catalog_search_sub: "المنتجات التي تطابق بحثك.",
      catalog_cat_sub: "مفلترة إلى {cat}.",
      cat_all:         "الكل",
      price_from:      "من",
      sizes:           "أحجام",
      products:        "منتجات",
      product:         "منتج",
      empty_title:     "لا توجد منتجات",
      empty_p:         "لا توجد منتجات تطابق هذا الفلتر. جرّب فئة أخرى.",
      empty_btn:       "عرض الكل",
      footer_tagline:  "تغذية رياضية أصيلة ومختبرة — توصيل عبر 58 ولاية. تدرّب بجد. تعافَ بشكل صحيح.",
      footer_shop:     "المتجر",
      footer_help:     "المساعدة",
      footer_follow:   "تابعنا",
      footer_creatine: "كرياتين",
      footer_protein:  "بروتين",
      footer_preworkout: "ما قبل التمرين",
      footer_vitamins: "فيتامينات",
      footer_cart:     "عربة التسوق",
      footer_all:      "جميع المنتجات",
      footer_delivery: "التوصيل والإرجاع",
      footer_contact:  "تواصل معنا",
      footer_ig:       "إنستغرام",
      footer_fb:       "فيسبوك",
      footer_tt:       "تيكتوك",
      footer_bar:      "دفع عند الاستلام · 58 ولاية"
    }
  };

  HN.currentLang = localStorage.getItem("hn_lang") || "en";

  HN.t = function (key, vars) {
    var str = (STRINGS[HN.currentLang] || STRINGS.en)[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace("{" + k + "}", vars[k]);
      });
    }
    return str;
  };

  HN.setLang = function (lang) {
    HN.currentLang = lang;
    localStorage.setItem("hn_lang", lang);
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = HN.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = HN.t(el.getAttribute("data-i18n-html"));
    });
    HN.renderChrome();
    document.dispatchEvent(new CustomEvent("hn:langchange"));
  };

  /* ---- currency (Algerian Dinar) ---------------------------------------- */
  HN.money = function (n) {
    return Math.round(n).toLocaleString("fr-DZ").replace(/ /g, " ").replace(/,/g, " ");
  };
  HN.price = function (n) {
    return '<span class="mono">' + HN.money(n) + ' <span class="cur">DA</span></span>';
  };

  /* ---- inline icons ------------------------------------------------------ */
  var ICONS = {
    cart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    menu:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    arrow:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    bolt:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
    check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    trash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3z"/></svg>',
    truck:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="1.6"/><circle cx="18.5" cy="18.5" r="1.6"/></svg>',
    flask:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V2"/></svg>'
  };
  HN.icon = function (name) { return ICONS[name] || ""; };

  /* ---- header / footer rendering ---------------------------------------- */
  HN.renderChrome = function () {
    var page = document.body.getAttribute("data-page") || "";
    var hdr = document.getElementById("site-header");
    var ftr = document.getElementById("site-footer");

    if (hdr) {
      hdr.innerHTML =
        '<header class="header"><div class="wrap header__row">' +
          '<a class="brand" href="index.html" aria-label="HN Nutrition home">' +
            '<img class="brand__mark" src="assets/img/logo.png" alt="">' +
            '<span class="brand__name">HN <b>NUTRITION</b><small>FUEL THE WORK</small></span>' +
          '</a>' +
          '<nav class="nav" id="mainNav">' +
            navLink("index.html",            HN.t("nav_shop"),       page === "shop") +
            navLink("index.html#categories", HN.t("nav_categories"), false) +
          '</nav>' +
          '<div class="header__tools">' +
            '<button class="icon-btn" id="searchBtn" aria-label="' + HN.t("search_label") + '">' + ICONS.search + '</button>' +
            '<a class="icon-btn" href="cart.html" aria-label="' + HN.t("cart_label") + '">' + ICONS.cart +
              '<span class="cart-badge" id="cartBadge">0</span></a>' +
            (page !== "admin" ? '<button class="lang-toggle" id="langToggle">' + HN.t("lang_switch") + '</button>' : '') +
            '<button class="icon-btn menu-toggle" id="menuToggle" aria-label="' + HN.t("menu_label") + '">' + ICONS.menu + '</button>' +
          '</div>' +
        '</div></header>';

      var toggle = document.getElementById("menuToggle");
      var nav    = document.getElementById("mainNav");
      if (toggle) toggle.addEventListener("click", function () { nav.classList.toggle("nav--open"); });

      var sb = document.getElementById("searchBtn");
      if (sb) sb.addEventListener("click", function () {
        var q = prompt(HN.t("search_label"));
        if (q) location.href = "index.html?q=" + encodeURIComponent(q.trim());
      });

      var lt = document.getElementById("langToggle");
      if (lt) lt.addEventListener("click", function () {
        HN.setLang(HN.currentLang === "en" ? "ar" : "en");
      });
    }

    if (ftr) {
      ftr.innerHTML =
        '<footer class="footer"><div class="wrap"><div class="footer__grid">' +
          '<div class="footer__brand"><a class="brand" href="index.html">' +
            '<img class="brand__mark" src="assets/img/logo.png" alt="">' +
            '<span class="brand__name">HN <b>NUTRITION</b></span></a>' +
            '<p>' + HN.t("footer_tagline") + '</p></div>' +
          '<div><h4>' + HN.t("footer_shop") + '</h4><ul>' +
            '<li><a href="index.html?cat=Creatine">' + HN.t("footer_creatine") + '</a></li>' +
            '<li><a href="index.html?cat=Protein">' + HN.t("footer_protein") + '</a></li>' +
            '<li><a href="index.html?cat=Pre-Workout">' + HN.t("footer_preworkout") + '</a></li>' +
            '<li><a href="index.html?cat=Vitamins">' + HN.t("footer_vitamins") + '</a></li></ul></div>' +
          '<div><h4>' + HN.t("footer_help") + '</h4><ul>' +
            '<li><a href="cart.html">' + HN.t("footer_cart") + '</a></li>' +
            '<li><a href="index.html">' + HN.t("footer_all") + '</a></li>' +
            '<li><a href="#">' + HN.t("footer_delivery") + '</a></li>' +
            '<li><a href="#">' + HN.t("footer_contact") + '</a></li></ul></div>' +
          '<div><h4>' + HN.t("footer_follow") + '</h4><ul>' +
            '<li><a href="#">' + HN.t("footer_ig") + '</a></li>' +
            '<li><a href="#">' + HN.t("footer_fb") + '</a></li>' +
            '<li><a href="#">' + HN.t("footer_tt") + '</a></li></ul></div>' +
        '</div><div class="footer__bar">' +
          '<span>© ' + new Date().getFullYear() + ' HN NUTRITION</span>' +
          '<span>' + HN.t("footer_bar") + '</span>' +
        '</div></div></footer>';
    }

    HN.updateBadge();
  };

  function navLink(href, label, active) {
    return '<a href="' + href + '"' + (active ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }

  /* ---- cart badge -------------------------------------------------------- */
  HN.updateBadge = function () {
    var el = document.getElementById("cartBadge");
    if (el && window.DB) {
      var n = DB.cartCount();
      el.textContent = n;
      el.style.display = n > 0 ? "grid" : "none";
    }
  };

  /* ---- toast ------------------------------------------------------------- */
  HN.toast = function (msg, icon) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = (icon ? ICONS[icon] || "" : ICONS.check) + "<span>" + msg + "</span>";
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0"; t.style.transform = "translateY(10px)";
      setTimeout(function () { t.remove(); }, 300);
    }, 2200);
  };

  /* ---- small helpers ----------------------------------------------------- */
  HN.qs = function (name) { return new URLSearchParams(location.search).get(name); };
  HN.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  HN.minPrice = function (p) {
    var min = Infinity;
    p.flavors.forEach(function (f) { f.variants.forEach(function (v) { if (v.price < min) min = v.price; }); });
    return min === Infinity ? 0 : min;
  };

  window.HN = HN;

  document.addEventListener("DOMContentLoaded", function () {
    /* apply saved language before rendering chrome */
    var html = document.documentElement;
    html.lang = HN.currentLang;
    html.dir  = HN.currentLang === "ar" ? "rtl" : "ltr";
    HN.renderChrome();
    /* apply data-i18n to static HTML */
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = HN.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = HN.t(el.getAttribute("data-i18n-html"));
    });
  });
})(window, document);
