import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addToCart(book) {
    setItems((prev) => {
      // მეორადი წიგნი უნიკალურია — ერთი ეგზემპლარი
      if (prev.find((i) => i.id === book.id)) return prev;
      return [...prev, { ...book, qty: 1 }];
    });
  }

  function removeFromCart(bookId) {
    setItems((prev) => prev.filter((i) => i.id !== bookId));
  }

  // qty ყოველთვის 1-ია (მეორადი წიგნი), ვიზუალი უცვლელია
  function updateQty(bookId, newQty) {
    if (newQty < 1) removeFromCart(bookId);
    // newQty > 1 → no-op: ერთი ეგზემპლარი
  }

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
