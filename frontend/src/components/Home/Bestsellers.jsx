import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import "./Styles/bestseller-carousel.css"

const API_URL = import.meta.env.VITE_API_URL;

const COLUMN_BREAKPOINTS = [
  { maxWidth: 520,  columns: 2 },
  { maxWidth: 800,  columns: 3 },
  { maxWidth: 1100, columns: 4 },
];

function getResponsiveColumns(width) {
  for (const bp of COLUMN_BREAKPOINTS) {
    if (width <= bp.maxWidth) return bp.columns;
  }
  return 5;
}

export function useResponsiveColumns() {
  const [columns, setColumns] = useState(() =>
    typeof window !== "undefined" ? getResponsiveColumns(window.innerWidth) : 5
  );

  useEffect(() => {
    function handleResize() {
      setColumns(getResponsiveColumns(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return columns;
}

const DoubleChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 17-5-5 5-5M11 17l-5-5 5-5"/>
  </svg>
);

const DoubleChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 17 5-5-5-5M13 17l5-5-5-5"/>
  </svg>
);

function buildPageWindow(current, total, windowSize = 1) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages = new Set([0, total - 1, current]);
  for (let d = 1; d <= windowSize; d++) {
    if (current - d >= 0) pages.add(current - d);
    if (current + d <= total - 1) pages.add(current + d);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

function PageDots({ page, total, onPageChange }) {
  if (total <= 1) return null;
  const items = buildPageWindow(page, total, 1);
  const goTo = (p) => onPageChange(Math.max(0, Math.min(total - 1, p)));

  return (
    <div className="c-dots" role="tablist">
      {total > 7 && (
        <button type="button" className="c-dot-jump" onClick={(e) => { e.currentTarget.blur(); goTo(0); }} disabled={page === 0} aria-label="First page">
          <DoubleChevronLeft />
        </button>
      )}
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`ellipsis-${i}`} className="c-dot-ellipsis" aria-hidden="true">···</span>
        ) : (
          <button type="button" key={item} className={`c-dot${item === page ? " on" : ""}`}
            onClick={(e) => { e.currentTarget.blur(); goTo(item); }} role="tab"
            aria-selected={item === page} aria-label={`Page ${item + 1}`} />
        )
      )}
      {total > 7 && (
        <button type="button" className="c-dot-jump" onClick={(e) => { e.currentTarget.blur(); goTo(total - 1); }} disabled={page === total - 1} aria-label="Last page">
          <DoubleChevronRight />
        </button>
      )}
    </div>
  );
}

// rows: how many rows of cards per page (Home's "Others" uses 2, a related-books rail can use 1)
function BookCarousel({ icon, title, subtitle, books, id, rows = 2, onOpenDetail }) {
  const columns = useResponsiveColumns();
  const itemsPerPage = columns * rows;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [books, itemsPerPage]);
  if (!books.length) return null;

  const total   = Math.ceil(books.length / itemsPerPage);
  const visible = books.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <section className="sec" id={id}>
      <div className="sec-head">
        <div>
          {title && (
            <h2 className="sec-title">
              {icon && <span aria-hidden="true">{icon}</span>}
              {title}
            </h2>
          )}
          {subtitle && <p className="sec-sub">{subtitle}</p>}
        </div>
        {total > 1 && (
          <div className="sec-nav">
            <span className="page-lbl">{page + 1} / {total}</span>
            <button type="button" className="arr-btn" onClick={(e) => { e.currentTarget.blur(); setPage((p) => p - 1); }} disabled={page === 0} aria-label="Previous page">‹</button>
            <button type="button" className="arr-btn" onClick={(e) => { e.currentTarget.blur(); setPage((p) => p + 1); }} disabled={page === total - 1} aria-label="Next page">›</button>
          </div>
        )}
      </div>

      <div className="book-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, auto)` }}>
        {Array.from({ length: itemsPerPage }).map((_, index) => {
          const book = visible[index];
          if (book) return <BookCard key={book.id} book={book} onOpenDetail={onOpenDetail} />;
          return <div key={`empty-${index}`} style={{ visibility: "hidden", minHeight: "1px" }} aria-hidden="true" />;
        })}
      </div>

      <PageDots page={page} total={total} onPageChange={setPage} />
    </section>
  );
}

export default BookCarousel;