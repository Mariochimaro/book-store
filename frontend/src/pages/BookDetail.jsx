import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import BookCarousel from "../components/Home/Bestsellers";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUserBookInteractions } from "../context/UBIContext";
import BookCard from "../components/Home/BookCard";
import "../styles/bookdetail.css";

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
const TruckIcon = () => <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const HandshakeIcon = () => 
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" version="1.1" viewBox="0 0 512 512" xml:space="preserve">
    <g>
      <path class="st0" d="M326.527,171.735c-15.637-2.602-55.941-2.43-82.686,7.296c-26.752,9.725-75.397,40.124-89.988,44.997   c-14.591,4.859-15.81,24.322,17.02,27.964c32.836,3.654,62.018-17.028,69.313-20.669c7.296-3.654,77.826,7.296,77.826,7.296   l22.19,5.468l51.161,69.154c8.977-7.798,26.732-24.349,31.228-36.927c1.641-4.581,4.078-8.792,6.752-12.532l-72.49-99.977   C347.605,169.047,336.444,173.39,326.527,171.735z"/>
      <path class="st0" d="M326.527,254.123l-10.752-1.085c-14.107-2.185-54-7.865-68.975-7.865c-0.662,0-1.185,0.007-1.576,0.026   c-0.602,0.344-1.298,0.742-1.98,1.139c-10.625,6.19-35.524,20.681-64.52,20.681c-3.178,0-6.362-0.179-9.46-0.523   c-4.7-0.523-8.832-1.331-12.486-2.35c3.462,1.516,6.653,3.688,9.381,6.475c4.29,4.383,6.944,9.758,7.997,15.379   c2.496-0.669,5.084-1.04,7.732-1.04c8.116,0,15.71,3.191,21.376,8.99c5.588,5.707,8.613,13.254,8.527,21.238   c0,0.079-0.013,0.159-0.013,0.238c8.083,0.026,15.644,3.218,21.297,8.99c5.587,5.707,8.613,13.253,8.527,21.238   c-0.027,2.754-0.45,5.441-1.198,8.024c5.733,1.198,10.983,4.051,15.18,8.341c11.532,11.791,11.327,30.757-0.457,42.29l-5.898,5.773   c0.026,0,0.053,0,0.079,0c9.917-0.715,18.265-6.832,20.602-16.048c4.038,3.184,9.122,5.097,14.664,5.097   c13.095,0,23.713-10.612,23.713-23.713c0-1.377-0.139-2.714-0.371-4.026c4.171,3.635,9.606,5.852,15.571,5.852   c13.095,0,23.714-10.619,23.714-23.713c2.807,1.172,5.885,1.827,9.116,1.827c13.101,0,23.713-10.619,23.713-23.713   c0-9.944-4.859-16.418-16.418-29.791L326.527,254.123z"/>
      <path class="st0" d="M155.734,280.829c-5.918-6.044-15.61-6.15-21.654-0.238l-21.88,21.416c-6.044,5.912-6.15,15.604-0.238,21.648   c5.918,6.044,15.61,6.15,21.654,0.231l21.886-21.41C161.539,296.565,161.645,286.873,155.734,280.829z"/>
      <path class="st0" d="M192.833,304.158c-5.912-6.051-15.604-6.157-21.648-0.239l-29.175,28.546   c-6.051,5.918-6.15,15.61-0.239,21.648c5.912,6.051,15.611,6.157,21.655,0.239l29.175-28.547   C198.645,319.894,198.751,310.202,192.833,304.158z"/>
      <path class="st0" d="M222.643,334.624c-5.912-6.044-15.604-6.157-21.648-0.238l-29.175,28.553   c-6.044,5.911-6.15,15.603-0.238,21.654c5.912,6.038,15.604,6.144,21.655,0.225l29.175-28.546   C228.456,350.353,228.562,340.661,222.643,334.624z"/>
      <path class="st0" d="M245.158,372.226c-5.912-6.044-15.604-6.156-21.648-0.238l-17.02,16.657   c-6.044,5.911-6.15,15.603-0.238,21.648c5.918,6.044,15.61,6.144,21.654,0.238l17.02-16.656   C250.971,387.963,251.07,378.271,245.158,372.226z"/>
      <path class="st0" d="M510.606,234.991l-97.792-134.866c-2.364-3.27-6.925-3.991-10.189-1.628l-43.315,31.412   c-3.264,2.363-3.992,6.925-1.622,10.188L455.48,274.97c2.363,3.264,6.925,3.992,10.188,1.622l43.323-31.406   C512.248,242.815,512.977,238.254,510.106c-5.435,3.945-13.042,2.727-16.987-2.708   c-3.939-5.435-2.728-13.035,2.714-16.98c5.435-3.946,13.035-2.728,16.981,2.701C483.98,235.56,482.769,243.167,477.334,247.106z"/>
      <path class="st0" d="M144.784,261.63c2.304,0,4.555,0.292,6.739,0.788c-18.384-7.05-21.429-19.946-21.906-24.494   c-1.298-12.248,6.587-23.402,19.622-27.745c5.243-1.748,18.986-9.242,32.28-16.484c14.26-7.779,29.91-16.312,43.521-22.589   c-17.252-1.396-33.419-0.807-42.051,0.629c-9.295,1.549-19.675-2.164-28.553-6.944l-73.06,100.752   c2.191,3.29,4.157,6.892,5.54,10.771c2.046,5.72,6.839,12.26,12.3,18.43c0.854-1.099,1.761-2.172,2.781-3.171l21.879-21.416   C129.498,264.662,136.926,261.63,144.784,261.63z"/>
      <path class="st0" d="M152.695,129.902l-43.323-31.406c-3.257-2.363-7.818-1.642-10.188,1.628L1.391,234.991   c-2.37,3.263-1.635,7.824,1.622,10.195l43.316,31.406c3.264,2.37,7.825,1.642,10.189-1.629l97.793-134.866   C156.68,136.834,155.952,132.272,152.695,129.902z M123.745,144.97c-3   c-5.442-3.94-6.654-11.546-2.708-16.981c3.939-5.435,11.546-6.653,16.981-2.708C126.479,131.928,127.684,139.528,123.745,144.97z"/>
    </g>
  </svg>
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
// Intentionally renders the raw image only — no sold stamp/overlay here,
// so zooming in always shows the photo without the watermark.
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
  const { bookmarkedIds, ratings, setBookmark, setRating } = useUserBookInteractions();

  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/books/${id}`).then(res => { if (!res.ok) throw new Error("not found"); return res.json(); }),
      fetch(`${API_URL}/books/${id}/related`).then(res => res.ok ? res.json() : { related_books: [] })
    ])
    .then(([bookData, relatedData]) => {
      setBook(bookData);
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
    const userRating = ratings[book.id] ?? null;
    const newAction = userRating === actionType ? "remove" : actionType;
    const prevRating = userRating;
    setRating(book.id, newAction === "remove" ? null : newAction);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/books/${book.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: newAction }),
      });
      if (!res.ok) setRating(book.id, prevRating);
    } catch { setRating(book.id, prevRating); }
  }

  async function handleBookmark(e) {
    e.preventDefault();
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(book.id);
    const prevBookmark = isBookmarked;
    setBookmark(book.id, !prevBookmark);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/books/${book.id}/bookmark`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setBookmark(book.id, data.bookmarked); }
      else setBookmark(book.id, prevBookmark);
    } catch { setBookmark(book.id, prevBookmark); }
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

  // Read from the shared context so this stays correct across every
  // BookCard / BookDetail instance and survives a page refresh.
  const userRating = ratings[book.id] ?? null;
  const isBookmarked = bookmarkedIds.has(book.id);
  const isSold = book.status === "sold";

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

              {/* Sold overlay — only on the inline preview. The lightbox (zoom)
                  renders the raw image with no stamp, on purpose. */}
              {isSold && !isViewingVideo && (
                <div className="bd-sold-overlay">
                  <span className="bd-sold-stamp">გაყიდულია</span>
                </div>
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
              <span className={`bd-price${isSold ? " bd-price-sold" : ""}`}>{book.price} ₾</span>
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
                      {Array.isArray(book.seller.selling_method) && book.seller.selling_method.includes("meetup")
                        ? <HandshakeIcon /> : <TruckIcon />}
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
              <div className="bd-unavailable">ეს თქვენი განცხადებაა</div>
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

                {isSold ? (
                  <div className="bd-unavailable">წიგნი გაყიდულია</div>
                ) : (
                  <button onClick={handleAdd} disabled={added} className={`bd-add-cart-btn${added ? " added" : ""}`}>
                    {added ? <><CheckIcon /> კალათაში დამატდა</> : <><CartIcon /> კალათაში დამატება</>}
                  </button>
                )}
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