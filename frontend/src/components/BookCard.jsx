import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// books.condition (ბექ enum) → ვიზუალური badge
const CONDITION_BADGE = {
  new:     { label: "ახალი",        cls: "bc-new" },
  good:    { label: "კარგი",        cls: "bc-new" },
  average: { label: "საშუალო",     cls: "bc-pending" },
  damaged: { label: "დაზიანებული", cls: "bc-ist" },
};

const CartIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    aria-hidden="true"
    style={{ marginRight: "1px", verticalAlign: "middle" }}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

function BookCard({ book }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // author: ახალი DB სვეტი; fallback — გამყიდველის username
  const authorLine  = book.author ?? book.seller?.username ?? "—";
  const cover       = book.photos_urls?.[0] ?? "/placeholder.jpg";
  const badge       = CONDITION_BADGE[book.condition];

  function handleAdd() {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  }

  return (
    <article className="bc">
      <Link to={`/book/${book.id}`} className="bc-img-wrap">
        <img src={cover} alt={book.title} className="bc-img" loading="lazy" />
        {badge && (
          <span className={`bc-badge ${badge.cls}`}>{badge.label}</span>
        )}
      </Link>

      <div className="bc-info">
        <p className="bc-title">{book.title}</p>
        <p className="bc-author">{authorLine}</p>
        <div className="bc-foot">
          <span className="bc-price">{book.price} ₾</span>
          <button
            className={`bc-cart${added ? " bc-cart-ok" : ""}`}
            onClick={handleAdd}
            aria-label={`${book.title} კალათაში დამატება`}
          >
            {added ? (
                <>
                  ✓
                </>
              ) : (
                <>
                    <CartIcon />
                </>
              )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default BookCard;