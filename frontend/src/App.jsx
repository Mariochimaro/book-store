import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Home         from "./pages/Home.jsx";
import BookDetail   from "./pages/BookDetail.jsx";
import Profile      from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import AdminPanel   from "./pages/AdminPanel.jsx";
import { CartSidebar } from "./components/Cart.jsx";

// Cart route wrapper — sidebar ყოველთვის open
function CartPage() {
  return <CartSidebar isOpen={true} onClose={() => window.history.back()} />;
}

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider პირველი — Navbar-ს სჭირდება user state */}
      <AuthProvider>
        {/* CartProvider მეორე — Navbar + BookCard-ს სჭირდება */}
        <CartProvider>
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/book/:id"      element={<BookDetail />} />
            <Route path="/cart"          element={<CartPage />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin"         element={<AdminPanel />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;