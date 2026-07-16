import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginModal, RegisterModal } from "./AuthModals";
import { CartSidebar } from "./Cart";
import { GenreModal } from "./GenreModal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [query, setQuery]         = useState("");
  const [modal, setModal]         = useState(null); // "login" | "register" | null
  const [cartOpen, setCart]       = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const navigate                  = useNavigate();
  const { totalItems }            = useCart();
  const { isLoggedIn, user, logout } = useAuth();

  // Derived flag — true only for the admin@darklibrary.com account
  const isAdmin = user?.role === "admin";

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <nav className="nb" role="navigation" aria-label="Main navigation">
        <div className="nb-inner">
          {/* Left group: logo + page nav links */}
          <div className="nb-left">
            <Link to="/" className="nb-logo">
              <span className="nb-logo-icon">📚</span>
              წიგნების სამყარო
            </Link>

            <div className="nb-page-links" role="navigation" aria-label="Page sections">
              <button
                className="nb-page-link"
                onClick={() => document.getElementById("popular-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                {/* Trend / zigzag arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                Popular Books
              </button>

              <button
                className="nb-page-link"
                onClick={() => document.getElementById("new-arrivals-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                {/* Sparkle / 4-point star */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>
                </svg>
                New Arrivals
              </button>
            </div>
          </div>{/* /nb-left */}

          {/* Search */}
          <form className="nb-search" onSubmit={handleSearch} role="search">
            <span className="nb-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="nb-search-input"
              placeholder="Search books, authors, genres..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search books"
            />
          </form>

          {/* Actions */}
          <div className="nb-actions">
            {isLoggedIn ? (
              isAdmin ? (
                /* ── Admin nav: dashboard link + logout only ── */
                <>
                  <Link to="/admin" className="nb-admin-link" aria-label="Admin Dashboard">
                    {/* Shield / admin icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Admin Dashboard
                  </Link>

                  {/* Logout */}
                  <button className="nb-icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </>
              ) : (
                /* ── Regular user nav ── */
                <>
                  {/* Notifications */}
                  <Link to="/notifications" className="nb-icon-btn" aria-label="Notifications">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </Link>

                  {/* Genres */}
                  <button className="nb-genre-btn" onClick={() => setGenreOpen(true)} aria-label="Browse genres">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Genres
                  </button>

                  {/* Profile avatar */}
                  <Link to="/profile" className="nb-avatar-btn" title={user?.name} aria-label={`Profile: ${user?.name}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </Link>

                  {/* Logout */}
                  <button className="nb-icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </>
              )
            ) : (
              /* ── Guest nav ── */
              <>
                <button className="nb-login"    onClick={() => setModal("login")}>Login</button>
                <button className="nb-register" onClick={() => setModal("register")}>Register</button>
              </>
            )}

            {/* Cart — always visible */}
            <button className="nb-cart" onClick={() => setCart(true)} aria-label="Shopping cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && (
                <span className="nb-cart-badge" aria-label={`${totalItems} items`}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Genre preferences modal */}
      {genreOpen && <GenreModal onClose={() => setGenreOpen(false)} />}

      {/* Auth modals */}
      {modal === "login" && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToRegister={() => setModal("register")}
        />
      )}
      {modal === "register" && (
        <RegisterModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal("login")}
        />
      )}

      {/* Shopping cart sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCart(false)} />
    </>
  );
}

export default Navbar;
