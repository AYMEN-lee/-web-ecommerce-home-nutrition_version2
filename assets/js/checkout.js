/* =========================================================================
   HN NUTRITION — checkout (cash on delivery)
   Collects: first name, last name, phone, wilaya (state), city.
   No payment is taken — order is confirmed for COD. Wire this form to your
   backend later (POST the `order` object built in placeOrder()).
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("checkoutRoot");
  var SHIP_FREE_FROM = 5000;
  var SHIP_COST = 500;

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
    "53 - In Salah","54 - In Guezzam","55 - Touggourt","56 - Djanet","57 - El M'Ghair","58 - El Meniaa"
  ];

  function shipping(total) { return total >= SHIP_FREE_FROM || total === 0 ? 0 : SHIP_COST; }

  function render() {
    var cart = DB.cart();
    if (!cart.length) {
      root.innerHTML =
        '<div class="empty"><h3>Nothing to confirm</h3>' +
        '<p>Your cart is empty.</p>' +
        '<a class="btn btn--accent" href="index.html" style="margin-top:18px">Go shopping</a></div>';
      return;
    }

    var subtotal = DB.cartTotal();
    var ship = shipping(subtotal);

    var miniItems = cart.map(function (it) {
      return (
        '<div class="mini-item">' +
          '<div class="mini-item__img"><img src="' + HN.escape(it.image) + '" alt=""></div>' +
          '<div class="mini-item__info">' +
            '<div class="mini-item__name">' + HN.escape(it.name) + ' <span class="muted mono" style="font-size:11px">×' + it.qty + '</span></div>' +
            '<div class="mini-item__opts">' + HN.escape(it.flavor) + ' · ' + HN.escape(it.weight) + '</div>' +
          '</div>' +
          '<div class="mini-item__price">' + HN.money(it.price * it.qty) + ' DA</div>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<div class="checkout-layout">' +
        '<div class="form-card">' +
          '<h3>Delivery details</h3>' +
          '<p>We deliver across all 58 wilayas. Pay cash when your order arrives.</p>' +
          '<form id="orderForm" novalidate>' +
            '<div class="field-grid">' +
              field("firstName", "First name", "text", "e.g. Yacine") +
              field("lastName", "Last name", "text", "e.g. Benali") +
            '</div>' +
            field("phone", "Phone number", "tel", "0X XX XX XX XX", true) +
            '<div class="field-grid">' +
              wilayaField() +
              field("city", "City / Commune", "text", "e.g. Djelfa") +
            '</div>' +
            field("address", "Address (optional)", "text", "Street, building, landmark…", true, false) +
            '<button type="submit" class="btn btn--accent btn--block btn--lg" style="margin-top:8px">' +
              'Place order · ' + HN.money(subtotal + ship) + ' DA</button>' +
          '</form>' +
        '</div>' +

        '<aside class="summary">' +
          '<h3>Your order</h3>' +
          miniItems +
          '<div class="summary__row" style="margin-top:14px"><span>Subtotal</span><span>' + HN.money(subtotal) + ' DA</span></div>' +
          '<div class="summary__row"><span>Delivery</span><span>' + (ship === 0 ? "Free" : HN.money(ship) + " DA") + '</span></div>' +
          '<div class="summary__total"><span>Total</span><b>' + HN.money(subtotal + ship) + ' DA</b></div>' +
          '<p class="summary__note">Cash on delivery. No prepayment needed.</p>' +
          '<a class="btn btn--ghost btn--block" href="cart.html">Back to cart</a>' +
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
        '<span class="err">This field is required.</span>' +
      '</div>'
    );
  }

  function wilayaField() {
    var opts = '<option value="">Select wilaya…</option>' +
      WILAYAS.map(function (w) { return '<option value="' + HN.escape(w) + '">' + HN.escape(w) + '</option>'; }).join("");
    return (
      '<div class="field">' +
        '<label for="wilaya">Wilaya (state) <span class="req">*</span></label>' +
        '<select id="wilaya" name="wilaya" data-required="1">' + opts + '</select>' +
        '<span class="err">Please choose your wilaya.</span>' +
      '</div>'
    );
  }

  function wire(subtotal, ship) {
    var form = document.getElementById("orderForm");

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

    // clear error as the customer types
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
      items: DB.cart(),
      subtotal: subtotal,
      delivery: ship,
      total: subtotal + ship,
      payment: "Cash on delivery",
      placedAt: new Date().toISOString()
    };

    // ---- Backend hook: POST `order` to your API here. ----
    console.log("ORDER (send to backend later):", order);

    DB.clearCart();
    HN.updateBadge();
    showSuccess(order);
  }

  function showSuccess(order) {
    document.querySelector(".crumb").style.display = "none";
    root.innerHTML =
      '<div class="success">' +
        '<div class="success__check">' + HN.icon("check") + '</div>' +
        '<h1>Order confirmed</h1>' +
        '<p>Thanks, ' + HN.escape(order.customer.firstName) + '. Your order is in.</p>' +
        '<p>We\'ll call <b class="mono">' + HN.escape(order.customer.phone) + '</b> to confirm delivery to ' +
          HN.escape(order.customer.city) + ', ' + HN.escape(order.customer.wilaya.replace(/^\d+\s-\s/, "")) + '.</p>' +
        '<div class="success__ref">REF ' + order.ref + ' · ' + HN.money(order.total) + ' DA</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn--accent" href="index.html">Keep shopping</a>' +
        '</div>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  render();
})();
