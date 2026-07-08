import { useState, useEffect } from "react";

const GENRES = [
  "Gothic Horror",   "Dark Fantasy",    "Mystery",
  "Victorian Gothic","Paranormal",      "Dark Romance",
  "Supernatural",    "Thriller",        "Cozy Fantasy",
  "Fairy Tale",      "Magical Realism", "Steampunk Gothic",
];

export function GenreModal({ onClose, initialSelected = [] }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));

  // Body scroll lock + Escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function toggle(genre) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(genre) ? next.delete(genre) : next.add(genre);
      return next;
    });
  }

  function handleSave() {
    // TODO: persist to user profile / context
    onClose();
  }

  const count = selected.size;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="modal-card gm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-heading"
      >
        {/* Close × */}
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        {/* Header */}
        <div className="gm-header">
          <svg
            className="gm-sparkle"
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>
          </svg>
          <h2 className="modal-title" id="gm-heading">ჟანრის პრეფერენციები</h2>
        </div>
        <p className="modal-sub">
          Update your preferred genres — your recommendations will refresh instantly.
        </p>

        {/* Genre checkbox grid */}
        <div className="gm-grid" role="group" aria-label="Genre options">
          {GENRES.map((genre) => {
            const checked = selected.has(genre);
            return (
              <button
                key={genre}
                className={`gm-genre-btn${checked ? " checked" : ""}`}
                onClick={() => toggle(genre)}
                role="checkbox"
                aria-checked={checked}
              >
                <span className={`gm-check${checked ? " on" : ""}`} aria-hidden="true">
                  {checked && "✓"}
                </span>
                {genre}
              </button>
            );
          })}
        </div>

        {/* Footer: counter + action buttons */}
        <div className="gm-footer">
          <span className="gm-count">
            {count} {count === 1 ? "genre" : "genres"} selected
          </span>
          <div className="modal-btn-row">
            <button className="modal-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="modal-btn" onClick={handleSave}>Save Preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
}
