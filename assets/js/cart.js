/* =========================================================================
   HN NUTRITION — cart
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("cartRoot");
  var SHIP_FREE_FROM = 5000;
  var SHIP_COST = 500;

  function shipping(total) { return total >= SHIP_FREE_FROM || total === 0 ? 0 : SHIP_COST; }

  function render() {
    var cart = DB.cart();

    if (!cart.length) {
      root.innerHTML =
        '<div class="empty"><h3>Your cart is empty</h3>' +
        '<p>Find your next tub of fuel in the shop.</p>' +
        '<a class="btn btn--accent" href="index.html" style="margin-top:18px">Start shopping</a></div>';
      return;
    }

    var subtotal = DB.cartTotal();
    var ship = shipping(subtotal);

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
            '<button class="link-remove" data-act="rm">' + HN.icon("trash") + ' Remove</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<div class="cart-layout">' +
        '<div class="cart-list">' + items + '</div>' +
        '<aside class="summary">' +
          '<h3>Order summary</h3>' +
          '<div class="summary__row"><span>Subtotal</span><span>' + HN.money(subtotal) + ' DA</span></div>' +
          '<div class="summary__row"><span>Delivery</span><span>' + (ship === 0 ? "Free" : HN.money(ship) + " DA") + '</span></div>' +
          '<div class="summary__total"><span>Total</span><b>' + HN.money(subtotal + ship) + ' DA</b></div>' +
          '<p class="summary__note">' + (subtotal >= SHIP_FREE_FROM
              ? "You unlocked free delivery."
              : "Add " + HN.money(SHIP_FREE_FROM - subtotal) + " DA more for free delivery.") +
            ' Pay cash on delivery.</p>' +
          '<a class="btn btn--accent btn--block btn--lg" href="checkout.html">Confirm my order</a>' +
          '<a class="btn btn--ghost btn--block" href="index.html" style="margin-top:10px">Continue shopping</a>' +
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
        DB.removeFromCart(key); refreshAll(); HN.toast("Item removed", "trash");
      });
    });
  }

  function refreshAll() { render(); HN.updateBadge(); }

  render();
})();
