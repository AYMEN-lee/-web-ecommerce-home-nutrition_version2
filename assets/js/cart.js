/* =========================================================================
   HN NUTRITION — cart
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("cartRoot");
  function render() {
    var cart = DB.cart();

    if (!cart.length) {
      root.innerHTML =
        '<div class="empty"><h3>' + HN.t("cart_empty_title") + '</h3>' +
        '<p>' + HN.t("cart_empty_p") + '</p>' +
        '<a class="btn btn--accent" href="index.html" style="margin-top:18px">' + HN.t("cart_start_shop") + '</a></div>';
      return;
    }

    var subtotal = DB.cartTotal();

    var items = cart.map(function (it) {
      return (
        '<div class="cart-item" data-key="' + HN.escape(it.key) + '">' +
          '<div class="cart-item__img"><img src="' + HN.escape(it.image) + '" alt="' + HN.escape(it.name) + '"></div>' +
          '<div class="cart-item__info">' +
            '<div class="cart-item__brand">' + HN.escape(it.brand) + '</div>' +
            '<div class="cart-item__name">' + HN.escape(it.name) + '</div>' +
            '<div class="cart-item__opts">' + HN.escape(it.flavor) + ' · ' + HN.escape(it.weight) + '</div>' +
          '</div>' +
          '<div class="cart-item__right">' +
            '<div class="stepper">' +
              '<button type="button" data-act="dec" aria-label="Decrease">−</button>' +
              '<input type="number" value="' + it.qty + '" min="1" max="' + it.stock + '" aria-label="Quantity">' +
              '<button type="button" data-act="inc" aria-label="Increase">+</button>' +
            '</div>' +
            '<div class="cart-item__price">' + HN.money(it.price * it.qty) + ' DA</div>' +
            '<button class="link-remove" data-act="rm">' + HN.icon("trash") + ' ' + HN.t("cart_remove") + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<div class="cart-layout">' +
        '<div class="cart-list">' + items + '</div>' +
        '<aside class="summary">' +
          '<h3>' + HN.t("cart_summary") + '</h3>' +
          '<div class="summary__total"><span>' + HN.t("co_total") + '</span><b>' + HN.money(subtotal) + ' DA</b></div>' +
          '<p class="summary__note">' + HN.t("cart_cod") + '</p>' +
          '<a class="btn btn--accent btn--block btn--lg" href="checkout.html">' + HN.t("co_place_order") + '</a>' +
          '<a class="btn btn--ghost btn--block" href="index.html" style="margin-top:10px">' + HN.t("co_keep_shop") + '</a>' +
        '</aside>' +
      '</div>';

    wire();
  }

  function wire() {
    root.querySelectorAll(".cart-item").forEach(function (row) {
      var key = row.getAttribute("data-key");
      var input = row.querySelector("input");

      row.querySelector('[data-act="dec"]').addEventListener("click", function () {
        DB.updateQty(key, parseInt(input.value, 10) - 1); refreshAll();
      });
      row.querySelector('[data-act="inc"]').addEventListener("click", function () {
        DB.updateQty(key, parseInt(input.value, 10) + 1); refreshAll();
      });
      input.addEventListener("change", function () {
        DB.updateQty(key, parseInt(input.value, 10) || 1); refreshAll();
      });
      row.querySelector('[data-act="rm"]').addEventListener("click", function () {
        DB.removeFromCart(key); refreshAll(); HN.toast(HN.t("cart_item_removed"), "trash");
      });
    });
  }

  function refreshAll() { render(); HN.updateBadge(); }

  render();
  document.addEventListener("hn:langchange", render);
})();
