import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authFetch, formatMoney } from "./apiHelpers";
import { BookmarkIcon } from "./icons";

export default function WishlistTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    authFetch("/user/bookmarks")
      .then((data) => setBooks(data.bookmarks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = (bookId) => {
    setRemovingId(bookId);
    // POST toggles bookmark state — the book is already bookmarked here, so
    // this call removes it.
    authFetch(`/books/${bookId}/bookmark`, { method: "POST" })
      .then(() => setBooks((prev) => prev.filter((b) => b.id !== bookId)))
      .finally(() => setRemovingId(null));
  };

  if (loading) return <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>;

  if (books.length === 0) {
    return (
      <div className="pf-empty">
        <BookmarkIcon size={48} className="pf-empty-icon" strokeWidth="1.3" />
        <p className="pf-empty-title">Wishlist ცარიელია</p>
        <p className="pf-empty-sub">წიგნის გვერდზე bookmark ღილაკზე დააწკაპუნე.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {books.map((book) => (
        <div key={book.id} style={{ display: "flex", gap: "14px", alignItems: "center",
          background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
          <img src={book.photos_urls?.[0] ?? "/placeholder.jpg"} alt={book.title}
            style={{ width: "50px", height: "68px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{formatMoney(book.price)} · {book.language}</p>
          </div>
          <Link to={`/book/${book.id}`} style={{ fontSize: "0.8rem", color: "var(--accent)", whiteSpace: "nowrap" }}>
            ნახვა
          </Link>
          <button onClick={() => remove(book.id)} disabled={removingId === book.id}
            style={{ background: "none", border: "none", color: "#fc8181", cursor: "pointer", fontSize: "0.8rem" }}
            title="წაშლა Wishlist-იდან">
            {removingId === book.id ? "..." : "✕"}
          </button>
        </div>
      ))}
    </div>
  );
}