import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";

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

function BookCarousel({ icon, title, subtitle, books }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [books]);
  if (!books.length) return null;

  const total   = Math.ceil(books.length / PER_PAGE);
  const visible = books.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <section className="sec">
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
    </>
  );
}

export default Home;