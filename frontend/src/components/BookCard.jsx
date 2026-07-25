import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const CONDITION_BADGE = {
  new:     { label: "ახალი",        cls: "bc-new" },
  good:    { label: "კარგი",        cls: "bc-good" },
  average: { label: "საშუალო",     cls: "bc-pending" },
  damaged: { label: "დაზიანებული", cls: "bc-ist" },
};

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "middle" }}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round">
    <path d="M7 3C4.23858 3 2 5.21619 2 7.95C2 10.157 2.87466 15.3947 11.4875 20.6903C11.7994 20.8821 12.2006 20.8821 12.5125 20.6903C21.1253 15.3947 22 10.157 22 7.95C22 5.21619 19.7614 3 17 3C14.2386 3 12 6 12 6C12 6 9.76142 3 7 3Z"/>
  </svg>
);

const ThumbsDownIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#B64646" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

function BookCard({ book }) {
  const { addToCart } = useCart();
  const { user } = useAuth(); // მოწმდება იუზერი
  const [added, setAdded] = useState(false);

  const [userRating, setUserRating] = useState(book.user_rating ?? null);
  const [isBookmarked, setIsBookmarked] = useState(book.is_bookmarked ?? false);

  const authorLine = book.author ?? book.seller?.username ?? "—";
  const cover      = book.photos_urls?.[0] ?? "/placeholder.jpg";
  const badge      = CONDITION_BADGE[book.condition];
  const isReserved = book.status === "reserved";

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  }

  async function handleRate(e, actionType) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return; // არალოგინებულები ვერ დააკლიკებენ

    const newAction = userRating === actionType ? "remove" : actionType;
    const prevRating = userRating;
    setUserRating(newAction === "remove" ? null : newAction);

    try {
      const token = localStorage.getItem("token"); // ტოკენის წამოღება
      const res = await fetch(`${API_URL}/books/${book.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action: newAction }),
      });
      if (!res.ok) setUserRating(prevRating);
    } catch {
      setUserRating(prevRating);
    }
  }

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const prevBookmark = isBookmarked;
    setIsBookmarked(!prevBookmark);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/books/${book.id}/bookmark`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
      } else {
        setIsBookmarked(prevBookmark);
      }
    } catch {
      setIsBookmarked(prevBookmark);
    }
  }

  return (
    <article className="bc">
      <Link to={`/book/${book.id}`} className="bc-img-wrap">
        <img src={cover} alt={book.title} className="bc-img" loading="lazy" />
        <div className="bc-img-overlay"></div>

        {/* Reserved (ზედა მარჯვენა) */}
        {isReserved && (
          <span className="bc-reserved-badge">დაჯავშნილი</span>
        )}

        {/* Bookmark (ზედა მარცხენა) - ჩანს მხოლოდ დალოგინებულისთვის */}
        {user && (
          <button 
            className={`bc-bookmark-btn ${isBookmarked ? "active" : ""}`} 
            onClick={handleBookmark}
            aria-label="შენახვა"
          >
            <BookmarkIcon filled={isBookmarked} />
          </button>
        )}

        {/* ხარისხი (ქვედა მარცხენა) */}
        {badge && (
          <span className={`bc-condition-badge ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </Link>

      <div className="bc-info">
        <p className="bc-title">{book.title}</p>
        <p className="bc-author">{authorLine}</p>
        
        <div className="bc-foot">
          <span className="bc-price">{book.price} ₾</span>
          
          <div className="bc-actions">
            {/* Like/Dislike (მხოლოდ დალოგინებულისთვის) */}
            {user && (
              <>
                <button
                  onClick={(e) => handleRate(e, "like")}
                  className={`bc-action-btn ${userRating === "like" ? "active-like" : ""}`}
                  aria-label="მოწონება"
                >
                  <HeartIcon filled={userRating === "like"} />
                </button>

                <button
                  onClick={(e) => handleRate(e, "dislike")}
                  className={`bc-action-btn ${userRating === "dislike" ? "active-dislike" : ""}`}
                  aria-label="არ მოწონება"
                >
                  <ThumbsDownIcon filled={userRating === "dislike"} />
                </button>
              </>
            )}

            <button
              className={`bc-cart-btn ${added ? "bc-cart-ok" : ""}`}
              onClick={handleAdd}
              aria-label={`${book.title} კალათაში დამატება`}
            >
              {added ? "✓" : <CartIcon />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default BookCard;