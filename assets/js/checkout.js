/* =========================================================================
   HN NUTRITION — checkout (cash on delivery)
   ========================================================================= */
(function () {
  "use strict";

  var root    = document.getElementById("checkoutRoot");
  var crumb   = document.querySelector(".crumb");

  var SHIP_FREE_FROM = 5000;
  var SHIP_COST      = 500;

  var WILAYAS = [
    "01 - Adrar","02 - Chlef","03 - Laghouat","04 - Oum El Bouaghi","05 - Batna","06 - Béjaïa",
    "07 - Biskra","08 - Béchar","09 - Blida","10 - Bouira","11 - Tamanrasset","12 - Tébessa",
    "13 - Tlemcen","14 - Tiaret","15 - Tizi Ouzou","16 - Alger","17 - Djelfa","18 - Jijel",
    "19 - Sétif","20 - Saïda","21 - Skikda","22 - Sidi Bel Abbès","23 - Annaba","24 - Guelma",
    "25 - Constantine","26 - Médéa","27 - Mostaganem","28 - M'Sila","29 - Mascara","30 - Ouargla",
    "31 - Oran","32 - El Bayadh","33 - Illizi","34 - Bordj Bou Arréridj","35 - Boumerdès",
    "36 - El Tarf","37 - Tindouf","38 - Tissemsilt","39 - El Oued","40 - Khenchela","41 - Souk Ahras",
    "42 - Tipaza","43 - Mila","44 - Aïn Defla","45 - Naâma","46 - Aïn Témouchent","47 - Ghardaïa",
    "48 - Relizane","49 - Timimoun","50 - Bordj Badji Mokhtar","51 - Ouled Djellal","52 - Béni Abbès",
    "53 - In Salah","54 - In Guezzam","55 - Touggourt","56 - Djanet","57 - El M'Ghair","58 - El Meniaa",
    "59 - Aflou","60 - Barika","61 - El Kantara","62 - Bir El Ater","63 - El Aricha",
    "64 - Ksar Chellala","65 - Aïn Oussera","66 - Messaad","67 - Ksar El Boukhari",
    "68 - Boussaâda","69 - El Abiodh Sidi Cheikh"
  ];

  function shipping(total) { return total >= SHIP_FREE_FROM || total === 0 ? 0 : SHIP_COST; }

  function render() {
    /* update breadcrumb */
    if (crumb) {
      crumb.innerHTML =
        '<a href="cart.html">' + HN.t("co_breadcrumb_cart") + '</a>' +
        '<span>/</span><span>' + HN.t("co_breadcrumb_confirm") + '</span>';
    }

    var cart = DB.cart();
    if (!cart.length) {
      root.innerHTML =
        '<div class="empty"><h3>' + HN.t("co_empty_title") + '</h3>' +
        '<p>' + HN.t("co_empty_p") + '</p>' +
        '<a class="btn btn--accent" href="index.html" style="margin-top:18px">' + HN.t("co_go_shop") + '</a></div>';
      return;
    }

    var subtotal = DB.cartTotal();
    var ship     = shipping(subtotal);

    var miniItems = cart.map(function (it) {
      return (
        '<div class="mini-item">' +
          '<div class="mini-item__img"><img src="' + HN.escape(it.image) + '" alt=""></div>' +
          '<div class="mini-item__info">' +
            '<div class="mini-item__name">' + HN.escape(it.name) +
              ' <span class="muted mono" style="font-size:11px">×' + it.qty + '</span></div>' +
            '<div class="mini-item__opts">' + HN.escape(it.flavor) + ' · ' + HN.escape(it.weight) + '</div>' +
          '</div>' +
          '<div class="mini-item__price">' + HN.money(it.price * it.qty) + ' DA</div>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<div class="checkout-layout">' +
        '<div class="form-card">' +
          '<h3>' + HN.t("co_title") + '</h3>' +
          '<p>' + HN.t("co_subtitle") + '</p>' +
          '<form id="orderForm" novalidate>' +
            '<div class="field-grid">' +
              field("firstName", HN.t("co_fname"), "text", HN.t("co_fname_ph")) +
              field("lastName",  HN.t("co_lname"), "text", HN.t("co_lname_ph")) +
            '</div>' +
            field("phone", HN.t("co_phone"), "tel", HN.t("co_phone_ph"), true) +
            '<div class="field-grid">' +
              wilayaField() +
              field("city", HN.t("co_city"), "text", HN.t("co_city_ph")) +
            '</div>' +

            /* delivery type toggle */
            '<div class="field full" style="margin-bottom:16px">' +
              '<label>' + HN.t("co_delivery_type") + ' <span class="req">*</span></label>' +
              '<div class="delivery-seg">' +
                '<button type="button" class="delivery-opt" data-type="office" aria-pressed="true">' +
                  '📦 ' + HN.t("co_delivery_office") + '</button>' +
                '<button type="button" class="delivery-opt" data-type="home" aria-pressed="false">' +
                  '🏠 ' + HN.t("co_home_delivery") + '</button>' +
              '</div>' +
            '</div>' +

            /* address — shown only for home delivery */
            '<div id="addressWrap" style="display:none">' +
              field("address", HN.t("co_address_home"), "text", HN.t("co_address_ph"), true, false) +
            '</div>' +

            '<button type="submit" class="btn btn--accent btn--block btn--lg" style="margin-top:8px">' +
              HN.t("co_place_order") + ' · <span dir="ltr">' + HN.money(subtotal + ship) + ' DA</span>' +
            '</button>' +
          '</form>' +
        '</div>' +

        '<aside class="summary">' +
          '<h3>' + HN.t("co_your_order") + '</h3>' +
          miniItems +
          '<div class="summary__row" style="margin-top:14px">' +
            '<span>' + HN.t("co_subtotal") + '</span><span>' + HN.money(subtotal) + ' DA</span></div>' +
          '<div class="summary__row">' +
            '<span>' + HN.t("co_delivery") + '</span>' +
            '<span>' + (ship === 0 ? HN.t("co_free") : HN.money(ship) + " DA") + '</span></div>' +
          '<div class="summary__total">' +
            '<span>' + HN.t("co_total") + '</span><b>' + HN.money(subtotal + ship) + ' DA</b></div>' +
          '<p class="summary__note">' + HN.t("co_cod_note") + '</p>' +
          '<a class="btn btn--ghost btn--block" href="cart.html">' + HN.t("co_back_cart") + '</a>' +
        '</aside>' +
      '</div>';

    wire(subtotal, ship);
  }

  function field(id, label, type, ph, full, required) {
    if (required === undefined) required = true;
    return (
      '<div class="field' + (full ? " full" : "") + '">' +
        '<label for="' + id + '">' + label + (required ? ' <span class="req">*</span>' : '') + '</label>' +
        '<input id="' + id + '" name="' + id + '" type="' + type + '" placeholder="' + ph + '"' +
          (required ? ' data-required="1"' : '') + '>' +
        '<span class="err">' + HN.t("co_err_required") + '</span>' +
      '</div>'
    );
  }

  function wilayaField() {
    var opts = '<option value="">' + HN.t("co_wilaya_ph") + '</option>' +
      WILAYAS.map(function (w) {
        return '<option value="' + HN.escape(w) + '">' + HN.escape(w) + '</option>';
      }).join("");
    return (
      '<div class="field">' +
        '<label for="wilaya">' + HN.t("co_wilaya") + ' <span class="req">*</span></label>' +
        '<select id="wilaya" name="wilaya" data-required="1">' + opts + '</select>' +
        '<span class="err">' + HN.t("co_err_wilaya") + '</span>' +
      '</div>'
    );
  }

  var deliveryType = "office";

  function wire(subtotal, ship) {
    var form        = document.getElementById("orderForm");
    var addrWrap    = document.getElementById("addressWrap");
    var addrInput   = document.getElementById("address");
    var deliveryOpts = form.querySelectorAll(".delivery-opt");

    /* delivery type toggle */
    deliveryOpts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        deliveryType = btn.getAttribute("data-type");
        deliveryOpts.forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
        if (deliveryType === "home") {
          addrWrap.style.display = "";
          if (addrInput) addrInput.setAttribute("data-required", "1");
        } else {
          addrWrap.style.display = "none";
          if (addrInput) { addrInput.removeAttribute("data-required"); addrInput.value = ""; }
          if (addrWrap) addrWrap.querySelector(".field").classList.remove("invalid");
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[data-required]").forEach(function (input) {
        var fieldEl = input.closest(".field");
        var valid = String(input.value).trim().length > 0;
        if (input.id === "phone") valid = /^[0-9 +]{8,}$/.test(input.value.trim());
        fieldEl.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select");
        if (firstBad) firstBad.focus();
        return;
      }
      placeOrder(subtotal, ship);
    });

    form.querySelectorAll("[data-required]").forEach(function (input) {
      input.addEventListener("input", function () {
        input.closest(".field").classList.remove("invalid");
      });
    });
  }

  function placeOrder(subtotal, ship) {
    var data = {};
    ["firstName", "lastName", "phone", "wilaya", "city", "address"].forEach(function (k) {
      var el = document.getElementById(k);
      data[k] = el ? el.value.trim() : "";
    });

    var order = {
      ref: "HN-" + Date.now().toString(36).toUpperCase().slice(-6),
      customer: data,
      deliveryType: deliveryType,
      items: DB.cart(),
      subtotal: subtotal,
      delivery: ship,
      total: subtotal + ship,
      payment: "Cash on delivery",
      placedAt: new Date().toISOString()
    };

    console.log("ORDER:", order);
    DB.saveOrder(order);
    DB.clearCart();
    HN.updateBadge();
    showSuccess(order);
  }

  function showSuccess(order) {
    if (crumb) crumb.style.display = "none";
    root.innerHTML =
      '<div class="success">' +
        '<div class="success__check">' + HN.icon("check") + '</div>' +
        '<h1>' + HN.t("co_success_title") + '</h1>' +
        '<p>' + HN.t("co_success_p1", { name: HN.escape(order.customer.firstName) }) + '</p>' +
        '<p>' + HN.t("co_success_p2", {
          phone:  '<b class="mono">' + HN.escape(order.customer.phone) + '</b>',
          city:   HN.escape(order.customer.city),
          wilaya: HN.escape(order.customer.wilaya.replace(/^\d+\s-\s/, ""))
        }) + '</p>' +
        '<div class="success__ref">REF ' + order.ref + ' · ' + HN.money(order.total) + ' DA</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn--accent" href="index.html">' + HN.t("co_keep_shop") + '</a>' +
        '</div>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  render();

  document.addEventListener("hn:langchange", render);
})();
