import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Styles/cart.css"

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_LABEL = {
  pending: "⏳ მოლოდინში — გადახდა/დადასტურება მიმდინარეობს",
  sold: "❌ გაყიდულია",
  seller_deleted: "⚠️ გამყიდველი აღარ არის",
};

// განსხვავებული ფერების პალიტრა გამყიდველების ღილაკებისთვის
const SELLER_BUTTON_COLORS = [
  "#b87743", // მთავარი ბრენდის ფერი (ყავისფერი/ხაკისფერი)
  "#10dbca", // ცისფერი
  "#7c3aed", // იისფერი
  "#0d9488", // ზურმუხტისფერი / მწვანე
  "#db2777", // ვარდისფერი
  "#ea580c", // სტაფილოსფერი
];

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", verticalAlign: "middle" }}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export function CartSidebar({ isOpen, onClose }) {
  const { cartBySeller, removeFromCart, totalItems, totalPrice, checkoutSeller, checkoutState, loading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleSellerCheckout(sellerId) {
    try {
      await checkoutSeller(sellerId);
    } catch {
      // შეცდომა უკვე console-შია და checkoutState-შიც აისახა
    }
  }

  function handleViewBook(bookId) {
    onClose();
    navigate(`/book/${bookId}`);
  }

  return (
    <>
      <div className={`cart-backdrop${isOpen ? " visible" : ""}`} onClick={onClose} aria-hidden="true" />

      <div className={`cart-panel${isOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="cart-hd">
          <h2 className="cart-title">
            კალათა
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </h2>
          <button className="cart-x" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {loading ? (
          <div className="cart-body"><p className="cart-empty-txt">იტვირთება...</p></div>
        ) : cartBySeller.length === 0 ? (
          <div className="cart-body">
            <p className="cart-empty-txt">კალათა ცარიელია</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartBySeller.map((group, index) => {
                const activeItems = group.items.filter((i) => i.status === "active");
                const hasActive = activeItems.length > 0;
                
                // ვარჩევთ ფერს ინდექსის მიხედვით
                const buttonColor = SELLER_BUTTON_COLORS[index % SELLER_BUTTON_COLORS.length];
                const isDisabled = !hasActive || checkoutState[group.sellerId] === "loading";

                return (
                  <div key={group.sellerId} className="seller-group" style={{ marginBottom: "32px" }}>
                    
                    {/* დავამატეთ gap: "24px" რათა ერთი გამყიდველის წიგნებს შორის მეტი დაშორება იყოს */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {group.items.map((item) => {
                        const isActive = item.status === "active";
                        return (
                          <div key={item.cart_item_id} className={`ci${isActive ? "" : " ci-disabled"}`}>
                            <img
                                src={item.photos_urls?.[0] ?? "/placeholder.jpg"}
                                alt={item.title}
                                className="ci-img"
                                loading="lazy"
                                onClick={() => handleViewBook(item.id)}
                                style={{ cursor: "pointer" }}
                              />
                              
                              <div className="ci-info">
                                <p 
                                  className="ci-title" 
                                  onClick={() => handleViewBook(item.id)}
                                  style={{ cursor: "pointer", transition: "color 0.2s" }}
                                >
                                  {item.title}
                                </p>
                                <p className="ci-author">{item.author ?? "—"}</p>
                              </div>

                              {/* Price and status isolated to move independently on mobile grid */}
                              <div className="ci-meta-group">
                                {!isActive && (
                                  <p className="ci-status-msg">
                                    {STATUS_LABEL[item.status] || item.message}
                                  </p>
                                )}
                                <p className="ci-price">{item.price} ₾</p>
                              </div>
                              
                              <div className="ci-right">
                                <button
                                  className="ci-remove"
                                  onClick={() => removeFromCart(item.cart_item_id)}
                                  disabled={!isActive}
                                  title={isActive ? "წაშლა" : "მოლოდინში მყოფი წიგნის წაშლა შეუძლებელია"}
                                  aria-label={`${item.title}-ის წაშლა`}
                                >
                                  ✕
                                </button>

                                <button
                                  className="ci-view-btn"
                                  onClick={() => handleViewBook(item.id)}
                                >
                                  ნახვა <ArrowRightIcon />
                                </button>
                              </div>
                            </div>
                        );
                      })}
                    </div>

                    <button
                      className="seller-checkout-btn"
                      disabled={isDisabled}
                      onClick={() => handleSellerCheckout(group.sellerId)}
                      style={{
                        backgroundColor: isDisabled ? "#e5e7eb" : buttonColor,
                        color: isDisabled ? "#9ca3af" : "#ffffff",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        borderRadius: "14px",
                        padding: "8px 15px",
                        border: "none",
                        fontWeight: "500",
                        fontSize: "0.85rem",
                        width: "100%",
                        boxShadow: isDisabled ? "none" : "0 4px 14px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.2s ease-in-out",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "24px" // გაიზარდა დაშორება ღილაკსა და წიგნებს შორის
                      }}
                    >
                      {checkoutState[group.sellerId] === "loading"
                        ? "იგზავნება..."
                        : hasActive
                          ? `${group.sellerUsername}-ისგან ${activeItems.length} წიგნის ყიდვა`
                          : "მოთხოვნა უკვე გაგზავნილია"}
                    </button>

                    {checkoutState[group.sellerId] === "error" && (
                      <p className="seller-checkout-error">დაფიქსირდა შეცდომა, სცადეთ თავიდან.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-lbl">სულ (აქტიური წიგნები)</span>
                <span className="cart-total-val">{totalPrice.toFixed(2)} ₾</span>
              </div>
              <p className="cart-hint">
                მოლოდინში მყოფი წიგნები კალათაში დარჩება, სანამ გამყიდველი არ დაადასტურებს ან გააუქმებს გადახდას.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default CartSidebar;