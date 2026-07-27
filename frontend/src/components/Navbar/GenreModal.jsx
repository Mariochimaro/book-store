import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Styles/genre-preferences.css"

const API_URL = import.meta.env.VITE_API_URL;

export function GenreModal({ onClose }) {
  const { user, refreshUser, setUser } = useAuth();
  const [availableGenres, setAvailableGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  
  // 1. საწყისი state მომხმარებლის არსებული ჟანრებით
  const [selected, setSelected] = useState(() => new Set(user?.genres ?? []));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // 2. როცა user.genres შეიცვლება (ან მოდალი ხელახლა გაიღება), სინქრონულად განვაახლოთ selected
  useEffect(() => {
    if (Array.isArray(user?.genres)) {
      setSelected(new Set(user.genres));
    }
  }, [user?.genres]);

  useEffect(() => {
    fetch(`${API_URL}/books/genres`)
      .then((res) => res.json())
      .then((data) => {
        setAvailableGenres(Array.isArray(data) ? data : []);
        setGenresLoading(false);
      })
      .catch(() => setGenresLoading(false));
  }, []);

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

  // Fuzzy match ძებნა
  function fuzzyMatch(text, query) {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const t = text.toLowerCase();
    if (t.includes(q)) return true;
    let qIdx = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === q[qIdx]) qIdx++;
      if (qIdx === q.length) return true;
    }
    return false;
  }

  const filteredGenres = useMemo(
    () => availableGenres.filter((g) => fuzzyMatch(g, search)),
    [availableGenres, search]
  );

  function toggle(genre) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre); // მოშორება (uncheck)
      } else {
        next.add(genre);    // დამატება (check)
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/user/genres`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ genres: Array.from(selected) }),
      });

      if (!res.ok) throw new Error("Failed to save genre preferences");
      const data = await res.json();

      // AuthContext-ში იუზერის ჟანრების განახლება
      if (refreshUser) {
        await refreshUser();
      } else if (setUser) {
        setUser((prev) => ({ ...prev, genres: data.genres }));
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const count = selected.size;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <div className="modal-card gm-card" role="dialog" aria-modal="true" aria-labelledby="gm-heading">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        <div className="gm-header">
          <svg className="gm-sparkle" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>
          </svg>
          <h2 className="modal-title" id="gm-heading">ჟანრის პრეფერენციები</h2>
        </div>
        <p className="modal-sub">
          აირჩიე შენთვის საინტერესო ჟანრები — რეკომენდაციები მყისვე განახლდება.
        </p>

        {!genresLoading && availableGenres.length > 0 && (
          <div className="gm-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ჟანრის ძებნა..."
              aria-label="Search genres"
            />
            {search && (
              <button type="button" className="gm-search-clear" onClick={() => setSearch("")} aria-label="Clear">×</button>
            )}
          </div>
        )}

        <div className="gm-grid" role="group" aria-label="Genre options">
          {genresLoading ? (
            <p className="gm-empty">იტვირთება...</p>
          ) : filteredGenres.length === 0 ? (
            <p className="gm-empty">"{search}"-ის შედეგი ვერ მოიძებნა</p>
          ) : (
            filteredGenres.map((genre) => {
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
            })
          )}
        </div>

        <div className="gm-footer">
          <span className="gm-count">{count} ჟანრი მონიშნული</span>
          <div className="modal-btn-row">
            <button className="modal-btn-ghost1" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="modal-btn" onClick={handleSave} disabled={saving}>
              {saving ? "ინახება..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
