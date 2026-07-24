import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const LANGUAGE_MAP = {
  "ინგლისური":  "eng",
  "ქართული": "geo",
  "ფრანგული":   "fra",
  "გერმანული":   "deu",
  "რუსული":  "rus",
  "იაპონური": "jpn",
};

const CONDITION_MAP = {
  "ახალი":      "new",
  "კარგი":     "good",
  "საშუალო":  "average",
  "დაზიანებული":  "damaged",
};

const CONDITIONS = ["ახალი", "კარგი", "საშუალო", "დაზიანებული"];
const LANGUAGES  = ["ინგლისური", "ქართული", "ფრანგული", "გერმანული", "რუსული", "იაპონური"];

// SVG იკონები
const StarIcon = ({ filled, hollow }) => {
  // Determine background color
  const fillOption = filled ? "#f59e0b" : "none";
  
  // Determine border color based on props, defaulting to gray
  const strokeOption = filled || hollow ? "#f59e0b" : "#a1a1aa";

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={fillOption}
      stroke={strokeOption}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const Sparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>
  </svg>
)

// ─────────────────────────────────────────────────────────────
// BOOK CAROUSEL (Fixed layout resizing on partial pages)
// ─────────────────────────────────────────────────────────────
function BookCarousel({ icon, title, subtitle, books, id, perPage = 5, rows = 1, onOpenDetail }) {
  const itemsPerPage = perPage * rows;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [books, itemsPerPage]);
  if (!books.length) return null;

  const total   = Math.ceil(books.length / itemsPerPage);
  const visible = books.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

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

      <div
        className="book-grid"
        style={rows > 1 ? { gridTemplateColumns: `repeat(${perPage}, 1fr)`, gridTemplateRows: `repeat(${rows}, auto)` } : undefined}
      >
        {Array.from({ length: itemsPerPage }).map((_, index) => {
          const book = visible[index];
          if (book) {
            return <BookCard key={book.id} book={book} onOpenDetail={onOpenDetail} />;
          }
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
// BOOK GRID (plain, no pagination — search & filter results)
// ─────────────────────────────────────────────────────────────
function BookGrid({ books, onOpenDetail }) {
  if (!books.length) return null;

  return (
    <section className="sec">
      <div className="book-grid">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BESTSELLER CAROUSEL — runs off live "featured" books (top of the
// filtered/sorted list), not hardcoded mock data.
// ─────────────────────────────────────────────────────────────
import './bestseller-carousel.css';
import { motion, AnimatePresence } from "framer-motion";

export function BestsellerCarousel({ bestClusters = [], onSelectCluster }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!bestClusters.length) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % bestClusters.length);
    }, 7000);
    return () => clearInterval(t);
  }, [bestClusters.length]);

  if (!bestClusters || bestClusters.length === 0) return null;

  const cluster = bestClusters[idx];
  const coverImage = cluster.cover_image || '/placeholder-book.jpg';
  
  // 1. პრიორიტეტი ქართულს (geo_title), ხოლო თუ არ არსებობს -> canonical_title
  const displayTitle = cluster.geo_title || cluster.canonical_title;

  return (
    <section className="bs-section">
      <h2 className="bs-sec-title">
        <StarIcon hollow />
        Top Bestseller Clusters
      </h2>

      <div className="bs-carousel-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bs-grid"
          >
            {/* ქავერის სექცია */}
            <div className="bs-cover-wrap">
              <img
                src={coverImage}
                alt={displayTitle}
                className="bs-cover-img"
              />
              <div className="bs-gradient-overlay" />
              <span className="bs-badge">Bestseller #{idx + 1}</span>
            </div>

            {/* ინფო სექცია */}
            <div className="bs-info-wrap">
              <p className="bs-sub-title">Most Loved This Month</p>
              
              {/* 2. აქ გამოჩნდება ქართული სათაური (ან ინგლისური fallback) */}
              <h3 className="bs-book-title">{displayTitle}</h3>
              
              <p className="bs-author">{cluster.author || "სხვადასხვა ავტორი"}</p>

              {/* ვარსკვლავები */}
              <div className="bs-rating-row">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} filled={i < Math.floor(cluster.rating || 5)} />
                ))}
                <span className="bs-rating-num">({cluster.rating || '5.0'})</span>
              </div>

              <p className="bs-desc">
                {cluster.description || "იხილეთ ამ კლასტერში შემავალი მეორადი წიგნები."}
              </p>

              {/* ქვედა ზოლი */}
              <div className="bs-bottom-row">
                <div className="bs-price-box">
                  <span className="bs-price-label">დან</span>
                  <span className="bs-price-val">${cluster.min_price}</span>
                </div>

                <button
                  onClick={() => 
                    onSelectCluster && 
                    onSelectCluster(
                      cluster.cluster_id || cluster.id, 
                      cluster.slug, 
                      displayTitle // 3. გადავცემთ არჩეულ სათაურს Home-ის ჰედერისთვისაც
                    )
                  }
                  className="bs-action-btn"
                >
                  ნახე წიგნები ({cluster.available_copies || 1})
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* წერტილები (Dots) */}
        <div className="bs-dots">
          {bestClusters.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`bs-dot ${i === idx ? 'bs-dot-active' : ''}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* ისრები */}
        <button
          onClick={() => setIdx((i) => (i - 1 + bestClusters.length) % bestClusters.length)}
          className="bs-arrow bs-arrow-left"
          aria-label="Previous"
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() => setIdx((i) => (i + 1) % bestClusters.length)}
          className="bs-arrow bs-arrow-right"
          aria-label="Next"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

function book_at(books, idx) {
  return books[idx];
}

// ─────────────────────────────────────────────────────────────
// BOOK DETAIL MODAL — reads from real book fields (genres, condition,
// photos_urls) instead of the old mock lookup table.
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
    new:     { label: "ახალი",  cls: "bdm-cond-new" },
    good:    { label: "კარგი",   cls: "bdm-cond-good" },
    average: { label: "საშუალო", cls: "bdm-cond-used" },
    damaged: { label: "დაზიანებული", cls: "bdm-cond-used" },
  };
  const cond = conditionMap[book.condition] ?? conditionMap.good;
  const cover = book.photos_urls?.[0] ?? book.cover;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="bdm-card" role="dialog" aria-modal="true" aria-labelledby="bdm-heading">
        <button className="modal-x bdm-close" onClick={onClose} aria-label="Close details">✕</button>

        <div className="bdm-gallery">
          <div className="bdm-main-img-wrap">
            <img src={cover} alt={book.title} className="bdm-main-img" />
          </div>
        </div>

        <div className="bdm-details">
          <div>
            <h2 className="bdm-title" id="bdm-heading">{book.title}</h2>
            <p className="bdm-author">{book.author}</p>
          </div>

          <span className={`bdm-condition ${cond.cls}`}>{cond.label}</span>

          <div className="bdm-stars-price">
            <p className="bdm-price">${book.price}</p>
          </div>
          <div className="bdm-meta">
            <div>
              <p className="bdm-meta-lbl">გამოშვების წელი</p>
              <p className="bdm-meta-val">
                {book.created_at ? new Date(book.created_at).getFullYear() : "—"}
              </p>
            </div>
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
  const [genreSearch, setGenreSearch] = useState("");

  function toggleSet(key, val) {
    onFilterChange((prev) => {
      const next = new Set(prev[key]);
      next.has(val) ? next.delete(val) : next.add(val);
      return { ...prev, [key]: next };
    });
  }

  function reset() {
    onFilterChange({ priceMax: 100, genres: new Set(), conditions: new Set(), languages: new Set() });
    setGenreSearch("");
  }

  const sliderBg = `linear-gradient(to right, var(--accent) ${priceMax}%, #2d3748 ${priceMax}%)`;

  const filteredGenres = useMemo(
    () => availableGenres.filter((g) => g.toLowerCase().includes(genreSearch.trim().toLowerCase())),
    [availableGenres, genreSearch]
  );

  return (
    <aside className={`fp-sidebar${isOpen ? " open" : ""}`} aria-label="Filters">
      <div className="fp-inner">
        <div className="fp-header">
          <span className="fp-title">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="5" cy="3.5" r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="8" r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7" cy="12.5" r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5" />
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

          {!genresLoading && availableGenres.length > 0 && (
            <div className="fp-genre-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
                placeholder="ჟანრის ძებნა..."
                aria-label="Search genres"
              />
              {genreSearch && (
                <button
                  type="button"
                  className="fp-genre-search-clear"
                  onClick={() => setGenreSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {genresLoading ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>იტვირთება...</p>
          ) : availableGenres.length === 0 ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>ჟანრები ვერ მოიძებნა</p>
          ) : filteredGenres.length === 0 ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>"{genreSearch}"-ის შედეგი ვერ მოიძებნა</p>
          ) : (
            <div className="fp-tags">
              {filteredGenres.map((g) => (
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
        <p className="hero-subtitle">სადაც ყოველი წიგნი ფანტაზიას რეალობად აქცევს</p>
        <form className="hero-search-wrap" onSubmit={onSearchSubmit}>
          <input
            type="text" className="hero-search-input"
            placeholder="Search books, authors..."
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search books"
          />
          <button type="submit" className="hero-search-btn">Search</button>
        </form>
        <button className="hero-filter-btn" onClick={onFilterToggle}>⇌  ფილტრებით პოვნა </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────
function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [apiQuery, setApiQuery]       = useState(searchParams.get("q") ?? "");

  const [allBooks, setAllBooks]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const [availableGenres, setAvailableGenres] = useState([]);
  const [genresLoading, setGenresLoading]     = useState(true);

  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedClusterSlug, setSelectedClusterSlug] = useState(null);
  const [selectedClusterTitle, setSelectedClusterTitle] = useState(null);

  const [filters, setFilters] = useState({
    priceMax:   100,
    genres:     new Set(),
    conditions: new Set(),
    languages:  new Set(),
  });

  const [popularClusters, setPopularClusters] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  // "Popular & Bestsellers" — /feed/popular-დან
  const [popularBooks, setPopularBooks] = useState([]);

  // URL-დან q-ს სინქრონიზაცია (Navbar-იდან სერჩისთვის — გუშინდელი ფიქსი)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearchQuery(q);
    setApiQuery(q);
  }, [searchParams]);

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
    if (apiQuery)               params.set("q", apiQuery);
    if (filters.priceMax < 100) params.set("max_price", filters.priceMax);
    if (selectedClusterId != null) params.set("cluster_id", selectedClusterId);

    fetch(`${API_URL}/books?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) { setAllBooks(Array.isArray(data) ? data : []); setLoading(false); }
      })
      .catch(() => { if (!cancelled) { setAllBooks([]); setLoading(false); } });

    return () => { cancelled = true; };
  }, [apiQuery, filters.priceMax, selectedClusterId]);

  useEffect(() => {
    fetch(`${API_URL}/feed/popular-clusters`)
      .then((res) => res.json())
      .then((data) => setPopularClusters(data.clusters || []))
      .catch((err) => console.error("Error fetching clusters:", err));
  }, []);

  // Popular & Bestsellers — /feed/popular
  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/feed/popular`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : (data.books ?? data.results ?? []);
        const books = raw.map((item) => item.book_data ?? item);
        setPopularBooks(books);
      })
      .catch((err) => { console.error("Error fetching popular books:", err); if (!cancelled) setPopularBooks([]); });

    return () => { cancelled = true; };
  }, []);

  // "Recommended for you" — მხოლოდ ავტორიზებულებისთვის
  // "Recommended for you" — მხოლოდ ავტორიზებულებისთვის
  useEffect(() => {
    if (!isLoggedIn) {
      setRecommendedBooks([]);
      return;
    }
    let cancelled = false;

    // 1. ამოვიღოთ ტოკენი ლოკალური მეხსიერებიდან (შეამოწმე რა სახელით ინახავ, "token" თუ "access_token")
    const token = localStorage.getItem("token"); 

    fetch(`${API_URL}/feed`, { 
      // 2. გავატანოთ Bearer ტოკენი ჰედერში
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        
        // 3. ყოველი შემთხვევისთვის data.feed-იც დავამატე, გააჩნია ბექენდი რა key-თ აბრუნებს
        const raw = Array.isArray(data) ? data : (data.feed ?? data.books ?? data.results ?? []);
        const books = raw.map((item) => item.book_data ?? item);
        
        setRecommendedBooks(books);
      })
      .catch(() => { if (!cancelled) setRecommendedBooks([]); });

    return () => { cancelled = true; };
  }, [isLoggedIn]);
  
  const handleSelectCluster = (clusterId, clusterSlug, clusterTitle) => {
    setSelectedClusterId(clusterId);
    setSelectedClusterSlug(clusterSlug);
    setSelectedClusterTitle(clusterTitle); // ვინახავთ სათაურს
    document.getElementById("filtered-cluster-section")?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredBooks = useMemo(() => {
    let result = allBooks;

    if (selectedClusterId !== null && selectedClusterId !== undefined) {
      result = result.filter((b) => Number(b.cluster_id) === Number(selectedClusterId));
    }
    
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
  }, [allBooks, filters.conditions, filters.languages, filters.genres, selectedClusterId]);

  const featured = filteredBooks.slice(0, 3);

  // საძიებო/ფილტრის რომელიმე ფორმა აქტიურია? → carousel-ების ნაცვლად grid
  const isFiltering =
    !!apiQuery ||
    filters.priceMax < 100 ||
    filters.genres.size > 0 ||
    filters.conditions.size > 0 ||
    filters.languages.size > 0 ||
    selectedClusterId != null;

  const showRecommended = isLoggedIn && recommendedBooks.length > 0;
  const popularPerPage  = showRecommended ? 5 : 10;

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
            ) : (
              <>
                {!isFiltering && (
                  <BestsellerCarousel
                    bestClusters={popularClusters}
                    onSelectCluster={handleSelectCluster}
                  />
                )}

                {selectedClusterId && (
                  <div id="filtered-cluster-section" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    margin: '0 auto 24px auto',
                    maxWidth: '1024px',
                    backgroundColor: '#111222', // ოდნავ გამოყოფილი ფონი
                    borderLeft: '4px solid #d6a05a'
                  }}>
                    <div>
                      <h2 style={{ margin: 0, color: '#F4E8D8', fontSize: '1.4rem' }}>
                        {selectedClusterTitle}
                      </h2>
                      <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
                        ნაპოვნია {filteredBooks.length} სხვადასხვა გამოცემა/ვერსია
                      </p>
                    </div>

                    <button
                      onClick={() => { 
                        setSelectedClusterId(null); 
                        setSelectedClusterSlug(null); 
                        setSelectedClusterTitle(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(214, 160, 90, 0.5)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#F4E8D8',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#d6a05a';
                        e.target.style.color = '#000';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#F4E8D8';
                      }}
                    >
                      ✕ ფილტრის წაშლა
                    </button>
                  </div>
                )}

                {filteredBooks.length === 0 ? (
                  <h2 style={{ padding: "40px", textAlign: "center" }}>ამ კრიტერიუმებით წიგნები ვერ მოიძებნა</h2>
                ) : isFiltering ? (
                  // აქ უკვე BookGrid გამოიტანს მხოლოდ ამ კლასტერის წიგნებს
                  <BookGrid
                    books={filteredBooks}
                    onOpenDetail={(book) => setSelectedBook(book)}
                  />
                ) : (
                  <>
                    <BookCarousel
                      id="popular-section"
                      icon="↗"
                      title="Popular & Bestsellers"
                      subtitle="Beloved by readers across the archive"
                      books={popularBooks}
                      perPage={popularPerPage}
                      onOpenDetail={(book) => setSelectedBook(book)}
                    />

                    {showRecommended && (
                      <BookCarousel
                        id="recommended-section"
                        icon="★"
                        title="Recommended for you"
                        subtitle="Picked based on your reading taste"
                        books={recommendedBooks}
                        perPage={5}
                        onOpenDetail={(book) => setSelectedBook(book)}
                      />
                    )}

                    <BookCarousel
                      id="others-section"
                      icon={<Sparkle />}
                      title="Others"
                      subtitle="More titles from the archive"
                      books={filteredBooks}
                      perPage={5}
                      rows={2}
                      onOpenDetail={(book) => setSelectedBook(book)}
                    />
                  </>
                )}
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