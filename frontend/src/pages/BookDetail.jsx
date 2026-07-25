import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCarousel from "../components/BookCarousel";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import BookCard from "../components/BookCard";
import "./bookdetail.css";

const API_URL = import.meta.env.VITE_API_URL;

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3C4.23858 3 2 5.21619 2 7.95C2 10.157 2.87466 15.3947 11.4875 20.6903C11.7994 20.8821 12.2006 20.8821 12.5125 20.6903C21.1253 15.3947 22 10.157 22 7.95C22 5.21619 19.7614 3 17 3C14.2386 3 12 6 12 6C12 6 9.76142 3 7 3Z"/>
  </svg>
);
const ThumbsDownIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#B64646" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);
const BookmarkIcon = ({ filled }) => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const MapPinIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const TruckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const HandshakeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12l-1.5-1.5a4 4 0 1 0-5.65 5.65l6 6M16 12l1.5-1.5a4 4 0 1 1 5.65 5.65l-6 6" /><path d="M15 15l-6-6" /></svg>;
const ExpandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>
  </svg>
);

const SELLING_METHOD_LABELS = { meetup: "შეხვედრა", delivery: "მიწოდება/კურიერი" };
const getSellingMethodsText = (method) => {
  if (!method) return "";
  if (Array.isArray(method)) return method.map(m => SELLING_METHOD_LABELS[m] || m).join(", ");
  return SELLING_METHOD_LABELS[method] || method;
};

const CONDITION_INFO = {
  new:     { label: "ახალი",       bg: "#e6f4ea", color: "#1e8e3e" },
  good:    { label: "კარგი",       bg: "#e8f0fe", color: "#1a73e8" },
  average: { label: "საშუალო",     bg: "#fef7e0", color: "#f9ab00" },
  damaged: { label: "დაზიანებული", bg: "#fce8e6", color: "#d93025" },
};

