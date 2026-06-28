import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

// ─────────────────────────────────────────────────────────────
// MOCK DATA  (swap for real API calls when backend is ready)
// ─────────────────────────────────────────────────────────────

const BESTSELLERS = [
  {
    id: 1,
    badge: "Bestseller #1",
    label: "Most Loved This Month",
    title: "The Shadow Codex",
    author: "Eleanor Voss",
    rating: 4.8,
    description:
      "An ancient grimoire surfaces in a modern city, and only one librarian can decode its deadly secrets before time runs out.",
    price: "22.99",
    cover: "https://picsum.photos/seed/shadowcodex/800/560",
  },
  {
    id: 2,
    badge: "Bestseller #2",
    label: "Most Loved This Month",
    title: "Witching Hour Chronicles",
    author: "Morgana Blackthorn",
    rating: 4.9,
    description:
      "A young witch discovers she's the last descendant of a powerful bloodline and must master her abilities before dark forces consume the world.",
    price: "24.99",
    cover: "https://picsum.photos/seed/witchinghour/800/560",
  },
  {
    id: 3,
    badge: "Bestseller #3",
    label: "Most Loved This Month",
    title: "The Ember Crown",
    author: "Cassius Drake",
    rating: 4.7,
    description:
      "A prince exiled from his burning kingdom must reclaim his throne before the eternal winter swallows the realm whole.",
    price: "19.99",
    cover: "https://picsum.photos/seed/embercrown/800/560",
  },
];

const POPULAR = [
  { id: 1,  title: "The Crimson Veil",           author: "Victoria Thornfield",  price: "22.99", badge: "new",     cover: "https://picsum.photos/seed/crimsonveil/400/560" },
  { id: 2,  title: "Witching Hour Chronicles",   author: "Morgana Blackthorn",   price: "24.99", badge: "pending", cover: "https://picsum.photos/seed/witchinghour2/400/560" },
  { id: 3,  title: "The Amber Witch",             author: "Philippa Sovencroft",  price: "27.99", badge: null,      cover: "https://picsum.photos/seed/amberwitch/400/560" },
  { id: 4,  title: "Midnight Apothecary",         author: "Circe Arledenne",      price: "21.49", badge: "new",     cover: "https://picsum.photos/seed/midnightapo/400/560" },
  { id: 5,  title: "The Gilded Cage of Sorrows",  author: "Endymion Graven",      price: "28.99", badge: "new",     cover: "https://picsum.photos/seed/gildedcage/400/560" },
  { id: 6,  title: "Veil of Starless Nights",     author: "Seraphine Dusk",       price: "23.49", badge: null,      cover: "https://picsum.photos/seed/veilstarless/400/560" },
  { id: 7,  title: "The Bone Garden",             author: "Lux Mortem",           price: "26.99", badge: "new",     cover: "https://picsum.photos/seed/bonegarden/400/560" },
  { id: 8,  title: "Daughters of the Tide",       author: "Corinna Waveborn",     price: "20.99", badge: null,      cover: "https://picsum.photos/seed/tidedaughters/400/560" },
  { id: 9,  title: "The Oracle's Lament",         author: "Zephyr Ashvale",       price: "24.99", badge: "new",     cover: "https://picsum.photos/seed/oraclelament/400/560" },
  { id: 10, title: "Ink & Omen",                  author: "Thessaly Crane",       price: "18.99", badge: null,      cover: "https://picsum.photos/seed/inkomen/400/560" },
];

