import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL;

const CONDITION_LABELS = {
  new:     "ახალი",
  good:    "კარგი",
  average: "საშუალო",
  damaged: "დაზიანებული",
};

function BookDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart } = useCart();

  const [book, setBook]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activePhoto, setActive]  = useState(0);
  const [added, setAdded]         = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => { setBook(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <h2 style={{ padding: "40px", textAlign: "center" }}>იტვირთება...</h2>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>წიგნი ვერ მოიძებნა</h2>
          <button onClick={() => navigate(-1)} style={btnBack}>← უკან</button>
        </div>
      </>
    );
  }

  const photos = book.photos_urls ?? [];
  const hasVideo = !!book.book_video_url;

  return (
    <>
      <Navbar />
      <main style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={btnBack}>← უკან</button>

        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginTop: "24px" }}>

          {/* ─── MEDIA GALLERY AREA ─── */}
          <div>
            {hasVideo && activePhoto === photos.length ? (
              <video
                src={book.book_video_url}
                controls
                playsInline
                controlsList="nodownload"
                style={{ 
                  width: "280px", 
                  height: "380px", 
                  backgroundColor: "#000000", // Background color covers empty spaces cleanly
                  objectFit: "contain",       // Changed from cover to keep player buttons fully visible and clickable
                  borderRadius: "8px" 
                }}
              />
            ) : (
              <img
                src={photos[activePhoto] ?? "/placeholder.jpg"}
                alt={book.title}
                style={{ width: "280px", height: "380px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}

            {(photos.length > 1 || hasVideo) && (
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    onClick={() => setActive(i)}
                    style={{
                      width: "60px", height: "80px", objectFit: "cover",
                      borderRadius: "4px", cursor: "pointer",
                      opacity: i === activePhoto ? 1 : 0.5,
                      border: i === activePhoto ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  />
                ))}
                
                {hasVideo && (
                  <div
                    onClick={() => setActive(photos.length)}
                    style={{
                      width: "60px", height: "80px",
                      backgroundColor: "#1a202c", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: "4px", cursor: "pointer",
                      opacity: activePhoto === photos.length ? 1 : 0.5,
                      border: activePhoto === photos.length ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <span style={{ color: "#fff", fontSize: "1.2rem" }}>▶</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── DETAILS AREA ─── */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h1 style={{ marginBottom: "6px" }}>{book.title}</h1>

            {book.author && (
              <p style={{ color: "var(--text-muted)", marginBottom: "4px" }}>{book.author}</p>
            )}

            <p style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--accent)", margin: "12px 0" }}>
              {book.price} ₾
            </p>

            <p><strong>მდგომარეობა:</strong> {CONDITION_LABELS[book.condition] ?? book.condition}</p>
            <p><strong>ენა:</strong> {book.language}</p>

            {book.genres?.length > 0 && (
              <p><strong>ჟანრი:</strong> {book.genres.join(", ")}</p>
            )}

            {book.seller && (
              <p>
                <strong>გამყიდველი:</strong> {book.seller.username}
                {book.seller.location && ` · ${book.seller.location}`}
              </p>
            )}

            {book.description && (
              <p style={{ marginTop: "16px", lineHeight: "1.65" }}>{book.description}</p>
            )}

            <button
              onClick={handleAdd}
              style={{
                marginTop: "24px", padding: "12px 32px",
                background: "var(--accent)", color: "#fff",
                border: "none", borderRadius: "8px",
                cursor: "pointer", fontSize: "1rem", fontWeight: "600",
              }}
            >
              {added ? "✓ კალათაში დამატდა" : "🛒 კალათაში დამატება"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

const btnBack = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--accent)", fontSize: "0.95rem",
};

export default BookDetail;