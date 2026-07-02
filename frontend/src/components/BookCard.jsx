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
            {added ? "✓" : "🛒"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default BookCard;