const NEW_ARRIVALS = [
  { id: 11, title: "The Starweaver's Daughter",    author: "Isadora Vives",    price: "21.99", badge: "new", cover: "https://picsum.photos/seed/starweaver/400/560" },
  { id: 12, title: "The Moonpetal Inn",             author: "Theodora Wren",   price: "18.99", badge: "new", cover: "https://picsum.photos/seed/moonpetal/400/560" },
  { id: 13, title: "Foxfire and Forgotten Names",  author: "Sable Marquees",  price: "20.49", badge: "new", cover: "https://picsum.photos/seed/foxfire/400/560" },
  { id: 14, title: "A Bouquet of Broken Spells",   author: "Isolde Fairleigh", price: "17.99", badge: "new", cover: "https://picsum.photos/seed/bouquetspells/400/560" },
  { id: 15, title: "The Cartographer of Nightmares", author: "Declan Vex",    price: "25.49", badge: "new", cover: "https://picsum.photos/seed/cartographer/400/560" },
  { id: 16, title: "The Hollow Forest",             author: "Sable Haze",      price: "22.99", badge: "new", cover: "https://picsum.photos/seed/hollowforest/400/560" },
  { id: 17, title: "Glass and Ether",               author: "Niamh Vray",      price: "19.99", badge: "new", cover: "https://picsum.photos/seed/glassether/400/560" },
  { id: 18, title: "The Last Oracle",               author: "Clio Pendrake",   price: "23.99", badge: "new", cover: "https://picsum.photos/seed/lastoracle/400/560" },
  { id: 19, title: "Mirrors of the Deep",           author: "Seren Cross",     price: "21.49", badge: "new", cover: "https://picsum.photos/seed/mirrorsdeep/400/560" },
  { id: 20, title: "The Runed Gate",                author: "Elliot Asher",    price: "20.99", badge: "new", cover: "https://picsum.photos/seed/runedgate/400/560" },
];

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  const full = Math.round(rating);
  return (
    <div className="stars-row" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star-icon ${n <= full ? "star-on" : "star-off"}`} aria-hidden="true">
          ★
        </span>
      ))}
      <span className="rating-val">({rating})</span>
    </div>
  );
}

function BookCard({ book }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const badgeMap   = { new: "bc-new", pending: "bc-pending", ist: "bc-ist" };
  const badgeLabel = { new: "New",    pending: "Pending",    ist: "1 IST New" };

  function handleAdd() {
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  }

  return (
    <article className="bc">
      <div className="bc-img-wrap">
        <img src={book.cover} alt={book.title} className="bc-img" loading="lazy" />
        {book.badge && (
          <span className={`bc-badge ${badgeMap[book.badge] ?? "bc-new"}`}>
            {badgeLabel[book.badge] ?? "New"}
          </span>
        )}
      </div>
      <div className="bc-info">
        <p className="bc-title">{book.title}</p>
        <p className="bc-author">{book.author}</p>
        <div className="bc-foot">
          <span className="bc-price">${book.price}</span>
          <button
            className={`bc-cart${added ? " bc-cart-ok" : ""}`}
            onClick={handleAdd}
            aria-label={`Add ${book.title} to cart`}
          >
            {added ? "✓" : "🛒"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOK CAROUSEL  (Most Popular / New Arrivals)
// ─────────────────────────────────────────────────────────────

const PER_PAGE = 5;

function BookCarousel({ icon, title, subtitle, books }) {
  const [page, setPage] = useState(0);
  const total = Math.ceil(books.length / PER_PAGE);
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
          <button
            className="arr-btn"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            className="arr-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === total - 1}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>

      <div className="book-grid">
        {visible.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      <div className="c-dots" role="tablist" aria-label="Carousel pages">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            className={`c-dot${i === page ? " on" : ""}`}
            onClick={() => setPage(i)}
            role="tab"
            aria-selected={i === page}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BESTSELLER CAROUSEL
// ─────────────────────────────────────────────────────────────

function BestsellerCarousel({ books }) {
  const [idx, setIdx] = useState(0);
  const book = books[idx];

  return (
    <section className="sec">
      <h2 className="sec-title" style={{ marginBottom: "28px" }}>
        <span aria-hidden="true">⭐</span> Top Bestsellers
      </h2>

      <div className="bs-card">
        {/* Prev arrow */}
        <button
          className="bs-arrow bs-arrow-l"
          onClick={() => setIdx((i) => i - 1)}
          disabled={idx === 0}
          aria-label="Previous bestseller"
        >
          ‹
        </button>

        {/* Cover image */}
        <div className="bs-img-wrap">
          <img src={book.cover} alt={book.title} className="bs-img" />
          <span className="bs-badge">{book.badge}</span>
        </div>

        {/* Details */}
        <div className="bs-content">
          <p className="bs-label">{book.label}</p>
          <h3 className="bs-title">{book.title}</h3>
          <p className="bs-author">{book.author}</p>
          <StarRating rating={book.rating} />
          <p className="bs-desc">{book.description}</p>
          <div className="bs-bottom">
            <span className="bs-price">${book.price}</span>
            <Link to={`/book/${book.id}`} className="btn-view">
              View Book
            </Link>
          </div>
        </div>

        {/* Next arrow */}
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
// FILTER PANEL
// ─────────────────────────────────────────────────────────────

const GENRES = [
  "Gothic Horror", "Dark Fantasy", "Mystery", "Victorian Gothic",
  "Paranormal", "Dark Romance", "Supernatural", "Thriller",
  "Cozy Fantasy", "Fairy Tale", "Urban Fantasy", "Historical",
];
const CONDITIONS = ["New", "Like-New", "Good", "Fair"];
const LANGUAGES  = ["English", "Georgian", "French", "German", "Russian", "Japanese"];

function FilterPanel({ isOpen, onClose }) {
  const [priceMax, setPriceMax]       = useState(100);
  const [genres, setGenres]           = useState(new Set());
  const [conditions, setConditions]   = useState(new Set());
  const [languages, setLanguages]     = useState(new Set());

  function toggleSet(setter, val) {
    setter((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  function reset() {
    setPriceMax(100);
    setGenres(new Set());
    setConditions(new Set());
    setLanguages(new Set());
  }

  const sliderBg = `linear-gradient(to right, var(--accent) ${priceMax}%, #2d3748 ${priceMax}%)`;

  return (
    <aside className={`fp-sidebar${isOpen ? " open" : ""}`} aria-label="Filters">
      <div className="fp-inner">

        {/* Header */}
        <div className="fp-header">
          <span className="fp-title">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="8"   x2="14" y2="8"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="5"  cy="3.5"  r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="11" cy="8"    r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="7"  cy="12.5" r="2" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Filters
          </span>
          <button className="fp-reset" onClick={reset}>Reset</button>
        </div>

        {/* Price Range */}
        <div className="fp-section">
          <p className="fp-lbl">Price Range</p>
          <input
            type="range"
            min={0}
            max={100}
            value={priceMax}
            onChange={(e) => setPriceMax(+e.target.value)}
            className="fp-range"
            style={{ background: sliderBg }}
            aria-label={`Max price: $${priceMax}`}
          />
          <div className="fp-price-row">
            <span>$0</span>
            <span>Up to ${priceMax}</span>
          </div>
        </div>

        {/* Genre */}
        <div className="fp-section">
          <p className="fp-lbl">Genre</p>
          <div className="fp-tags">
            {GENRES.map((g) => (
              <button
                key={g}
                className={`fp-tag${genres.has(g) ? " on" : ""}`}
                onClick={() => toggleSet(setGenres, g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="fp-section">
          <p className="fp-lbl">Condition</p>
          {CONDITIONS.map((c) => (
            <label key={c} className="fp-row">
              <span className={`fp-cb${conditions.has(c) ? " checked" : ""}`} aria-hidden="true">
                {conditions.has(c) && "✓"}
              </span>
              <input
                type="checkbox"
                className="visually-hidden"
                checked={conditions.has(c)}
                onChange={() => toggleSet(setConditions, c)}
              />
              {c}
            </label>
          ))}
        </div>

        {/* Language */}
        <div className="fp-section">
          <p className="fp-lbl">Language</p>
          {LANGUAGES.map((l) => (
            <label key={l} className="fp-row">
              <span className={`fp-cb${languages.has(l) ? " checked" : ""}`} aria-hidden="true">
                {languages.has(l) && "✓"}
              </span>
              <input
                type="checkbox"
                className="visually-hidden"
                checked={languages.has(l)}
                onChange={() => toggleSet(setLanguages, l)}
              />
              {l}
            </label>
          ))}
        </div>

        {/* Close button */}
        <button className="fp-close" onClick={onClose}>
          Close filters
        </button>

      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────

function HeroSection({ onFilterToggle }) {
  const [query, setQuery] = useState("");

  function handleSearch(e) {
    e.preventDefault();
  }

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

        <p className="hero-subtitle">
          სადაც ყოველი წიგნი ფანტასიას რეალობად აქცევს
        </p>

        <form className="hero-search-wrap" onSubmit={handleSearch}>
          <input
            type="text"
            className="hero-search-input"
            placeholder="Search books, authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search books"
          />
          <button type="submit" className="hero-search-btn">
            Search
          </button>
        </form>

        <button className="hero-filter-btn" onClick={onFilterToggle}>
          ⇌ Browse &amp; Filter
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────

function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <Navbar />

      <main>
        <HeroSection onFilterToggle={() => setFiltersOpen((o) => !o)} />

        {/* Two-column layout: filter sidebar + sections */}
        <div className="page-body">
          <FilterPanel
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          <div className="sections-area">
            <BestsellerCarousel books={BESTSELLERS} />

            <BookCarousel
              icon="↗"
              title="Most Popular"
              subtitle="Beloved by readers across the archive"
              books={POPULAR}
            />

            <BookCarousel
              icon="✦"
              title="New Arrivals"
              subtitle="Just added — fresh discoveries await"
              books={NEW_ARRIVALS}
            />
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;
