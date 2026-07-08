import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// ── Inline SVG helper ────────────────────────────────────────
const Icon = ({ d, d2, d3, circle, poly, line, size = 15, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}>
    {circle && <circle {...circle} />}
    {d  && <path d={d}  />}
    {d2 && <path d={d2} />}
    {d3 && <path d={d3} />}
    {poly && <polyline points={poly} />}
    {line && <line {...line} />}
  </svg>
);

const GearSvg = ({ size = 13 }) => (
  <Icon size={size}
    circle={{ cx: "12", cy: "12", r: "3" }}
    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  />
);

// ── Tab definitions ──────────────────────────────────────────
const TABS = [
  { id: "books",       label: "ჩემი წიგნები",  icon: <Icon size={14} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" d2="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
  { id: "wishlist",    label: "Wishlist",       icon: <Icon size={14} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> },
  { id: "preferences", label: "Preferences",   icon: <GearSvg size={14} /> },
  { id: "sell",        label: "წიგნის დამატება", icon: <Icon size={14} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" poly="9 22 9 12 15 12 15 22" /> },
];

// ── My Books tab — real API ──────────────────────────────────
function MyBooksTab() {
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/user/my-books`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => { setBooks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_LABEL = {
    active:         { label: "აქტიური",    color: "#68d391" },
    pending:        { label: "მოლოდინში",  color: "#f6e05e" },
    sold:           { label: "გაყიდული",   color: "#a0aec0" },
    seller_deleted: { label: "წაშლილი",    color: "#fc8181" },
  };

  if (loading) return <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>;

  if (books.length === 0) {
    return (
      <div className="pf-empty">
        <svg className="pf-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <p className="pf-empty-title">ჯერ არ გაქვს ატვირთული წიგნი</p>
        <p className="pf-empty-sub">გადადი „წიგნის დამატება" ჩანართზე.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {books.map((book) => {
        const st     = STATUS_LABEL[book.status] ?? { label: book.status, color: "#a0aec0" };
        const cover  = book.photos_urls?.[0] ?? "/placeholder.jpg";
        return (
          <div key={book.id} style={{ display: "flex", gap: "14px", alignItems: "center",
            background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
            <img src={cover} alt={book.title}
              style={{ width: "50px", height: "68px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "4px" }}>{book.price} ₾ · {book.language}</p>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: st.color }}>● {st.label}</span>
            </div>
            <Link to={`/book/${book.id}`} style={{ fontSize: "0.8rem", color: "var(--accent)", whiteSpace: "nowrap" }}>
              ნახვა
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ── Wishlist tab ─────────────────────────────────────────────
function WishlistTab() {
  return (
    <div className="pf-empty">
      <svg className="pf-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <p className="pf-empty-title">Wishlist ცარიელია</p>
      <p className="pf-empty-sub">წიგნის გვერდზე bookmark ღილაკზე დააწკაპუნე.</p>
    </div>
  );
}

// ── Preferences tab ──────────────────────────────────────────
function PreferencesTab() {
  return (
    <>
      <div className="pf-card">
        <p className="pf-card-title"><GearSvg size={15} /> ჟანრის პრეფერენციები</p>
        <p className="pf-card-body">ჯერ არ გაქვს არჩეული ჟანრი.</p>
        <button className="btn-bronze"><GearSvg size={13} /> პრეფერენციების დაყენება</button>
      </div>
      <div className="pf-card">
        <p className="pf-card-title">Reading Activity</p>
        <div className="pf-activity-grid">
          {[
            { label: "მოწონებული წიგნები", val: 0 },
            { label: "შეძენილი", val: 0 },
            { label: "Wishlist-ში", val: 0 },
          ].map(({ label, val }) => (
            <div key={label} className="pf-activity-row">
              <span className="pf-activity-name">{label}</span>
              <span className="pf-activity-val">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Sell tab — AddBook form (TODO: wire to /books/upload) ────
function SellTab() {
  return (
    <div className="pf-sell-promo">
      <svg className="pf-sell-icon" width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <h3 className="pf-sell-title">წიგნის ატვირთვა</h3>
      <p className="pf-sell-desc">
        ატვირთე შენი წიგნი — ადმინი გადახედავს და გააქტიურებს.
      </p>
      {/* TODO: გადამისამართება AddBook ფეიჯზე ან modal-ზე */}
      <Link to="/sell" className="btn-bronze">
        + წიგნის დამატება
      </Link>
    </div>
  );
}

// ── Main Profile ─────────────────────────────────────────────
function Profile() {
  const [activeTab, setActiveTab] = useState("books");
  const { user, isLoggedIn }      = useAuth();

  // სტუმარი — ლოგინ ექრანი
  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ marginBottom: "16px", opacity: 0.7 }}>პროფილის სანახავად შესვლა გჭირდება.</p>
          <Link to="/" className="btn-bronze">← მთავარი გვერდი</Link>
        </div>
      </>
    );
  }

  // user ობიექტი ბექიდან: { id, username, email, is_admin, is_banned, location, phone_numbers }
  const avatarLetter = (user.username ?? "?")[0].toUpperCase();

  return (
    <>
      <Navbar />

      <div className="pf-page">
        {/* ── Header ── */}
        <div className="pf-header">
          <div className="pf-avatar" aria-label={`Avatar for ${user.username}`}>
            {avatarLetter}
          </div>
          <div>
            <h2 className="pf-name">{user.username}</h2>
            <p className="pf-email">{user.email}</p>
            {user.location && (
              <p style={{ fontSize: "0.82rem", opacity: 0.55, marginTop: "2px" }}>📍 {user.location}</p>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <nav className="pf-tabs" aria-label="Profile sections">
          {TABS.map((t) => (
            <button key={t.id} className={`pf-tab${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)} aria-current={activeTab === t.id ? "page" : undefined}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {/* ── Tab panels ── */}
        <div className="pf-content">
          {activeTab === "books"       && <MyBooksTab />}
          {activeTab === "wishlist"    && <WishlistTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "sell"        && <SellTab />}
        </div>
      </div>
    </>
  );
}

export default Profile;
