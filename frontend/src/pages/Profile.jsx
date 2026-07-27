import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import NotificationsTab from "../components/Profile/NotificationPanel";
import OrdersTab from "../components/Profile/OrdersTab";
import WishlistTab from "../components/Profile/WishlistTab";
import FinancesTab from "../components/Profile/FinancesTab";
import MyListingsTab from "../components/Profile/MyListingsTab";
import { useAuth } from "../context/AuthContext";
import { BellIcon, ReceiptIcon, BookmarkIcon, GearIcon, StoreIcon, ChartIcon } from "../components/icons";
import EditProfileModal from "../components/Profile/EditProfileModal"; // 1. შემოვიტანეთ რედაქტირების მოდალი
import { authFetch } from "../context/Apihelpers"; // 2. API შეკითხვისთვის
import "../styles/profile.css"

function Profile({ onOpenAddBook }) {
  const [activeTab, setActiveTab] = useState("notifications");
  const { user, isLoggedIn, setUser } = useAuth();
  
  // თავიდან profileData იყოს უბრალოდ `user` (id და email მაინც რომ გვქონდეს),
  // მაგრამ მოგვიანებით ის შეივსება ბაზიდან წამოღებული სრული მონაცემებით.
  const [profileData, setProfileData] = useState(user);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasActiveBooks, setHasActiveBooks] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { 
    if (!user) return; // თუ არ არის დალოგინებული, არაფერს ვაკეთებთ

    // 1. ჯერ ვიღებთ მომხმარებლის სრულ პროფილს ბაზიდან
    authFetch("/user/profile")
      .then(data => {
        if (data && data.user) {
          setProfileData({ ...user, ...data.user }); 
        } else if (data) {
          setProfileData({ ...user, ...data }); 
        }
      })
      .catch(err => console.log("Failed to fetch full profile data", err));

    // 2. ვამოწმებთ, აქვს თუ არა იუზერს აქტიური წიგნები
    authFetch("/books/my-books") 
      .then(data => {
         if (data && data.books && data.books.length > 0) {
           setHasActiveBooks(true);
         } else {
           setHasActiveBooks(false);
         }
      })
      .catch(err => console.log("Failed to fetch user books", err));
  }, [user]);

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

  // თუ ფოტო არ აქვს, პირველ ასოს ვაჩვენებთ
  const avatarLetter = (profileData?.username ?? "?")[0].toUpperCase();

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
    { id: "listings",      label: "ჩემი წიგნები",    icon: <StoreIcon size={14} /> },
    ...(isOnboarded ? [{ id: "finances", label: "ფინანსები", icon: <ChartIcon size={14} /> }] : []),
  ];

  // მოდალში შენახვის მერე იძახება
  const handleProfileUpdate = (updatedUser) => {
    setProfileData(updatedUser);
    if (setUser) setUser(updatedUser); // გლობალური Auth სტეიტის განახლება
  };

  return (
    <>
      <Navbar />

      <div className="pf-page">
        {/* ── Header ── */}
        <div className="pf-header">
          <div
            className="pf-avatar"
            aria-label={`Avatar for ${profileData?.username}`}
            style={profileData?.profile_picture ? {
              backgroundImage: `url(${profileData.profile_picture})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "transparent"
            } : {}}
          >
            {!profileData?.profile_picture && avatarLetter}
          </div>

          <div className="pf-header-info">
            <div className="pf-name-row">
              <h2 className="pf-name">{profileData?.username}</h2>

              <button className="pf-edit-btn" onClick={() => setIsEditModalOpen(true)}>
                <GearIcon size={12} /> რედაქტირება
              </button>
            </div>

            <p className="pf-email">{profileData?.email}</p>
            {profileData?.location && (
              <p className="pf-location">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pf-location-icon">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742c1.008-.704 2.213-1.67 3.23-2.915C18.665 16.411 20 14.15 20 11.528c0-4.486-3.515-8.028-8-8.028s-8 3.542-8 8.028c0 2.622 1.335 4.883 2.378 6.556 1.017 1.244 2.222 2.21 3.23 2.916a16.975 16.975 0 0 0 1.143.742ZM12 13.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
                {profileData.location}
              </p>
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
          {activeTab === "listings"      && <MyListingsTab onOpenAddBook={onOpenAddBook} />}
          {activeTab === "finances"      && isOnboarded && <FinancesTab />}
        </div>
      </div>

      {/* 4. მოდალის გამოძახება */}
      <EditProfileModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onComplete={handleProfileUpdate}
        user={profileData}
        hasActiveBooks={hasActiveBooks}
      />
    </>
  );
}

export default Profile;