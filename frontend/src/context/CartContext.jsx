import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getCart, addToCartApi, removeFromCartApi, buyBulk } from "./cartApi";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutState, setCheckoutState] = useState({}); // { [sellerId]: "loading" | "error" }

  const refreshCart = useCallback(async () => {
    try {
      const cart = await getCart();
      setItems(cart);
    } catch (e) {
      console.error("კალათის განახლება ვერ მოხერხდა:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  async function addToCart(book) {
    try {
      await addToCartApi(book.id);
      await refreshCart();
    } catch (e) {
      console.error("დამატება ვერ მოხერხდა:", e);
      throw e;
    }
  }

  // მხოლოდ "active" წიგნების წაშლაა შესაძლებელი — pending/sold ტრანზაქციაშია, არ იშლება
  async function removeFromCart(cartItemId) {
    try {
      await removeFromCartApi(cartItemId);
      await refreshCart();
    } catch (e) {
      console.error("წაშლა ვერ მოხერხდა:", e);
      throw e;
    }
  }

  const totalItems = items.length;
  const totalPrice = items
    .filter((i) => i.status === "active")
    .reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

  // 🧺 დაჯგუფება გამყიდველის მიხედვით
  const cartBySeller = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const sellerId = item.seller_id ?? "unknown";
      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerId,
          sellerUsername: item.seller_username || `გამყიდველი #${sellerId}`,
          items: [],
          total: 0,
        };
      }
      groups[sellerId].items.push(item);
      if (item.status === "active") groups[sellerId].total += parseFloat(item.price || 0);
    }
    return Object.values(groups);
  }, [items]);

  async function checkoutSeller(sellerId) {
    const sellerItems = items.filter(
      (i) => (i.seller_id ?? "unknown") === sellerId && i.status === "active"
    );
    const bookIds = sellerItems.map((i) => i.book_id);
    if (bookIds.length === 0) return;

    setCheckoutState((s) => ({ ...s, [sellerId]: "loading" }));

    try {
      const result = await buyBulk(bookIds);
      console.log("✅ [buy-bulk] პასუხი:", result);

      // ‼️ აღარ ვშლით წიგნებს ლოკალურად — ხელახლა ვწამოვიღოთ,
      // pending სტატუსით თავად დარჩება კალათაში
      await refreshCart();
      setCheckoutState((s) => ({ ...s, [sellerId]: undefined }));
      return result;
    } catch (err) {
      console.error("❌ [buy-bulk] შეცდომა:", err);
      setCheckoutState((s) => ({ ...s, [sellerId]: "error" }));
      throw err;
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        totalItems,
        totalPrice,
        cartBySeller,
        checkoutSeller,
        checkoutState,
        refreshCart,
      }}
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