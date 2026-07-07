import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

// ── Inline SVG helpers ───────────────────────────────────────
const Icon = ({ d, d2, d3, circle, poly, line, size = 15, ...rest }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {circle && <circle {...circle} />}
    {d  && <path d={d}  />}
    {d2 && <path d={d2} />}
    {d3 && <path d={d3} />}
    {poly && <polyline points={poly} />}
    {line && <line {...line} />}
  </svg>
);

// ── Tab definitions ──────────────────────────────────────────
const TABS = [
  {
    id: "orders",
    label: "Orders & History",
    icon: <Icon size={14}
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      d2="M12 6v6l4 2"
    />,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: <Icon size={14} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: <Icon size={14}
      circle={{ cx: "12", cy: "12", r: "3" }}
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    />,
  },
  {
    id: "sell",
    label: "Sell Books",
    icon: <Icon size={14}
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      poly="9 22 9 12 15 12 15 22"
    />,
  },
];

// ── Stats used in Orders tab ─────────────────────────────────
const STATS = [
  {
    label: "Purchases",
    value: "0",
    sub: "total orders",
    icon: (
      <Icon size={20}
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        d2="M3 6h18"
        d3="M16 10a4 4 0 0 1-8 0"
      />
    ),
  },
  {
    label: "Total Spent",
    value: "$0.00",
    sub: "income",
    accent: true,
    icon: (
      <Icon size={20}
        line={{ x1: "12", y1: "1", x2: "12", y2: "23" }}
        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
      />
    ),
  },
  {
    label: "Books Liked",
    value: "0",
    sub: "favourites",
    icon: (
      <Icon size={20}
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    ),
  },
  {
    label: "Wishlisted",
    value: "0",
    sub: "saved",
    icon: (
      <Icon size={20} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    ),
  },
];

// ── Gear SVG (reused) ────────────────────────────────────────
const GearSvg = ({ size = 13 }) => (
  <Icon size={size}
    circle={{ cx: "12", cy: "12", r: "3" }}
    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  />
);

// ── Tab panels ───────────────────────────────────────────────

