const API_BASE_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCart() {
  const res = await fetch(`${API_BASE_URL}/cart`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || "კალათის წამოღება ვერ მოხერხდა");
  return data.cart; // [{cart_item_id, book_id, title, price, status, can_purchase, message, seller_id, seller_username, ...}]
}

export async function addToCartApi(bookId) {
  const res = await fetch(`${API_BASE_URL}/cart/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ book_id: bookId }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || "დამატება ვერ მოხერხდა");
  return data;
}

export async function removeFromCartApi(cartItemId) {
  const res = await fetch(`${API_BASE_URL}/cart/remove/${cartItemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || "წაშლა ვერ მოხერხდა");
  return data;
}

export async function buyBulk(bookIds) {
  const res = await fetch(`${API_BASE_URL}/cart/buy-bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ book_ids: bookIds }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || "შეცდომა ყიდვის დროს");
  return data;
}