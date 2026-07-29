import React, { useState } from "react"; // 1. დავამატეთ useState
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Home         from "./pages/Home.jsx";
import BookDetail   from "./pages/BookDetail.jsx";
import Profile      from "./pages/Profile.jsx";
import AdminPanel   from "./pages/AdminDashboard.jsx";
import { CartSidebar } from "./components/Home/Cart.jsx";
import AddBook      from "./components/Profile/AddBook.jsx"; // 2. შემოვიტანეთ AddBook
import { UserBookInteractionsProvider } from "./context/UBIContext";

// Cart route wrapper — sidebar ყოველთვის open
function CartPage() {
  return <CartSidebar isOpen={true} onClose={() => window.history.back()} />;
}

function App() {
  // 3. შევქმნათ State, რომელიც გააკონტროლებს ფანჯრის გახსნა/დახურვას
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <UserBookInteractionsProvider>
          <CartProvider>
            {/* 
              4. იმისათვის, რომ Home ან სხვა გვერდებმა შეძლონ ამ ფანჯრის გახსნა,
                გადავცეთ მათ setIsAddBookOpen ფუნქცია Props-ად.
            */}
            <Routes>
              <Route path="/"              element={<Home onOpenAddBook={() => setIsAddBookOpen(true)} />} />
              <Route path="/book/:id"      element={<BookDetail />} />
              <Route path="/cart"          element={<CartPage />} />
              <Route path="/profile" element={<Profile onOpenAddBook={() => setIsAddBookOpen(true)} />} />
              <Route path="/admin"         element={<AdminPanel />} />
            </Routes>

            {/* 5. თავად კომპონენტი, რომელიც ეკრანზე "უხილავად" ზის და ელოდება open-ის true გახდომას */}
            <AddBook open={isAddBookOpen} onOpenChange={setIsAddBookOpen} />
          </CartProvider>
        </UserBookInteractionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;