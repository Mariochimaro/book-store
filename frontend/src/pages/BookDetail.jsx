import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// --- ხატულები (SVGs) ---
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// გაყიდვის მეთოდების თარგმანი
const SELLING_METHOD_LABELS = {
  meetup: "შეხვედრა",
  delivery: "მიწოდება/კურიერი",
};

const getSellingMethodsText = (method) => {
  if (!method) return "";
  if (Array.isArray(method)) {
    return method.map(m => SELLING_METHOD_LABELS[m] || m).join(", ");
  }
  return SELLING_METHOD_LABELS[method] || method;
};

const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const MapPinIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const TruckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const HandshakeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12l-1.5-1.5a4 4 0 1 0-5.65 5.65l6 6M16 12l1.5-1.5a4 4 0 1 1 5.65 5.65l-6 6" /><path d="M15 15l-6-6" /></svg>;

const CONDITION_INFO = {
  new:     { label: "ახალი",       bg: "#e6f4ea", color: "#1e8e3e" },
  good:    { label: "კარგი",       bg: "#e8f0fe", color: "#1a73e8" },
  average: { label: "საშუალო",     bg: "#fef7e0", color: "#f9ab00" },
  damaged: { label: "დაზიანებული", bg: "#fce8e6", color: "#d93025" },
};

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

  useEffect(() => {
    setLoading(true);
    
    // პარალელურად წამოვიღოთ წიგნი და მსგავსი წიგნები
    Promise.all([
      fetch(`${API_URL}/books/${id}`).then(res => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      }),
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

  if (loading) {
    return (
      <>
        <Navbar />
        <h2 style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>იტვირთება...</h2>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "60px", textAlign: "center" }}>
          <h2 style={{ marginBottom: "16px" }}>წიგნი ვერ მოიძებნა</h2>
          <button onClick={() => navigate(-1)} style={styles.btnBack}>← უკან დაბრუნება</button>
        </div>
      </>
    );
  }

  const photos = book.photos_urls ?? [];
  const hasVideo = !!book.book_video_url;
  const isOwnBook = isLoggedIn && user?.id != null && book.seller?.id != null && user.id === book.seller.id;
  const conditionObj = CONDITION_INFO[book.condition] || { label: book.condition, bg: "#f3f4f6", color: "#4b5563" };

  return (
    <>
      <Navbar />
      <main style={{ padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", paddingBottom: "80px" }}>
        
        <button onClick={() => navigate(-1)} style={styles.btnBack}>← უკან</button>

        {/* ─── მთავარი ბლოკი (გალერეა + ინფორმაცია) ─── */}
        <div style={styles.layoutWrapper}>
          
          {/* 1. MEDIA GALLERY AREA */}
          <div style={styles.galleryCol}>
            <div style={styles.mainImageContainer}>
              {hasVideo && activePhoto === photos.length ? (
                <video
                  src={book.book_video_url}
                  controls playsInline controlsList="nodownload"
                  style={styles.mainMedia}
                />
              ) : (
                <img
                  src={photos[activePhoto] ?? "/placeholder.jpg"}
                  alt={book.title}
                  style={styles.mainMedia}
                />
              )}
            </div>

            {/* Thumbnails */}
            {(photos.length > 1 || hasVideo) && (
              <div style={styles.thumbnailsContainer}>
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    onClick={() => setActivePhoto(i)}
                    style={{
                      ...styles.thumbnailImg,
                      borderColor: i === activePhoto ? "var(--accent, #b87743)" : "transparent",
                      opacity: i === activePhoto ? 1 : 0.6,
                    }}
                  />
                ))}
                
                {hasVideo && (
                  <div
                    onClick={() => setActivePhoto(photos.length)}
                    style={{
                      ...styles.thumbnailImg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backgroundColor: "#1a202c", color: "#fff",
                      borderColor: activePhoto === photos.length ? "var(--accent, #b87743)" : "transparent",
                      opacity: activePhoto === photos.length ? 1 : 0.6,
                    }}
                  >
                    ▶
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. DETAILS AREA */}
          <div style={styles.detailsCol}>
            <h1 style={{ fontSize: "2rem", margin: "0 0 8px 0", lineHeight: "1.2" }}>{book.title}</h1>
            {book.author && <p style={{ color: "var(--text-muted, #666)", fontSize: "1.1rem", marginBottom: "24px" }}>{book.author}</p>}

            {/* Price & Condition Flex */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
              <span style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--accent, #b87743)" }}>
                {book.price} ₾
              </span>
              <div style={{ width: "1px", height: "30px", backgroundColor: "#e0e0e0" }} />
              <div style={{
                backgroundColor: conditionObj.bg, 
                color: conditionObj.color,
                padding: "6px 12px", 
                borderRadius: "6px",
                fontWeight: "bold", 
                fontSize: "0.85rem",
                textTransform: "uppercase"
              }}>
                {conditionObj.label}
              </div>
            </div>

            {/* Genres & Language Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
              {book.language && (
                <span style={styles.tagOutline}>{book.language}</span>
              )}
              {book.genres?.map(g => (
                <span key={g} style={styles.tag}>{g}</span>
              ))}
            </div>

            {/* Description */}
            {book.description && (
              <div style={{ marginBottom: "32px" }}>
                <h4 style={styles.sectionTitle}>აღწერა</h4>
                <p style={{ lineHeight: "1.6", color: "#d1d5db", whiteSpace: "pre-line" }}>{book.description}</p>
              </div>
            )}

            {/* Seller & Selling Method Box */}
            {book.seller && (
              <div style={styles.sellerBox}>
                <h4 style={{...styles.sectionTitle, marginBottom: "16px"}}>გამყიდველის ინფორმაცია</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={styles.sellerInfoRow}>
                    <div style={styles.iconCircle}><UserIcon /></div>
                    <div>
                      <span style={styles.infoLabel}>მომხმარებელი</span>
                      <strong style={{ display: "block" }}>{book.seller.username}</strong>
                    </div>
                  </div>

                  {book.seller.location && (
                    <div style={styles.sellerInfoRow}>
                      <div style={styles.iconCircle}><MapPinIcon /></div>
                      <div>
                        <span style={styles.infoLabel}>ლოკაცია</span>
                        <strong style={{ display: "block" }}>{book.seller.location}</strong>
                      </div>
                    </div>
                  )}
                  
                  {book.seller.selling_method && (
                    <div style={{ ...styles.sellerInfoRow, gridColumn: "1 / -1", marginTop: "12px", paddingTop: "16px", borderTop: "1px solid #eaeaea" }}>
                      <div style={{...styles.iconCircle, color: "#10b981", backgroundColor: "#ecfdf5"}}>
                        {Array.isArray(book.seller.selling_method) && book.seller.selling_method.includes("meetup") ? (
                          <HandshakeIcon />
                        ) : (
                          <TruckIcon />
                        )}
                      </div>
                      <div>
                        <span style={styles.infoLabel}>გაყიდვის მეთოდი</span>
                        <strong style={{ display: "block", color: "#10b981" }}>
                          {getSellingMethodsText(book.seller.selling_method)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isOwnBook ? (
              <div style={styles.ownBookAlert}>ეს თქვენი განცხადებაა</div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={added}
                style={{
                  ...styles.btnAddToCart,
                  backgroundColor: added ? "#10b981" : "var(--accent, #b87743)",
                }}
              >
                {added ? (
                  <><CheckIcon /> კალათაში დამატდა</>
                ) : (
                  <><CartIcon /> კალათაში დამატება</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─── RELATED BOOKS ─── */}
        {relatedBooks.length > 0 && (
          <div style={styles.relatedSection}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>მსგავსი წიგნები</h2>
            <div style={styles.relatedGrid}>
              {relatedBooks.map(related => (
                <div 
                  key={related.id} 
                  onClick={() => navigate(`/book/${related.id}`)}
                  style={styles.relatedCard}
                >
                  <div style={styles.relatedImgContainer}>
                    <img 
                      src={related.coverImage || related.photos_urls?.[0] || "/placeholder.jpg"} 
                      alt={related.title} 
                      style={styles.relatedImg} 
                    />
                  </div>
                  <h4 style={styles.relatedTitle}>{related.title}</h4>
                  {related.author && <p style={styles.relatedAuthor}>{related.author}</p>}
                  <p style={styles.relatedPrice}>{related.price} ₾</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ─── STYLES OBJECT ───
const styles = {
  btnBack: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--accent, #b87743)", fontSize: "1rem", fontWeight: "500",
    marginBottom: "24px", display: "inline-block"
  },
  layoutWrapper: {
    display: "flex", gap: "48px", flexWrap: "wrap", alignItems: "flex-start"
  },
  galleryCol: {
    flex: "1", minWidth: "320px", maxWidth: "450px"
  },
  mainImageContainer: {
    width: "100%", aspectRatio: "3/4", backgroundColor: "#f3f4f6", 
    borderRadius: "16px", overflow: "hidden", position: "relative"
  },
  mainMedia: {
    width: "100%", height: "100%", objectFit: "cover"
  },
  thumbnailsContainer: {
    border: "1px solid #b87843b7", display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center",
    backgroundColor: "#111827", padding: "12px", borderRadius: "12px"
  },
  thumbnailImg: {
    width: "60px", height: "80px", objectFit: "cover", borderRadius: "8px", 
    cursor: "pointer", border: "2px solid transparent", transition: "0.2s"
  },
  detailsCol: {
    flex: "1.5", minWidth: "300px", display: "flex", flexDirection: "column"
  },
  tag: {
    backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", color: "#374151"
  },
  tagOutline: {
    border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", color: "#d1d5db"
  },
  sectionTitle: {
    fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "8px"
  },
  sellerBox: {
    border: "1px solid #b87843b7", borderRadius: "16px", padding: "24px", 
    backgroundColor: "#111827", marginBottom: "24px", marginTop: "auto"
  },
  sellerInfoRow: {
    display: "flex", alignItems: "center", gap: "12px"
  },
  iconCircle: {
    width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(184, 119, 67, 0.1)", 
    color: "var(--accent, #b87743)", display: "flex", alignItems: "center", justifyContent: "center"
  },
  infoLabel: {
    fontSize: "0.75rem", color: "#6b7280", display: "block", marginBottom: "2px"
  },
  ownBookAlert: {
    padding: "16px", borderRadius: "12px", backgroundColor: "rgba(184, 119, 67, 0.1)", 
    border: "1px solid rgba(184, 119, 67, 0.3)", color: "var(--accent, #b87743)", 
    textAlign: "center", fontWeight: "600"
  },
  btnAddToCart: {
    width: "100%", padding: "16px", borderRadius: "12px", color: "#fff",
    border: "none", cursor: "pointer", fontSize: "1.1rem", fontWeight: "600",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s"
  },
  relatedSection: {
    marginTop: "60px", paddingTop: "40px", borderTop: "1px solid #e5e7eb"
  },
  relatedGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "24px"
  },
  relatedCard: {
    cursor: "pointer", display: "flex", flexDirection: "column"
  },
  relatedImgContainer: {
    width: "100%", aspectRatio: "3/4", borderRadius: "12px", overflow: "hidden", marginBottom: "12px", backgroundColor: "#f3f4f6"
  },
  relatedImg: {
    width: "100%", height: "100%", objectFit: "cover"
  },
  relatedTitle: {
    fontSize: "1rem", margin: "0 0 4px 0", lineHeight: "1.3"
  },
  relatedAuthor: {
    fontSize: "0.85rem", color: "#6b7280", margin: "0 0 8px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
  },
  relatedPrice: {
    fontSize: "1.1rem", fontWeight: "bold", color: "var(--accent, #b87743)", margin: "0"
  }
};

export default BookDetail;