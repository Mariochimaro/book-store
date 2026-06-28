import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  /** Add a book or increment its quantity if already in cart */
  function addToCart(book) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === book.id);
      if (existing) {
        return prev.map((i) =>
          i.id === book.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...book, qty: 1 }];
    });
  }

  /** Remove a book from the cart entirely */
  function removeFromCart(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  /** Set exact quantity; removes the item if qty drops to 0 */
  function updateQty(id, qty) {
    if (qty < 1) { removeFromCart(id); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  function clearCart() { setItems([]); }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.qty * parseFloat(i.price),
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
