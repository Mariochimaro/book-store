import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import NotificationsTab from "../components/NotificationPanel";
import OrdersTab from "../components/OrdersTab";
import WishlistTab from "../components/WishlistTab";
import FinancesTab from "../components/FinancesTab";
import MyListingsTab from "../components/MyListingsTab";
import { useAuth } from "../context/AuthContext";
import { BellIcon, ReceiptIcon, BookmarkIcon, GearIcon, StoreIcon, ChartIcon } from "../components/icons";

// ── Preferences tab ──────────────────────────────────────────
function PreferencesTab() {
  return (
    <>
      <div className="pf-card">
        <p className="pf-card-title"><GearIcon size={15} /> ჟანრის პრეფერენციები</p>
        <p className="pf-card-body">ჯერ არ გაქვს არჩეული ჟანრი.</p>
        <button className="btn-bronze"><GearIcon size={13} /> პრეფერენციების დაყენება</button>
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

// ── Main Profile ─────────────────────────────────────────────
// 1. აქ მივიღეთ App.jsx-დან წამოსული onOpenAddBook ფუნქცია
function Profile({ onOpenAddBook }) {
  const [activeTab, setActiveTab] = useState("notifications");
  const { user, isLoggedIn } = useAuth();
  const [profileData, setProfileData] = useState(user);
  const navigate = useNavigate();

  useEffect(() => { setProfileData(user); }, [user]);

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

  const avatarLetter = (user.username ?? "?")[0].toUpperCase();

  const isOnboarded = Boolean(
    profileData?.location &&
    profileData?.phone_numbers?.length &&
    profileData?.bank_accounts?.length &&
    profileData?.birth_year &&
    profileData?.selling_method?.length
  );

  const TABS = [
    { id: "notifications", label: "შეტყობინებები", icon: <BellIcon size={14} /> },
    { id: "orders",        label: "შეკვეთები",       icon: <ReceiptIcon size={14} /> },
    { id: "wishlist",      label: "Wishlist",        icon: <BookmarkIcon size={14} /> },
    { id: "preferences",   label: "Preferences",     icon: <GearIcon size={14} /> },
    { id: "listings",      label: "ჩემი წიგნები",    icon: <StoreIcon size={14} /> },
    ...(isOnboarded ? [{ id: "finances", label: "ფინანსები", icon: <ChartIcon size={14} /> }] : []),
  ];

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
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "orders"        && <OrdersTab />}
          {activeTab === "wishlist"      && <WishlistTab />}
          {activeTab === "preferences"   && <PreferencesTab />}
          
          {/* 2. აქ გადავეცით ფუნქცია MyListingsTab კომპონენტს */}
          {activeTab === "listings"      && <MyListingsTab onOpenAddBook={onOpenAddBook} />}
          
          {activeTab === "finances"      && isOnboarded && <FinancesTab />}
        </div>
      </div>
    </>
  );
}

export default Profile;