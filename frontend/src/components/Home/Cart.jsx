import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Styles/cart.css";

const API_URL = import.meta.env.VITE_API_URL;

const SELLER_BUTTON_COLORS = [
  "#b87743",
  "#10dbca",
  "#5e2eb1",
  "#0d9488",
  "#db2777",
  "#ea580c",
];

const RESERVED_MESSAGE = "თუ წიგნი არ გაიყიდა, დაბრუნდება კალათაში";

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", verticalAlign: "middle" }}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Reusable Collapsible Section for Requested and Unavailable items ───
function CollapsibleBookSection({
  title,
  items,
  removeFromCart,
  onViewBook,
  isRequestedSection = false,
}) {
  const [open, setOpen] = useState(false);

  // თუ სექციაში 0 ელემენტია, სრულიად ქრება
  if (!items || items.length === 0) return null;

  return (
    <div className="unavailable-section">
      <button className="unavailable-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="unavailable-toggle-label">
          {title} ({items.length})
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="unavailable-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {items.map((item) => {
              const isReserved = item.status === "reserved";
              const targetBookId = item.book_id || item.id;

              return (
                <div
                  key={item.cart_item_id}
                  className={`unavailable-item${isReserved ? " unavailable-item-reserved" : ""}`}
                >
                  <img
                    src={item.photos_urls?.[0] ?? "/placeholder.jpg"}
                    alt={item.title}
                    className={`unavailable-item-img${isReserved ? "" : " grayscale"}`}
                    onClick={() => onViewBook(targetBookId)}
                    style={{ cursor: "pointer" }}
                  />

                  <div className="unavailable-item-info">
                    <p
                      className={`unavailable-item-title${isReserved ? "" : " strike"}`}
                      onClick={() => onViewBook(targetBookId)}
                      style={{ cursor: "pointer", transition: "color 0.2s" }}
                    >
                      {item.title}
                    </p>
                    <p className="unavailable-item-author">{item.author ?? "—"}</p>
                    {isReserved ? (
                      <p className="unavailable-reserved-msg">{RESERVED_MESSAGE}</p>
                    ) : (
                      <span className="unavailable-badge">{item.message}</span>
                    )}
                  </div>

                  <div className="ci-right">
                    <button
                      className="ci-remove"
                      disabled={isRequestedSection}
                      onClick={() => !isRequestedSection && removeFromCart(item.cart_item_id)}
                      title={
                        isRequestedSection
                          ? "ეს წიგნი თქვენი მოთხოვნილია, დაელოდეთ გამყიდველის დასტურს"
                          : "წაშლა"
                      }
                      aria-label={
                        isRequestedSection
                          ? "ეს წიგნი თქვენი მოთხოვნილია, დაელოდეთ გამყიდველის დასტურს"
                          : `${item.title}-ის წაშლა`
                      }
                      style={
                        isRequestedSection
                          ? { opacity: 0.4, cursor: "not-allowed" }
                          : {}
                      }
                    >
                      ✕
                    </button>

                    <button
                      className="ci-view-btn"
                      onClick={() => onViewBook(targetBookId)}
                    >
                      ნახვა <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmBulkRemoveModal({ sellerUsername, itemCount, onConfirm, onCancel }) {
  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <p className="confirm-modal-text">
          დარწმუნებული ხართ, რომ გსურთ {sellerUsername}-ის {itemCount} წიგნის კალათიდან ამოშლა?
        </p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-cancel" onClick={onCancel}>გაუქმება</button>
          <button className="confirm-modal-confirm" onClick={onConfirm}>წაშლა</button>
        </div>
      </div>
    </div>
  );
}

export function CartSidebar({ isOpen, onClose }) {
  const {
    cartBySeller,
    removeFromCart,
    totalItems,
    totalPrice,
    checkoutSeller,
    checkoutState,
    loading,
    updateQuantity,
  } = useCart();
  const navigate = useNavigate();
  const [confirmGroup, setConfirmGroup] = useState(null);

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

  // დამხმარე ფუნქცია: ამოწმებს, არის თუ არა წიგნი მიმდინარე მომხმარებლის მიერ მოთხოვნილი
  const isMyReservedItem = (item) => item.is_reserved_by_me === true;

  // 1. ხელმისაწვდომი წიგნები
  const availableGroups = cartBySeller
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => i.status === "active" && !isMyReservedItem(i)),
    }))
    .filter((group) => group.items.length > 0);

  // 2. ჩემი მოთხოვნილი წიგნები
  const requestedItems = cartBySeller.flatMap((group) =>
    group.items.filter(isMyReservedItem)
  );

  // 3. მიუწვდომელი (სხვის მიერ რეზერვირებული, გაყიდული ან წაშლილი)
  const unavailableItems = cartBySeller.flatMap((group) =>
    group.items.filter((i) => i.status !== "active" && !isMyReservedItem(i))
  );

  async function handleSellerCheckout(sellerId) {
    try {
      await checkoutSeller(sellerId);
    } catch {
      // შეცდომა უკვე console-შია
    }
  }

  function handleViewBook(bookId) {
    onClose();
    navigate(`/book/${bookId}`);
  }

  async function handleConfirmBulkRemove() {
    if (!confirmGroup) return;
    try {
      await Promise.all(confirmGroup.items.map((item) => removeFromCart(item.cart_item_id)));
    } finally {
      setConfirmGroup(null);
    }
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
              {/* 1. ხელმისაწვდომი წიგნების ჯგუფები */}
              {availableGroups.map((group, index) => {
                const buttonColor = SELLER_BUTTON_COLORS[index % SELLER_BUTTON_COLORS.length];
                const isDisabled = checkoutState[group.sellerId] === "loading";

                return (
                  <div key={group.sellerId} className="seller-group" style={{ marginBottom: "32px" }}>

                    <div className="seller-group-header" style={{ borderLeft: `3px solid ${buttonColor}` }}>
                      <button
                        className="seller-remove-bulk-btn"
                        onClick={() => setConfirmGroup(group)}
                        title="ჯგუფის ყველა წიგნი წაიშლება"
                        aria-label={`${group.sellerUsername}-ის ჯგუფის წაშლა`}
                      >
                        წაშლა
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {group.items.map((item) => (
                        <div key={item.cart_item_id} className="ci">
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
                          
                            <div className="ci-meta-group">
                              <p className="ci-price">{item.price} ₾</p>
                              {item.listing_type === "first-hand" && (
                                <div className="qty-stepper">
                                  <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity?.(item.cart_item_id, Math.max(1, (item.quantity ?? 1) - 1))}
                                    disabled={(item.quantity ?? 1) <= 1}
                                    aria-label="რაოდენობის შემცირება"
                                  >
                                    −
                                  </button>
                                  <span className="qty-value">{item.quantity ?? 1}</span>
                                  <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity?.(item.cart_item_id, (item.quantity ?? 1) + 1)}
                                    aria-label="რაოდენობის გაზრდა"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ci-right">
                            <button
                              className="ci-remove"
                              onClick={() => removeFromCart(item.cart_item_id)}
                              title="წაშლა"
                              aria-label={`${item.title}-ის წაშლა`}
                            >
                              ✕
                            </button>

                            <button className="ci-view-btn" onClick={() => handleViewBook(item.id)}>
                              ნახვა <ArrowRightIcon />
                            </button>
                          </div>
                        </div>
                      ))}
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
                        marginTop: "24px"
                      }}
                    >
                      {checkoutState[group.sellerId] === "loading"
                        ? "იგზავნება..."
                        : `${group.sellerUsername}-ისგან ${group.items.length} წიგნის ყიდვა`}
                    </button>

                    {checkoutState[group.sellerId] === "error" && (
                      <p className="seller-checkout-error">დაფიქსირდა შეცდომა, სცადეთ თავიდან.</p>
                    )}
                  </div>
                );
              })}

              {/* 2. ჩემი მოთხოვნილი წიგნების სექცია (ხელმისაწვდომების ქვემოთ, მიუწვდომლების ზემოთ) */}
              <CollapsibleBookSection
                title="⏳ მოთხოვნილი წიგნები"
                items={requestedItems}
                removeFromCart={removeFromCart}
                onViewBook={handleViewBook}
                isRequestedSection={true}
              />

              {/* 3. მიუწვდომელი წიგნების სექცია */}
              <CollapsibleBookSection
                title="⚠️ მიუწვდომელია"
                items={unavailableItems}
                removeFromCart={removeFromCart}
                onViewBook={handleViewBook}
                isRequestedSection={false}
              />
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

      {confirmGroup && (
        <ConfirmBulkRemoveModal
          sellerUsername={confirmGroup.sellerUsername}
          itemCount={confirmGroup.items.length}
          onConfirm={handleConfirmBulkRemove}
          onCancel={() => setConfirmGroup(null)}
        />
      )}
    </>
  );
}

export default CartSidebar;