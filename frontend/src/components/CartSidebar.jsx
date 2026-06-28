import { useEffect } from "react";
import { useCart } from "../context/CartContext";

export function CartSidebar({ isOpen, onClose }) {
  const { items, removeFromCart, updateQty, totalItems, totalPrice } = useCart();

  // body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`cart-backdrop${isOpen ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel */}
      <div
        className={`cart-panel${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* ── header ── */}
        <div className="cart-hd">
          <h2 className="cart-title">
            Shopping Cart
            {totalItems > 0 && (
              <span className="cart-count">{totalItems}</span>
            )}
          </h2>
          <button className="cart-x" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* ── empty state ── */}
        {items.length === 0 ? (
          <div className="cart-body">
            <svg
              className="cart-empty-icon"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M4 7H11L20 37H44"          stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 13H50L44 37H20"         stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="24" cy="46" r="3.5"      stroke="currentColor" strokeWidth="2.8"/>
              <circle cx="40" cy="46" r="3.5"      stroke="currentColor" strokeWidth="2.8"/>
            </svg>
            <p className="cart-empty-txt">Your cart is empty</p>
          </div>

        ) : (
          <>
            {/* ── item list ── */}
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="ci">
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="ci-img"
                    loading="lazy"
                  />

                  <div className="ci-info">
                    <p className="ci-title">{item.title}</p>
                    <p className="ci-author">{item.author}</p>
                    <p className="ci-price">${item.price}</p>
                  </div>

                  <div className="ci-right">
                    <button
                      className="ci-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.title}`}
                    >
                      ✕
                    </button>

                    <div className="ci-qty" role="group" aria-label="Quantity">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── footer ── */}
            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-lbl">Total</span>
                <span className="cart-total-val">${totalPrice.toFixed(2)}</span>
              </div>
              <button className="cart-checkout-btn">
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
