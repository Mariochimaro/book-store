import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginModal }    from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { CartSidebar }   from "./Cart";
import { useCart }       from "../context/CartContext";

function Navbar() {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // "login" | "register" | null
  const [cartOpen, setCart] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <nav className="nb" role="navigation" aria-label="Main navigation">
        <div className="nb-inner">
          {/* Logo */}
          <Link to="/" className="nb-logo">
            <span className="nb-logo-icon">📚</span>
            წიგნების სამყარო
          </Link>

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
            <button className="nb-login"    onClick={() => setModal("login")}>Login</button>
            <button className="nb-register" onClick={() => setModal("register")}>Register</button>
            <button className="nb-cart" onClick={() => setCart(true)} aria-label="Shopping cart">
              🛒
              {totalItems > 0 && (
                <span className="nb-cart-badge" aria-label={`${totalItems} items`}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

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

      <CartSidebar isOpen={cartOpen} onClose={() => setCart(false)} />
    </>
  );
}

export default Navbar;