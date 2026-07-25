import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginModal }    from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { CartSidebar }   from "./Cart";
import { GenreModal }    from "./GenreModal";
import { useCart }       from "../context/CartContext";
import { useAuth }       from "../context/AuthContext";

function Navbar() {
  const [query, setQuery]         = useState("");
  const [modal, setModal]         = useState(null); // "login" | "register" | null
  const [cartOpen, setCart]       = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate                  = useNavigate();
  const { totalItems }            = useCart();
  const { isLoggedIn, user, logout } = useAuth();

  const isAdmin = !!user?.is_admin;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/");
    }
  };

  function handleSearch(e) {
    e.preventDefault();

    const searchParams = new URLSearchParams();
    const cleanQuery = query.trim();

    if (cleanQuery) {
      searchParams.set('q', cleanQuery);

      if (window.location.pathname === '/') {
        const currentParams = new URLSearchParams(window.location.search);
        for (const [key, value] of currentParams.entries()) {
          if (key !== 'q') searchParams.set(key, value);
        }
      }
    }

    navigate(`/?${searchParams.toString()}`);
  }

  return (
    <>
      <nav className="nb" role="navigation" aria-label="Main navigation">
        <div className="nb-inner">
          {/* Left group: logo + page nav links */}
          <div className="nb-left">
            <Link to="/" className="nb-logo">
              <span className="nb-logo-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59f0bdb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'inline-block', verticalAlign: 'middle' }}
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              <span className="nb-logo-text">წიგნების სამყარო</span>
            </Link>

            <div className="nb-page-links" role="navigation" aria-label="Page sections">
              <button
                className="nb-page-link"
                onClick={() => document.getElementById("popular-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                Popular Books
              </button>

              <button
                className="nb-page-link"
                onClick={() => document.getElementById("others-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>
                </svg>
                All Books
              </button>
            </div>
          </div>

          {/* Search — always visible, never collapses into the menu */}
          <form className="nb-search" onSubmit={handleSearch} role="search">
            <span className="nb-search-icon" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'inline-block', verticalAlign: 'middle' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
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
                /* ── Admin nav ── */
                <>
                  <Link to="/admin" className="nb-admin-link nb-collapsible" aria-label="Admin Dashboard">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Admin Dashboard
                  </Link>

                  <button className="nb-icon-btn nb-collapsible" onClick={handleLogout} aria-label="Sign out" title="Sign out">
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
                  <button className="nb-genre-btn nb-collapsible" onClick={() => setGenreOpen(true)} aria-label="Browse genres">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Genres
                  </button>

                  <Link to="/profile" className="nb-avatar-btn" title={user?.username} aria-label={`Profile: ${user?.username}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </Link>

                  <button className="nb-icon-btn nb-collapsible" onClick={handleLogout} aria-label="Sign out" title="Sign out">
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
                <button className="nb-login nb-collapsible" onClick={() => setModal("login")}>Login</button>
                <button className="nb-register nb-collapsible" onClick={() => setModal("register")}>Register</button>
              </>
            )}

            {/* Cart — always visible when logged in; hidden on mobile for guests */}
            <button
              className={`nb-cart${!isLoggedIn ? " nb-guest-hide-mobile" : ""}`}
              onClick={() => setCart(true)}
              aria-label="Shopping cart"
            >
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

            {/* Hamburger — sits at the very right end, only shown once collapsible items are hidden */}
            <div className="nb-hamburger-wrap">
              <button
                className="nb-hamburger-btn"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="nb-mobile-dropdown" role="menu">
                  <button
                    className="nb-mobile-item"
                    onClick={() => { document.getElementById("popular-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                  >
                    Popular Books
                  </button>
                  <button
                    className="nb-mobile-item"
                    onClick={() => { document.getElementById("others-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                  >
                    All Books
                  </button>

                  {isLoggedIn ? (
                    isAdmin ? (
                      <>
                        <Link className="nb-mobile-item" to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          Admin Dashboard
                        </Link>
                        <button className="nb-mobile-item" onClick={handleLogout}>Sign out</button>
                      </>
                    ) : (
                      <>
                        <button className="nb-mobile-item" onClick={() => { setGenreOpen(true); setMobileMenuOpen(false); }}>
                          Genres
                        </button>
                        <button className="nb-mobile-item" onClick={handleLogout}>Sign out</button>
                      </>
                    )
                  ) : (
                    <>
                      <button className="nb-mobile-item" onClick={() => { setModal("login"); setMobileMenuOpen(false); }}>
                        Login
                      </button>
                      <button className="nb-mobile-item" onClick={() => { setModal("register"); setMobileMenuOpen(false); }}>
                        Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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