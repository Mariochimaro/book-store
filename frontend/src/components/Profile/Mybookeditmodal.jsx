import { useState, useEffect } from "react";
import { X as XIcon, Send, Trash2 } from "lucide-react";
import { authFetch } from "../../context/Apihelpers";

/**
 * MyBookEditModal — გამყიდველის საკუთარი წიგნის რედაქტირების modal.
 * იმეორებს AdminBookDetailModal-ის სტილს, მაგრამ:
 *  - რედაქტირებადია სათაური, ფასი, მდგომარეობა, ჟანრები, აღწერა
 *  - Approve/Reject-ის მაგივრად: "გაგზავნა" (PUT /books/{id}/edit) და "წაშლა" (DELETE /books/{id}/delete)
 *
 * Props:
 *  - bookId: number (თუ initialBook არ გადმოეცემა, ამით ჩაიტვირთება /books/{bookId})
 *  - initialBook: object (თუ უკვე გვაქვს სრული წიგნის ობიექტი — არ დასჯერდება refetch-ს)
 *  - onClose: () => void
 *  - onUpdated: (updatedResponse) => void  — გამოძახდება წარმატებული "გაგზავნის" შემდეგ
 *  - onDeleted: (bookId) => void           — გამოძახდება წარმატებული წაშლის შემდეგ
 */
export default function MyBookEditModal({ bookId, initialBook, onClose, onUpdated, onDeleted }) {
  const [book, setBook] = useState(initialBook ?? null);
  const [loading, setLoading] = useState(!initialBook);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState("good");
  const [editGenres, setEditGenres] = useState("");

  const applyBookToForm = (b) => {
    setEditTitle(b.title || "");
    setEditDescription(b.description || "");
    setEditPrice(b.price ?? "");
    setEditCondition(b.condition || "good");
    setEditGenres((b.genres || []).join(", "));
  };

  // წიგნის ჩატვირთვა, თუ initialBook არ მოგვცემია
  useEffect(() => {
    if (initialBook) {
      setBook(initialBook);
      applyBookToForm(initialBook);
      return;
    }
    if (!bookId) return;
    setLoading(true);
    authFetch(`/books/${bookId}`)
      .then((data) => {
        setBook(data);
        applyBookToForm(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookId, initialBook]);

  // Esc-ით დახურვა + body scroll lock (admin modal-ის ანალოგიურად)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSubmit = () => {
    if (!book) return;
    setSaving(true);
    setError(null);
    authFetch(`/books/${book.id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        price: Number(editPrice),
        condition: editCondition,
        genres: editGenres.split(",").map((g) => g.trim()).filter(Boolean),
      }),
    })
      .then((res) => {
        onUpdated?.(res);
        onClose();
      })
      .catch((e) => setError(e.message))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!book) return;
    if (!window.confirm(`ნამდვილად გსურთ "${book.title}"-ის წაშლა?`)) return;
    setDeleting(true);
    setError(null);
    authFetch(`/books/${book.id}/delete`, { method: "DELETE" })
      .then(() => {
        onDeleted?.(book.id);
        onClose();
      })
      .catch((e) => setError(e.message))
      .finally(() => setDeleting(false));
  };

  if (loading) {
    return (
      <div className="modal-backdrop" role="presentation">
        <div className="bdm-card" role="dialog" aria-modal="true">
          <p style={{ padding: "20px", opacity: 0.6 }}>იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const cover = book.photos_urls?.[0];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="bdm-card" role="dialog" aria-modal="true" aria-labelledby="mbem-heading">
        <button className="modal-x bdm-close" onClick={onClose} aria-label="Close details">
          <XIcon size={16} />
        </button>

        <div className="bdm-gallery">
          <div className="bdm-main-img-wrap">
            <img src={cover} alt={editTitle} className="bdm-main-img" />
          </div>
        </div>

        <div className="bdm-details">
          {error && (
            <p style={{ fontSize: "0.8rem", color: "#fc8181", marginBottom: "8px" }}>{error}</p>
          )}

          {book.rejection_reason && (
            <p style={{ fontSize: "0.82rem", color: "#fc8181", marginBottom: "10px" }}>
              უარყოფის მიზეზი: {book.rejection_reason}
            </p>
          )}

          <div>
            <label className="text-xs" style={{ color: "var(--text-3, #718096)" }}>
              სათაური
            </label>
            <div className="lg-search-row mt-1">
              <input
                type="text"
                className="lg-search-input w-full"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="წიგნის სათაური"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>
              ფასი (₾)
            </label>
            <div className="lg-search-row">
              <input
                type="number"
                min="0"
                step="0.01"
                className="lg-search-input w-full"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>
              მდგომარეობა
            </label>
            <div className="lg-search-row">
              <select
                className="lg-search-input w-full bg-transparent"
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value)}
              >
                <option value="new" style={{ color: "#000" }}>ახალი</option>
                <option value="good" style={{ color: "#000" }}>კარგი</option>
                <option value="average" style={{ color: "#000" }}>საშუალო</option>
                <option value="damaged" style={{ color: "#000" }}>დაზიანებული</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>
              ჟანრები (მძიმით გამოყოფილი)
            </label>
            <div className="lg-search-row">
              <input
                type="text"
                className="lg-search-input w-full"
                value={editGenres}
                onChange={(e) => setEditGenres(e.target.value)}
                placeholder="მაგ: Fiction, Mystery, Thriller"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>
              აღწერა
            </label>
            <textarea
              className="lg-search-input w-full"
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="წიგნის აღწერა"
            />
          </div>

          <div className="bdm-actions mt-4 flex gap-2">
            <button
              className="btn-bronze"
              disabled={saving}
              style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              onClick={handleSubmit}
            >
              <Send size={14} /> {saving ? "იგზავნება..." : "გაგზავნა"}
            </button>
            <button
              className="bdm-wishlist-action"
              disabled={deleting}
              style={{
                backgroundColor: "#ef4444", color: "#fff", flex: 1, borderRadius: "8px",
                padding: "10px", fontWeight: 600, display: "flex", justifyContent: "center",
                alignItems: "center", gap: "6px", border: "none", cursor: "pointer",
              }}
              onClick={handleDelete}
            >
              <Trash2 size={14} /> {deleting ? "..." : "წაშლა"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}