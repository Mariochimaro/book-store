import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";
import { useCart } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL;

const LANGUAGE_MAP = {
  English:  "eng",
  Georgian: "geo",
  French:   "fra",
  German:   "deu",
  Russian:  "rus",
  Japanese: "jpn",
};

const CONDITION_MAP = {
  "New":      "new",
  "Good": "good",
  "Average":     "average",
  "Damaged":     "damaged",
};

const CONDITIONS = ["New", "Like-New", "Good", "Fair"];
const LANGUAGES  = ["English", "Georgian", "French", "German", "Russian", "Japanese"];

// ─────────────────────────────────────────────────────────────
// BOOK CAROUSEL (Fixed layout resizing on partial pages)
// ─────────────────────────────────────────────────────────────
const PER_PAGE = 5;

function BookCarousel({ icon, title, subtitle, books, onOpenDetail, id }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [books]);
  if (!books.length) return null;

  const total   = Math.ceil(books.length / PER_PAGE);
  const visible = books.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <section className="sec" id={id}>
      <div className="sec-head">
        <div>
          <h2 className="sec-title">
            <span aria-hidden="true">{icon}</span>
            {title}
          </h2>
          {subtitle && <p className="sec-sub">{subtitle}</p>}
        </div>
        <div className="sec-nav">
          <span className="page-lbl">{page + 1} / {total}</span>
          <button className="arr-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">‹</button>
          <button className="arr-btn" onClick={() => setPage((p) => p + 1)} disabled={page === total - 1} aria-label="Next page">›</button>
        </div>
      </div>

      <div className="book-grid">
        {Array.from({ length: PER_PAGE }).map((_, index) => {
          const book = visible[index];
          if (book) {
            return <BookCard key={book.id} book={book} />;
          }
          // Placeholder slots that keep columns from stretching on the last page
          return (
            <div 
              key={`empty-${index}`} 
              style={{ visibility: "hidden", minHeight: "1px" }} 
              aria-hidden="true" 
            />
          );
        })}
      </div>

      <div className="c-dots" role="tablist">
        {Array.from({ length: total }, (_, i) => (
          <button key={i} className={`c-dot${i === page ? " on" : ""}`} onClick={() => setPage(i)} role="tab" aria-selected={i === page} aria-label={`Page ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BESTSELLER CAROUSEL (adapted to run off live "featured" books instead
// of the hardcoded BESTSELLERS array)
// ─────────────────────────────────────────────────────────────
function BestsellerCarousel({ books, onOpenDetail }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [books]);
  if (!books.length) return null;

  const book = books[idx];

  return (
    <section className="sec">
      <h2 className="sec-title" style={{ marginBottom: "28px" }}>
        <span aria-hidden="true">⭐</span> Top Bestsellers
      </h2>

      <div className="bs-card">
        <button
          className="bs-arrow bs-arrow-l"
          onClick={() => setIdx((i) => i - 1)}
          disabled={idx === 0}
          aria-label="Previous bestseller"
        >
          ‹
        </button>

        <div className="bs-img-wrap">
          <img src={book.cover} alt={book.title} className="bs-img" />
          <span className="bs-badge">Bestseller #{idx + 1}</span>
        </div>

        <div className="bs-content">
          <p className="bs-label">Most Loved This Month</p>
          <h3 className="bs-title">{book.title}</h3>
          <p className="bs-author">{book.author}</p>
          <StarRating rating={book.rating} />
          <p className="bs-desc">{book.description ?? "No description available yet."}</p>
          <div className="bs-bottom">
            <span className="bs-price">${book.price}</span>
            <button className="btn-view" onClick={() => onOpenDetail && onOpenDetail(book)}>
              View Book
            </button>
          </div>
        </div>

        <button
          className="bs-arrow bs-arrow-r"
          onClick={() => setIdx((i) => i + 1)}
          disabled={idx === books.length - 1}
          aria-label="Next bestseller"
        >
          ›
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOK DETAIL MODAL (adapted to read from real book fields instead of
// the static BOOK_DETAILS lookup table)
// ─────────────────────────────────────────────────────────────
function BookDetailModal({ book, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

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

  function handleAddToCart() {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  }

  const conditionMap = {
    new:     { label: "NEW — Unused, pristine condition",  cls: "bdm-cond-new" },
    good:    { label: "GOOD — Some wear, fully readable",   cls: "bdm-cond-good" },
    average: { label: "AVERAGE — Noticeable wear",          cls: "bdm-cond-used" },
    damaged: { label: "DAMAGED — Heavily worn",             cls: "bdm-cond-used" },
  };
  const cond = conditionMap[book.condition] ?? conditionMap.good;

  // Real data only gives us one cover image, so the multi-thumbnail gallery
  // from the mock version is dropped rather than faked with repeated seeds.
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="bdm-card" role="dialog" aria-modal="true" aria-labelledby="bdm-heading">
        <button className="modal-x bdm-close" onClick={onClose} aria-label="Close details">✕</button>

        <div className="bdm-gallery">
          <button
            className={`bdm-bookmark-btn${wishlisted ? " active" : ""}`}
            onClick={() => setWishlisted((w) => !w)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          <div className="bdm-main-img-wrap">
            <img src={book.cover} alt={book.title} className="bdm-main-img" />
          </div>
        </div>

        <div className="bdm-details">
          <div>
            <h2 className="bdm-title" id="bdm-heading">{book.title}</h2>
            <p className="bdm-author">{book.author}</p>
          </div>

          <span className={`bdm-condition ${cond.cls}`}>{cond.label}</span>

          <div className="bdm-stars-price">
            <StarRating rating={book.rating} />
            <span className="bdm-price">${book.price}</span>
          </div>

          {(book.genres ?? []).length > 0 && (
            <div className="bdm-tags">
              {book.genres.map((t) => (
                <span key={t} className="bdm-tag">{t}</span>
              ))}
            </div>
          )}

          <div>
            <p className="bdm-desc-heading">Description</p>
            <p className="bdm-desc-text">{book.description ?? "No description available yet."}</p>
          </div>

          <div className="bdm-meta">
            <div>
              <p className="bdm-meta-lbl">ISBN</p>
              <p className="bdm-meta-val">{book.isbn ?? "—"}</p>
            </div>
            <div>
              <p className="bdm-meta-lbl">Published</p>
              <p className="bdm-meta-val">
                {book.created_at ? new Date(book.created_at).getFullYear() : "—"}
              </p>
            </div>
          </div>

          <div className="bdm-rate-card">
            <div className="bdm-rate-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--accent)", marginRight: 6 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Rate This Book
            </div>
            <p className="bdm-rate-note">Only buyers who purchased this book can rate it</p>
          </div>

          <div className="bdm-actions">
            <button className={`bdm-add-cart${added ? " added" : ""}`} onClick={handleAddToCart}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {added ? "Added to Cart!" : "Add to Cart"}
            </button>
            <button
              className={`bdm-wishlist-action${wishlisted ? " active" : ""}`}
              onClick={() => setWishlisted((w) => !w)}
              aria-label="Wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER PANEL
// ─────────────────────────────────────────────────────────────
function FilterPanel({ isOpen, onClose, filters, onFilterChange, availableGenres, genresLoading }) {
  const { priceMax, genres, conditions, languages } = filters;

  function toggleSet(key, val) {
    onFilterChange((prev) => {
      const next = new Set(prev[key]);
      next.has(val) ? next.delete(val) : next.add(val);
      return { ...prev, [key]: next };
    });
  }

  function reset() {
    onFilterChange({ priceMax: 100, genres: new Set(), conditions: new Set(), languages: new Set() });
  }

  const sliderBg = `linear-gradient(to right, var(--accent) ${priceMax}%, #2d3748 ${priceMax}%)`;

  return (
    <aside className={`fp-sidebar${isOpen ? " open" : ""}`} aria-label="Filters">
      <div className="fp-inner">
        <div className="fp-header">
          <span className="fp-title">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <line x1="2" y1="3.5"  x2="14" y2="3.5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="8"    x2="14" y2="8"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="5"  cy="3.5"  r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="8"    r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7"  cy="12.5" r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Filters
          </span>
          <button className="fp-reset" onClick={reset}>Reset</button>
        </div>

        <div className="fp-section">
          <p className="fp-lbl">Price Range</p>
          <input
            type="range" min={0} max={100} value={priceMax}
            onChange={(e) => onFilterChange((prev) => ({ ...prev, priceMax: +e.target.value }))}
            className="fp-range" style={{ background: sliderBg }}
            aria-label={`Max price: ${priceMax} ₾`}
          />
          <div className="fp-price-row">
            <span>0 ₾</span>
            <span>Up to {priceMax} ₾</span>
          </div>
        </div>

        <div className="fp-section">
          <p className="fp-lbl">Genre</p>
          {genresLoading ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>იტვირთება...</p>
          ) : availableGenres.length === 0 ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>ჟანრები ვერ მოიძებნა</p>
          ) : (
            <div className="fp-tags">
              {availableGenres.map((g) => (
                <button key={g} className={`fp-tag${genres.has(g) ? " on" : ""}`} onClick={() => toggleSet("genres", g)}>
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fp-section">
          <p className="fp-lbl">Condition</p>
          {CONDITIONS.map((c) => (
            <label key={c} className="fp-row">
              <span className={`fp-cb${conditions.has(c) ? " checked" : ""}`} aria-hidden="true">{conditions.has(c) && "✓"}</span>
              <input type="checkbox" className="visually-hidden" checked={conditions.has(c)} onChange={() => toggleSet("conditions", c)} />
              {c}
            </label>
          ))}
        </div>

        <div className="fp-section">
          <p className="fp-lbl">Language</p>
          {LANGUAGES.map((l) => (
            <label key={l} className="fp-row">
              <span className={`fp-cb${languages.has(l) ? " checked" : ""}`} aria-hidden="true">{languages.has(l) && "✓"}</span>
              <input type="checkbox" className="visually-hidden" checked={languages.has(l)} onChange={() => toggleSet("languages", l)} />
              {l}
            </label>
          ))}
        </div>

        <button className="fp-close" onClick={onClose}>Close filters</button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function HeroSection({ onFilterToggle, searchQuery, onSearchChange, onSearchSubmit }) {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-eyebrow">— Let There Be —</p>
        <h1 className="hero-title">
          <span className="hero-title-white">წიგნების</span>
          <span className="hero-title-accent">სამყარო</span>
        </h1>
        <p className="hero-subtitle">სადაც ყოველი წიგნი ფანტასიას რეალობად აქცევს</p>
        <form className="hero-search-wrap" onSubmit={onSearchSubmit}>
          <input
            type="text" className="hero-search-input"
            placeholder="Search books, authors..."
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search books"
          />
          <button type="submit" className="hero-search-btn">Search</button>
        </form>
        <button className="hero-filter-btn" onClick={onFilterToggle}>⇌ Browse &amp; Filter</button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────
function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [apiQuery, setApiQuery]       = useState(searchParams.get("q") ?? "");

  const [allBooks, setAllBooks]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const [availableGenres, setAvailableGenres] = useState([]);
  const [genresLoading, setGenresLoading]     = useState(true);

  const [filters, setFilters] = useState({
    priceMax:   100,
    genres:     new Set(),
    conditions: new Set(),
    languages:  new Set(),
  });

  useEffect(() => {
    fetch(`${API_URL}/books/genres`)
      .then((res) => res.json())
      .then((data) => { setAvailableGenres(Array.isArray(data) ? data : []); setGenresLoading(false); })
      .catch(() => setGenresLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (apiQuery)               params.set("q",         apiQuery);
    if (filters.priceMax < 100) params.set("max_price", filters.priceMax);

    fetch(`${API_URL}/books?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) { setAllBooks(Array.isArray(data) ? data : []); setLoading(false); }
      })
      .catch(() => { if (!cancelled) { setAllBooks([]); setLoading(false); } });

    return () => { cancelled = true; };
  }, [apiQuery, filters.priceMax]);

  const filteredBooks = useMemo(() => {
    let result = allBooks;

    if (filters.conditions.size > 0) {
      const mapped = new Set([...filters.conditions].map((c) => CONDITION_MAP[c] ?? c.toLowerCase()));
      result = result.filter((b) => mapped.has(b.condition));
    }
    if (filters.languages.size > 0) {
      const mapped = new Set([...filters.languages].map((l) => LANGUAGE_MAP[l] ?? l.toLowerCase()));
      result = result.filter((b) => mapped.has(b.language?.toLowerCase()));
    }
    if (filters.genres.size > 0) {
      result = result.filter((b) => {
        const bookGenres = (b.genres ?? []).map((g) => g.toLowerCase());
        return [...filters.genres].some((g) =>
          bookGenres.some((bg) => bg.includes(g.toLowerCase()))
        );
      });
    }

    return result;
  }, [allBooks, filters.conditions, filters.languages, filters.genres]);

  const featured    = filteredBooks.slice(0, 3);
  const newArrivals = useMemo(
    () => [...filteredBooks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [filteredBooks]
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    setApiQuery(searchQuery);
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  }

  return (
    <>
      <Navbar />
      <main>
        <HeroSection
          onFilterToggle={() => setFiltersOpen((o) => !o)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <div className="page-body">
          <FilterPanel
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            onFilterChange={setFilters}
            availableGenres={availableGenres}
            genresLoading={genresLoading}
          />

          <div className="sections-area">
            {loading ? (
              <h2 style={{ padding: "40px", textAlign: "center" }}>იტვირთება...</h2>
            ) : filteredBooks.length === 0 ? (
              <h2 style={{ padding: "40px", textAlign: "center" }}>წიგნები ვერ მოიძებნა</h2>
            ) : (
              <>
                <BookCarousel icon="↗" title="Popular & Bestsellers" subtitle="Beloved by readers across the archive" books={filteredBooks} />
                <BookCarousel icon="✦" title="New Arrivals & Discoveries"  subtitle="Just added — fresh discoveries await"  books={newArrivals} />
              </>
            )}
          </div>
        </div>
      </main>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </>
  );
}

export default Home;