function OrdersTab() {
  return (
    <>
      {/* Overview stats */}
      <div className="pf-stat-grid">
        {STATS.map((s) => (
          <div key={s.label} className="pf-stat-card">
            <span className="pf-stat-icon">{s.icon}</span>
            <div>
              <p className="pf-stat-label">{s.label}</p>
              <p className={`pf-stat-val${s.accent ? " accent" : ""}`}>{s.value}</p>
              <p className="pf-stat-sub">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <p className="pf-section-lbl">Transaction History</p>
      <div className="pf-empty">
        {/* 3-D box / package icon */}
        <svg className="pf-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <p className="pf-empty-title">No transactions yet</p>
        <Link to="/" className="btn-bronze">Browse Books</Link>
      </div>
    </>
  );
}

function WishlistTab() {
  return (
    <div className="pf-empty">
      <svg className="pf-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <p className="pf-empty-title">No books wishlisted yet</p>
      <p className="pf-empty-sub">Click the bookmark icon on any book to save it here.</p>
    </div>
  );
}

function PreferencesTab() {
  return (
    <>
      {/* Genre preferences card */}
      <div className="pf-card">
        <p className="pf-card-title">
          <GearSvg size={15} /> Genre Preferences
        </p>
        <p className="pf-card-body">No genres selected yet.</p>
        <button className="btn-bronze">
          <GearSvg size={13} /> Set Genre Preferences
        </button>
      </div>

      {/* Reading activity card */}
      <div className="pf-card">
        <p className="pf-card-title">Reading Activity</p>
        <div className="pf-activity-grid">
          {[
            { icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", label: "Liked books" },
            { icon: "M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z", label: "Disliked" },
            { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", label: "Rated" },
            { icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0", label: "Purchased" },
          ].map(({ icon, label }) => (
            <div key={label} className="pf-activity-row">
              <span className="pf-activity-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={icon} />
                </svg>
                {label}
              </span>
              <span className="pf-activity-val">0</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Seller setup modal ───────────────────────────────────────
function SellerModal({ onClose }) {
  const [bankName,    setBankName]    = useState("");
  const [holderName,  setHolderName]  = useState("");
  const [iban,        setIban]        = useState("");
  const [bio,         setBio]         = useState("");

  // Escape key + body scroll lock
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

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire to seller activation API
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="seller-modal-heading">
        {/* Close × */}
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        {/* Title row: icon + heading */}
        <div className="seller-modal-title-row">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h2 className="modal-title" id="seller-modal-heading">Become a Seller</h2>
        </div>

        <p className="modal-sub">
          Add your payment details to start listing books for sale.
          Other readers can purchase them from your profile.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Bank Name */}
          <label className="modal-lbl" htmlFor="sl-bank">Bank Name</label>
          <input
            id="sl-bank"
            type="text"
            className="modal-inp"
            placeholder="e.g. TBC Bank, Bank of Georgia"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            autoFocus
          />

          {/* Account Holder */}
          <label className="modal-lbl" htmlFor="sl-holder">Account Holder Name</label>
          <input
            id="sl-holder"
            type="text"
            className="modal-inp"
            placeholder="Full name on account"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
          />

          {/* IBAN */}
          <label className="modal-lbl" htmlFor="sl-iban">Account / IBAN Number</label>
          <input
            id="sl-iban"
            type="text"
            className="modal-inp"
            placeholder="GE00 TB00 0000 0000 0000 00"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
          />

          {/* Seller Bio */}
          <label className="modal-lbl" htmlFor="sl-bio">
            Seller Bio <span className="modal-opt">(optional)</span>
          </label>
          <textarea
            id="sl-bio"
            className="modal-inp modal-textarea"
            placeholder="Tell buyers a little about you and the books you sell..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />

          {/* Action buttons */}
          <div className="modal-btn-row">
            <button type="button" className="modal-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-grow">
              Activate Seller Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sell Books tab ────────────────────────────────────────────
function SellBooksTab() {
  const [sellerModalOpen, setSellerModalOpen] = useState(false);

  return (
    <>
      <div className="pf-sell-promo">
        {/* Store icon */}
        <svg className="pf-sell-icon" width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <h3 className="pf-sell-title">Become a Seller</h3>
        <p className="pf-sell-desc">
          List your own books for other readers to purchase. You'll receive a
          notification when someone wants to buy — accept to confirm.
        </p>
        <button className="btn-bronze" onClick={() => setSellerModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Set Up Seller Account
        </button>
      </div>

      {/* Modal — rendered when open */}
      {sellerModalOpen && (
        <SellerModal onClose={() => setSellerModalOpen(false)} />
      )}
    </>
  );
}

// ── Main Profile component ───────────────────────────────────
function Profile() {
  const [activeTab, setActiveTab] = useState("orders");
  const { user }                  = useAuth();

  const displayName  = user?.name  || "User";
  const displayEmail = user?.email || "";
  const avatarLetter = displayName[0].toUpperCase();

  return (
    <>
      <Navbar />

      <div className="pf-page">
        {/* ── Header ── */}
        <div className="pf-header">
          <div className="pf-avatar" aria-label={`Avatar for ${displayName}`}>
            {avatarLetter}
          </div>
          <div>
            <h2 className="pf-name">{displayName}</h2>
            <p className="pf-email">{displayEmail}</p>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <nav className="pf-tabs" aria-label="Profile sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`pf-tab${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-current={activeTab === t.id ? "page" : undefined}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Tab panels ── */}
        <div className="pf-content">
          {activeTab === "orders"      && <OrdersTab />}
          {activeTab === "wishlist"    && <WishlistTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "sell"        && <SellBooksTab />}
        </div>
      </div>
    </>
  );
}

export default Profile;
