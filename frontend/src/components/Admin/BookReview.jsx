import { useState, useEffect } from "react";
import authHeaders from "../../pages/AdminDashboard";
import "./Styles/book-detail.css";

const API_URL = import.meta.env.VITE_API_URL;

const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// ADMIN BOOK REVIEW — Edit/Reject/Approve
// ─────────────────────────────────────────────────────────────
function AdminBookDetailModal({ book, onClose, onApprove, onReject }) {
  const [editTitle, setEditTitle] = useState(book.title || "");
  const [editCondition, setEditCondition] = useState(book.condition || "good");
  const [editGenres, setEditGenres] = useState((book.genres || []).join(", "));

  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const photos = book.photos_urls?.length ? book.photos_urls : (book.cover ? [book.cover] : []);
  const hasVideo = Boolean(book.video_url || book.book_video_url);
  const videoUrl = book.video_url || book.book_video_url;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="bdm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bdm-heading"
        style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}
      >
        <button className="modal-x bdm-close" onClick={onClose} aria-label="Close details">
          <XIcon size={16} />
        </button>

        {/* 1. MEDIA GALLERY AREA */}
        <div style={{ width: "180px", margin: "0 auto" }}>
          <div style={{
            width: "100%", aspectRatio: "3/4", backgroundColor: "#f3f4f6",
            borderRadius: "14px", overflow: "hidden", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {hasVideo && activePhoto === photos.length ? (
              <video
                src={videoUrl}
                controls playsInline controlsList="nodownload"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <img
                src={photos[activePhoto] ?? "/placeholder.jpg"}
                alt={editTitle}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          {/* Thumbnails */}
          {(photos.length > 1 || hasVideo) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", overflowX: "auto", paddingBottom: "4px", justifyContent: "center" }}>
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  onClick={() => setActivePhoto(i)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border: `2px solid ${i === activePhoto ? "var(--accent, #b87743)" : "transparent"}`,
                    opacity: i === activePhoto ? 1 : 0.6,
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              ))}

              {hasVideo && (
                <div
                  onClick={() => setActivePhoto(photos.length)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "#1a202c", color: "#fff",
                    cursor: "pointer",
                    border: `2px solid ${activePhoto === photos.length ? "var(--accent, #b87743)" : "transparent"}`,
                    opacity: activePhoto === photos.length ? 1 : 0.6,
                    transition: "all 0.2s ease",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  ▶
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. DETAILS AREA */}
        <div className="bdm-details" style={{ flex: "1", minWidth: 0, padding: 0 }}>
          <div>
            <label className="text-xs" style={{ color: "var(--text-3, #718096)" }}>Title (Editable)</label>
            <div className="lg-search-row mt-1">
              <input
                type="text"
                className="lg-search-input w-full"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="წიგნის სათაური"
              />
            </div>
            <p className="bdm-author mt-2">{book.author || "—"}</p>
          </div>

          <div className="mt-3">
             <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>Condition</label>
             <div className="lg-search-row">
               <select
                 className="lg-search-input w-full bg-transparent"
                 value={editCondition}
                 onChange={(e) => setEditCondition(e.target.value)}
               >
                 <option value="new" style={{ color: "#000" }}>ახალი</option>
                 <option value="good" style={{ color: "#000" }}>კარგი</option>
                 <option value="average" style={{ color: "#000" }}>საშუალო</option>
                 <option value="damaged" style={{ color: "#000" }}>დაზიანებული</option>
               </select>
             </div>
          </div>

          <div className="bdm-stars-price mt-3">
            <p className="bdm-price">${book.price}</p>
          </div>

          <div className="bdm-meta">
            <div>
              <p className="bdm-meta-lbl">გამოშვების წელი</p>
              <p className="bdm-meta-val">
                {book.created_at ? new Date(book.created_at).getFullYear() : "—"}
              </p>
            </div>
          </div>

          <div className="mt-3">
             <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>Genres (comma separated)</label>
             <div className="lg-search-row">
               <input
                 type="text"
                 className="lg-search-input w-full"
                 value={editGenres}
                 onChange={(e) => setEditGenres(e.target.value)}
                 placeholder="მაგ: Fiction, Mystery, Thriller"
               />
             </div>
          </div>

          <div className="mt-3">
            <p className="bdm-desc-heading">Description</p>
            <p className="bdm-desc-text">{book.description ?? "No description available yet."}</p>
          </div>

          {/* Approve / Reject Actions */}
          <div className="bdm-actions mt-4 flex gap-2">
            <button
              className="bdm-add-cart"
              aria-label="შენახვა და დასტური"
              style={{ backgroundColor: "#10b981", color: "#fff", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              onClick={() => onApprove(book.id, {
                title: editTitle,
                condition: editCondition,
                genres: editGenres.split(",").map(g => g.trim()).filter(Boolean)
              })}
            >
              <CheckIcon size={14} />
              <span className="bdm-btn-text">შენახვა და დასტური</span>
            </button>
            <button
              className="bdm-wishlist-action"
              aria-label="უარყოფა"
              style={{ backgroundColor: "#ef4444", color: "#fff", flex: 1, borderRadius: "8px", padding: "10px", fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              onClick={() => onReject(book)}
            >
              <XIcon size={14} />
              <span className="bdm-btn-text">უარყოფა</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBookDetailModal;