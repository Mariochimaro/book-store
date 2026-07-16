import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const LANGUAGE_MAP = {
  English:  "eng",
  Georgian: "geo",
  French:   "fra",
  German:   "deu",
  Russian:  "rus",
  Japanese: "jpn",
};

const CONDITION_MAP = {
  "New":     "new",
  "Good":    "good",
  "Average": "average",
  "Damaged": "damaged",
};

const CONDITIONS = ["New", "Like-New", "Good", "Fair"];
const LANGUAGES  = ["English", "Georgian", "French", "German", "Russian", "Japanese"];

const GENRES = [
  "Gothic Horror", "Dark Fantasy", "Mystery", "Victorian Gothic",
  "Paranormal", "Dark Romance", "Supernatural", "Thriller",
  "Cozy Fantasy", "Fairy Tale", "Urban Fantasy", "Historical",
];

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
  { id: 1,  title: "The Crimson Veil",            author: "Victoria Thornfield",  price: "22.99", badge: "new",     cover: "https://picsum.photos/seed/crimsonveil/400/560" },
  { id: 2,  title: "Witching Hour Chronicles",    author: "Morgana Blackthorn",   price: "24.99", badge: "pending", cover: "https://picsum.photos/seed/witchinghour2/400/560" },
  { id: 3,  title: "The Amber Witch",              author: "Philippa Sovencroft",  price: "27.99", badge: null,      cover: "https://picsum.photos/seed/amberwitch/400/560" },
  { id: 4,  title: "Midnight Apothecary",          author: "Circe Arledenne",      price: "21.49", badge: "new",     cover: "https://picsum.photos/seed/midnightapo/400/560" },
  { id: 5,  title: "The Gilded Cage of Sorrows",   author: "Endymion Graven",      price: "28.99", badge: "new",     cover: "https://picsum.photos/seed/gildedcage/400/560" },
  { id: 6,  title: "Veil of Starless Nights",      author: "Seraphine Dusk",       price: "23.49", badge: null,      cover: "https://picsum.photos/seed/veilstarless/400/560" },
  { id: 7,  title: "The Bone Garden",              author: "Lux Mortem",           price: "26.99", badge: "new",     cover: "https://picsum.photos/seed/bonegarden/400/560" },
  { id: 8,  title: "Daughters of the Tide",        author: "Corinna Waveborn",     price: "20.99", badge: null,      cover: "https://picsum.photos/seed/tidedaughters/400/560" },
  { id: 9,  title: "The Oracle's Lament",          author: "Zephyr Ashvale",       price: "24.99", badge: "new",     cover: "https://picsum.photos/seed/oraclelament/400/560" },
  { id: 10, title: "Ink & Omen",                   author: "Thessaly Crane",       price: "18.99", badge: null,      cover: "https://picsum.photos/seed/inkomen/400/560" },
];

const NEW_ARRIVALS = [
  { id: 11, title: "The Starweaver's Daughter",     author: "Isadora Vives",     price: "21.99", badge: "new", cover: "https://picsum.photos/seed/starweaver/400/560" },
  { id: 12, title: "The Moonpetal Inn",              author: "Theodora Wren",    price: "18.99", badge: "new", cover: "https://picsum.photos/seed/moonpetal/400/560" },
  { id: 13, title: "Foxfire and Forgotten Names",   author: "Sable Marquees",   price: "20.49", badge: "new", cover: "https://picsum.photos/seed/foxfire/400/560" },
  { id: 14, title: "A Bouquet of Broken Spells",    author: "Isolde Fairleigh", price: "17.99", badge: "new", cover: "https://picsum.photos/seed/bouquetspells/400/560" },
  { id: 15, title: "The Cartographer of Nightmares",author: "Declan Vex",       price: "25.49", badge: "new", cover: "https://picsum.photos/seed/cartographer/400/560" },
  { id: 16, title: "The Hollow Forest",              author: "Sable Haze",       price: "22.99", badge: "new", cover: "https://picsum.photos/seed/hollowforest/400/560" },
  { id: 17, title: "Glass and Ether",                author: "Niamh Vray",       price: "19.99", badge: "new", cover: "https://picsum.photos/seed/glassether/400/560" },
  { id: 18, title: "The Last Oracle",                author: "Clio Pendrake",    price: "23.99", badge: "new", cover: "https://picsum.photos/seed/lastoracle/400/560" },
  { id: 19, title: "Mirrors of the Deep",            author: "Seren Cross",      price: "21.49", badge: "new", cover: "https://picsum.photos/seed/mirrorsdeep/400/560" },
  { id: 20, title: "The Runed Gate",                 author: "Elliot Asher",     price: "20.99", badge: "new", cover: "https://picsum.photos/seed/runedgate/400/560" },
];

// Additional per-book details keyed by book id
const BOOK_DETAILS = {
  1:  { description: "Set in Victorian London, this tale follows a mysterious woman who arrives at a grand estate, harboring secrets that could unravel the entire aristocracy.", tags: ["Victorian Gothic", "Dark Romance", "English"], isbn: "978-1-234567-91-3", year: "2023" },
  2:  { description: "In the witching hours of a cursed town, Morgana must outwit the coven elders before the next blood moon rises and the ancient spell is unleashed.", tags: ["Dark Fantasy", "Supernatural", "English"], isbn: "978-1-234567-92-0", year: "2022" },
  3:  { description: "A solitary amber witch living in the forest must decide whether to trust the stranger who arrives with a century-old curse etched into his palm.", tags: ["Gothic Horror", "Folklore", "English"], isbn: "978-1-234567-93-7", year: "2023" },
  4:  { description: "An apothecary's apprentice discovers the midnight remedies she brews are being stolen by shadowy forces who need them to reanimate the dead.", tags: ["Dark Fantasy", "Paranormal", "English"], isbn: "978-1-234567-94-4", year: "2024" },
  5:  { description: "Imprisoned in a gilded cage for crimes she did not commit, Lyra must outwit her captor before the next harvest moon condemns her soul forever.", tags: ["Gothic Horror", "Mystery", "English"], isbn: "978-1-234567-95-1", year: "2022" },
  6:  { description: "When the stars themselves go dark, the last seer must traverse a veil of starless nights to recover the stolen light before all hope fades.", tags: ["Dark Fantasy", "Supernatural", "English"], isbn: "978-1-234567-96-8", year: "2023" },
  7:  { description: "Deep beneath an ancient cemetery, a bone garden blooms anew every century—and the gardener is always someone who never wanted to die.", tags: ["Gothic Horror", "Supernatural", "English"], isbn: "978-1-234567-97-5", year: "2024" },
  8:  { description: "The ocean-born daughters of a tide goddess must choose between the sea and the shore when a siren's curse threatens to pull both worlds apart.", tags: ["Mythology", "Dark Romance", "English"], isbn: "978-1-234567-98-2", year: "2023" },
  9:  { description: "When the oracle falls silent, the only way to restore her voice is to journey through the graveyard of forgotten prophecies — alone.", tags: ["Dark Fantasy", "Mystery", "English"], isbn: "978-1-234567-99-9", year: "2024" },
  10: { description: "Every word inked by the cursed scribe turns into an omen. Now she must unwrite them all before the world bends to her worst fears.", tags: ["Gothic Horror", "Thriller", "English"], isbn: "978-1-234568-00-1", year: "2023" },
  11: { description: "The daughter of the star-weaver must mend the fraying threads of the night sky before the universe unravels into eternal darkness.", tags: ["Cozy Fantasy", "Fairy Tale", "English"], isbn: "978-1-234568-01-8", year: "2024" },
  12: { description: "An inn nestled between moonpetal meadows holds a peculiar guest registry — every name inside belongs to someone who has not yet arrived.", tags: ["Cozy Fantasy", "Mystery", "English"], isbn: "978-1-234568-02-5", year: "2024" },
  13: { description: "Foxfire leads the way through a forest of lost names, where the forgotten must reclaim their identities before the next dawn swallows them whole.", tags: ["Urban Fantasy", "Fairy Tale", "English"], isbn: "978-1-234568-03-2", year: "2024" },
  14: { description: "A young botanist finds that every broken spell leaves behind a flower — and someone has been collecting her failures for a very long time.", tags: ["Cozy Fantasy", "Dark Romance", "English"], isbn: "978-1-234568-04-9", year: "2024" },
  15: { description: "The royal cartographer maps the borders of nightmares to prevent them from bleeding into the waking world — until one dream refuses to be contained.", tags: ["Dark Fantasy", "Thriller", "English"], isbn: "978-1-234568-05-6", year: "2024" },
  16: { description: "In a hollow forest where sunlight never penetrates, a girl searches for the source of the whispers that have guided her since childhood.", tags: ["Gothic Horror", "Supernatural", "English"], isbn: "978-1-234568-06-3", year: "2024" },
  17: { description: "Elemental alchemists of glass and ether must forge the world's last lantern from grief and starlight before the abyss claims the final city.", tags: ["Dark Fantasy", "Historical", "English"], isbn: "978-1-234568-07-0", year: "2024" },
  18: { description: "The last oracle speaks only in riddles that begin to come true — and the latest one points unmistakably toward her own disappearance.", tags: ["Mystery", "Supernatural", "English"], isbn: "978-1-234568-08-7", year: "2024" },
  19: { description: "Ancient mirrors pulled from the ocean floor reflect not the present but the last moment their owner wished had never happened.", tags: ["Paranormal", "Dark Romance", "English"], isbn: "978-1-234568-09-4", year: "2024" },
  20: { description: "The runed gate opens only once per age — and the one chosen to pass through must leave everything they love behind on the other side.", tags: ["Dark Fantasy", "Historical", "English"], isbn: "978-1-234568-10-0", year: "2024" },
};

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

function BookCard({ book, onOpenDetail }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const badgeMap   = { new: "bc-new", pending: "bc-pending", ist: "bc-ist" };
  const badgeLabel = { new: "New",    pending: "Pending",    ist: "1 IST New" };

  function handleAdd(e) {
    e.stopPropagation();
    addToCart(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  }

  return (
    <article
      className="bc"
      onClick={() => onOpenDetail && onOpenDetail(book)}
      style={{ cursor: "pointer" }}
    >
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

function BookCarousel({ icon, title, subtitle, books, onOpenDetail, id }) {
  const [page, setPage] = useState(0);
  // Reset to first page whenever the books array changes
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
        {/* Fixed-slot rendering: keeps grid columns stable on the last page */}
        {Array.from({ length: PER_PAGE }).map((_, index) => {
          const book = visible[index];
          if (book) return <BookCard key={book.id} book={book} onOpenDetail={onOpenDetail} />;
          return <div key={`empty-${index}`} style={{ visibility: "hidden", minHeight: "1px" }} aria-hidden="true" />;
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
// BESTSELLER CAROUSEL
// ─────────────────────────────────────────────────────────────

function BestsellerCarousel({ books, onOpenDetail }) {
  const [idx, setIdx] = useState(0);
  const book = books[idx];

  return (
    <section className="sec">
      <h2 className="sec-title" style={{ marginBottom: "28px" }}>
        <span aria-hidden="true">⭐</span> Top Bestsellers
      </h2>

      <div className="bs-card">
        <button className="bs-arrow bs-arrow-l" onClick={() => setIdx((i) => i - 1)} disabled={idx === 0} aria-label="Previous bestseller">‹</button>

        <div className="bs-img-wrap">
          <img src={book.cover} alt={book.title} className="bs-img" />
          <span className="bs-badge">{book.badge}</span>
        </div>

        <div className="bs-content">
          <p className="bs-label">{book.label}</p>
          <h3 className="bs-title">{book.title}</h3>
          <p className="bs-author">{book.author}</p>
          <StarRating rating={book.rating} />
          <p className="bs-desc">{book.description}</p>
          <div className="bs-bottom">
            <span className="bs-price">${book.price}</span>
            <button className="btn-view" onClick={() => onOpenDetail && onOpenDetail(book)}>
              View Book
            </button>
          </div>
        </div>

        <button className="bs-arrow bs-arrow-r" onClick={() => setIdx((i) => i + 1)} disabled={idx === books.length - 1} aria-label="Next bestseller">›</button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOK DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function BookDetailModal({ book, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded]         = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
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

  const details = BOOK_DETAILS[book.id] ?? {
    description: "A captivating tale of mystery and intrigue in a world unlike any other.",
    tags: ["Fiction", "Dark Fiction"],
    isbn: "978-0-000000-00-0",
    year: "2023",
  };

  const conditionMap = {
    new:     { label: "NEW — Unused, pristine condition",  cls: "bdm-cond-new" },
    pending: { label: "LIKE-NEW — Excellent, minimal use", cls: "bdm-cond-used" },
    ist:     { label: "GOOD — Some wear, fully readable",  cls: "bdm-cond-good" },
  };
  const cond = conditionMap[book.badge] ?? conditionMap.new;

  const images = [
    book.cover,
    `https://picsum.photos/seed/${book.id}_int/400/560`,
    `https://picsum.photos/seed/${book.id}_alt/400/560`,
  ];

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} role="presentation">
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
            <img src={images[activeImg]} alt={book.title} className="bdm-main-img" />
          </div>

          <div className="bdm-thumbs">
            {images.map((img, i) => (
              <button key={i} className={`bdm-thumb${activeImg === i ? " active" : ""}`} onClick={() => setActiveImg(i)} aria-label={`View image ${i + 1}`}>
                <img src={img} alt={`View ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="bdm-details">
          <div>
            <h2 className="bdm-title" id="bdm-heading">{book.title}</h2>
            <p className="bdm-author">{book.author}</p>
          </div>

          <span className={`bdm-condition ${cond.cls}`}>{cond.label}</span>

          <div className="bdm-stars-price">
            <StarRating rating={book.rating ?? 4.9} />
            <span className="bdm-price">${book.price}</span>
          </div>

          <div className="bdm-tags">
            {details.tags.map((t) => <span key={t} className="bdm-tag">{t}</span>)}
          </div>

          <div>
            <p className="bdm-desc-heading">Description</p>
            <p className="bdm-desc-text">{details.description}</p>
          </div>

          <div className="bdm-meta">
            <div>
              <p className="bdm-meta-lbl">ISBN</p>
              <p className="bdm-meta-val">{details.isbn}</p>
            </div>
            <div>
              <p className="bdm-meta-lbl">Published</p>
              <p className="bdm-meta-val">{details.year}</p>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {added ? "Added to Cart!" : "Add to Cart"}
            </button>
            <button className={`bdm-wishlist-action${wishlisted ? " active" : ""}`} onClick={() => setWishlisted((w) => !w)} aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            aria-label={`Max price: ${priceMax}`}
          />
          <div className="fp-price-row">
            <span>$0</span>
            <span>Up to ${priceMax}</span>
          </div>
        </div>

        <div className="fp-section">
          <p className="fp-lbl">Genre</p>
          {genresLoading ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>Loading...</p>
          ) : availableGenres.length === 0 ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>No genres found</p>
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
// HOME PAGE
// ─────────────────────────────────────────────────────────────

function Home() {
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");

  const [filters, setFilters] = useState({
    priceMax:   100,
    genres:     new Set(),
    conditions: new Set(),
    languages:  new Set(),
  });

  function handleSearchSubmit(e) {
    e.preventDefault();
    // No-op with mock data; wire to API when backend is ready
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
            availableGenres={GENRES}
            genresLoading={false}
          />

          <div className="sections-area">
            <BestsellerCarousel books={BESTSELLERS} onOpenDetail={setSelectedBook} />

            <BookCarousel
              id="popular-section"
              icon="↗"
              title="Most Popular"
              subtitle="Beloved by readers across the archive"
              books={POPULAR}
              onOpenDetail={setSelectedBook}
            />

            <BookCarousel
              id="new-arrivals-section"
              icon="✦"
              title="New Arrivals"
              subtitle="Just added — fresh discoveries await"
              books={NEW_ARRIVALS}
              onOpenDetail={setSelectedBook}
            />
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