// ── Fullscreen lightbox ──
function ImageLightbox({ photos, activeIndex, onClose, onNavigate }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNavigate]);

  return (
    <div className="bd-lightbox-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="bd-lightbox-close" onClick={onClose} aria-label="Close fullscreen image">✕</button>

      {photos.length > 1 && (
        <button className="bd-lightbox-arrow bd-lightbox-arrow-left" onClick={() => onNavigate(-1)} aria-label="Previous photo">‹</button>
      )}

      <img src={photos[activeIndex]} alt="" className="bd-lightbox-img" />

      {photos.length > 1 && (
        <button className="bd-lightbox-arrow bd-lightbox-arrow-right" onClick={() => onNavigate(1)} aria-label="Next photo">›</button>
      )}

      {photos.length > 1 && (
        <span className="bd-lightbox-counter">{activeIndex + 1} / {photos.length}</span>
      )}
    </div>
  );
}

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();

  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [userRating, setUserRating] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/books/${id}`).then(res => { if (!res.ok) throw new Error("not found"); return res.json(); }),
      fetch(`${API_URL}/books/${id}/related`).then(res => res.ok ? res.json() : { related_books: [] })
    ])
    .then(([bookData, relatedData]) => {
      setBook(bookData);
      setUserRating(bookData.user_rating ?? null);
      setIsBookmarked(bookData.is_bookmarked ?? false);
      setRelatedBooks(relatedData.related_books || []);
      setActivePhoto(0);
      setLoading(false);
    })
    .catch(() => setLoading(false));

    window.scrollTo(0, 0);
  }, [id]);

  function handleAdd() {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleRate(e, actionType) {
    e.preventDefault();
    if (!user) return;
    const newAction = userRating === actionType ? "remove" : actionType;
    const prevRating = userRating;
    setUserRating(newAction === "remove" ? null : newAction);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/books/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: newAction }),
      });
      if (!res.ok) setUserRating(prevRating);
    } catch { setUserRating(prevRating); }
  }

  async function handleBookmark(e) {
    e.preventDefault();
    if (!user) return;
    const prevBookmark = isBookmarked;
    setIsBookmarked(!prevBookmark);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/books/${id}/bookmark`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setIsBookmarked(data.bookmarked); }
      else setIsBookmarked(prevBookmark);
    } catch { setIsBookmarked(prevBookmark); }
  }

  const photos = book?.photos_urls ?? [];
  const hasVideo = !!book?.book_video_url;
  const isViewingVideo = hasVideo && activePhoto === photos.length;

  const navigateLightbox = useCallback((dir) => {
    setActivePhoto((p) => (p + dir + photos.length) % photos.length);
  }, [photos.length]);

  if (loading) {
    return (
      <>
        <Navbar />
        <h2 className="bd-loading">იტვირთება...</h2>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Navbar />
        <div className="bd-not-found">
          <h2>წიგნი ვერ მოიძებნა</h2>
          <button onClick={() => navigate(-1)} className="bd-back-btn">← უკან დაბრუნება</button>
        </div>
      </>
    );
  }

  const isOwnBook = isLoggedIn && user?.id != null && book.seller?.id != null && user.id === book.seller.id;
  const conditionObj = CONDITION_INFO[book.condition] || { label: book.condition, bg: "#f3f4f6", color: "#4b5563" };

  return (
    <>
      <Navbar />
      <main className="bd-main">
        <button onClick={() => navigate(-1)} className="bd-back-btn">← უკან</button>

        <div className="bd-layout">
          {/* GALLERY */}
          <div className="bd-gallery-col">
            <div
              className="bd-main-img-wrap"
              onClick={() => !isViewingVideo && setLightboxOpen(true)}
            >
              {user && (
                <button
                  onClick={handleBookmark}
                  className={`bd-img-bookmark-btn${isBookmarked ? " active" : ""}`}
                  aria-label="შენახვა"
                >
                  <BookmarkIcon filled={isBookmarked} />
                </button>
              )}

              {!isViewingVideo && (
                <span className="bd-expand-hint" aria-hidden="true"><ExpandIcon /></span>
              )}

              {isViewingVideo ? (
                <video src={book.book_video_url} controls playsInline controlsList="nodownload" className="bd-main-media" />
              ) : (
                <img src={photos[activePhoto] ?? "/placeholder.jpg"} alt={book.title} className="bd-main-media" />
              )}
            </div>

            {(photos.length > 1 || hasVideo) && (
              <div className="bd-thumbs">
                {photos.map((url, i) => (
                  <img
                    key={i} src={url} alt=""
                    onClick={() => setActivePhoto(i)}
                    className={`bd-thumb${i === activePhoto ? " active" : ""}`}
                  />
                ))}
                {hasVideo && (
                  <div
                    onClick={() => setActivePhoto(photos.length)}
                    className={`bd-thumb bd-thumb-video${activePhoto === photos.length ? " active" : ""}`}
                  >
                    ▶
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="bd-details-col">
            <h1 className="bd-title">{book.title}</h1>
            {book.author && <p className="bd-author">{book.author}</p>}

            <div className="bd-price-row">
              <span className="bd-price">{book.price} ₾</span>
              <div className="bd-divider" />
              <div className="bd-condition-badge" style={{ backgroundColor: conditionObj.bg, color: conditionObj.color }}>
                {conditionObj.label}
              </div>
            </div>

            <div className="bd-tags-row">
              {book.language && <span className="bd-tag-outline">{book.language}</span>}
              {book.genres?.map(g => <span key={g} className="bd-tag">{g}</span>)}
            </div>

            {book.description && (
              <div className="bd-desc-block">
                <h4 className="bd-section-title">აღწერა</h4>
                <p className="bd-desc-text">{book.description}</p>
              </div>
            )}

            {book.seller && (
              <div className="bd-seller-box">
                <h4 className="bd-section-title bd-seller-heading">გამყიდველის ინფორმაცია</h4>
                <div className="bd-seller-grid">
                  <div className="bd-seller-row">
                    <div className="bd-icon-circle"><UserIcon /></div>
                    <div><span className="bd-info-label">მომხმარებელი</span><strong>{book.seller.username}</strong></div>
                  </div>

                  {book.seller.location && (
                    <div className="bd-seller-row">
                      <div className="bd-icon-circle"><MapPinIcon /></div>
                      <div><span className="bd-info-label">ლოკაცია</span><strong>{book.seller.location}</strong></div>
                    </div>
                  )}

                  {book.seller.selling_method && (
                    <div className="bd-seller-row bd-seller-row-full">
                      <div className="bd-icon-circle bd-icon-circle-green">
                        {Array.isArray(book.seller.selling_method) && book.seller.selling_method.includes("meetup")
                          ? <HandshakeIcon /> : <TruckIcon />}
                      </div>
                      <div>
                        <span className="bd-info-label">გაყიდვის მეთოდი</span>
                        <strong className="bd-selling-method-val">{getSellingMethodsText(book.seller.selling_method)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isOwnBook ? (
              <div className="bd-own-book-alert">ეს თქვენი განცხადებაა</div>
            ) : (
              <div className="bd-actions-row">
                {user && (
                  <>
                    <button onClick={(e) => handleRate(e, "like")} className={`bd-action-btn${userRating === "like" ? " like-active" : ""}`}>
                      <HeartIcon filled={userRating === "like"} />
                    </button>
                    <button onClick={(e) => handleRate(e, "dislike")} className={`bd-action-btn${userRating === "dislike" ? " dislike-active" : ""}`}>
                      <ThumbsDownIcon filled={userRating === "dislike"} />
                    </button>
                  </>
                )}

                <button onClick={handleAdd} disabled={added} className={`bd-add-cart-btn${added ? " added" : ""}`}>
                  {added ? <><CheckIcon /> კალათაში დამატდა</> : <><CartIcon /> კალათაში დამატება</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {relatedBooks.length > 0 && (
          relatedBooks.length > 8 ? (
            <BookCarousel
              title="მსგავსი წიგნები"
              books={relatedBooks}
              rows={1}
            />
          ) : (
            <div className="bd-related-section">
              <h2 className="bd-related-title">მსგავსი წიგნები</h2>
              <div className="bd-related-grid">
                {relatedBooks.map(related => <BookCard key={related.id} book={related} />)}
              </div>
            </div>
          )
        )}
      </main>

      {lightboxOpen && (
        <ImageLightbox
          photos={photos}
          activeIndex={activePhoto}
          onClose={() => setLightboxOpen(false)}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}

export default BookDetail;