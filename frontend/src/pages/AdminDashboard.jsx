import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─────────────────────────────────────────────────────────────
// INLINE SVG ICONS
// ─────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const BarChartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
);
const NfListingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const NfFlagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const NfSaleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const TrendLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);
const ArrowUpRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
);
const DollarSignIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const REJECT_PRESETS = [
  'ყდა არ შეესაბამება წიგნის სათაურს.',
  'ფასი ზედმეტად მაღალია.',
  'დუბლირებული განცხადება — ეს წიგნი უკვე დამატებულია.',
  'ISBN არასწორია ან აკლია — გთხოვთ გადაამოწმოთ.',
  'აღწერა ზედმეტად მოკლეა ან არ შეიცავს საკმარის ინფორმაციას.',
  'ფოტოების ხარისხი ძალიან დაბალია.'
];

const REVENUE_BARS = [
  { label: "Jan", pct: 44 },
  { label: "Feb", pct: 55 },
  { label: "Mar", pct: 60 },
  { label: "Apr", pct: 66 },
  { label: "May", pct: 71 },
  { label: "Jun", pct: 100, highlight: true },
];

const GENRE_POPULARITY = [
  { label: "Gothic Horror",    pct: 82 },
  { label: "Dark Fantasy",     pct: 74 },
  { label: "Victorian Gothic", pct: 61 },
  { label: "Mystery",          pct: 55 },
];

const TOP_BOOKS_FINANCE = [
  { rank: 1, title: "The Shadow of the Raven",  author: "Eleonora Blackwood",  price: "$24.99", cover: "https://picsum.photos/seed/shadowraven/200/280" },
  { rank: 2, title: "Whispers in the Dark",      author: "Marcus Nightshade",   price: "$19.99", cover: "https://picsum.photos/seed/whispersdark/200/280" },
];

// ─────────────────────────────────────────────────────────────
// BOOK REVIEW CARD
// ─────────────────────────────────────────────────────────────
function BookReviewCard({ book, onApprove, onReject, onSelect, busy }) {
  const condClass = {
    new:     "ad-cond-new",
    good:    "ad-cond-good",
    average: "ad-cond-fair",
    damaged: "ad-cond-fair",
  }[book.condition] ?? "ad-cond-good";

  const cover = book.photos_urls?.[0];

  return (
    <article className="ad-book-card">
      {cover ? (
        <img src={cover} alt={book.title} className="ad-book-cover" loading="lazy" />
      ) : (
        <div className="ad-book-cover" style={{ background: "#2d3748" }} aria-hidden="true" />
      )}
      <div className="ad-book-body">
        <div className="ad-book-top">
          <div>
            <h3 className="ad-book-title">{book.title}</h3>
            {book.seller?.username && (
              <p className="ad-book-listed">
                Listed by <span className="ad-listed-name">{book.seller.username}</span>
                {book.seller.location ? ` · ${book.seller.location}` : ""}
              </p>
            )}
          </div>
          <div className="ad-book-actions">
            <button className="ad-approve-btn" onClick={() => onApprove(book.id)} disabled={busy} aria-label={`Approve ${book.title}`}>
              <CheckIcon /> Approve
            </button>
            <button className="ad-reject-btn" onClick={() => onReject(book.id)} disabled={busy} aria-label={`Reject ${book.title}`}>
              <XIcon /> Reject
            </button>
          </div>
        </div>

        <p className="ad-book-desc">{book.description}</p>
        
        <div className="ad-book-tags">
          <span className={`ad-tag ${condClass}`}>{book.condition}</span>
          <span className="ad-tag ad-price-tag">${book.price}</span>
          {(book.genres ?? []).map((g) => (
            <span key={g} className="ad-tag ad-genre-tag">{g}</span>
          ))}
        </div>

        <div className="ad-book-footer" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(0, 0, 0, 0.06)"
        }}>
          {book.created_at ? (
            <p className="ad-book-date" style={{ margin: 0 }}>
              Submitted {new Date(book.created_at).toLocaleString()}
            </p>
          ) : <div />}
          
          <button 
            type="button"
            onClick={onSelect}
            className="ad-details-link"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "var(--accent, #3b82f6)"
            }}
          >
            დეტალურად &rarr;
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// ALL BOOKS TABLE
// ─────────────────────────────────────────────────────────────
function AllBooksTable({ books }) {
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            <th className="ad-th ad-th-cover">Cover</th>
            <th className="ad-th">Title</th>
            <th className="ad-th ad-th-r">Price</th>
            <th className="ad-th">Condition</th>
            <th className="ad-th">Genres</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} className="ad-tr">
              <td className="ad-td ad-td-cover">
                {book.photos_urls?.[0] && (
                  <img src={book.photos_urls[0]} alt={book.title} className="ad-table-cover" loading="lazy" />
                )}
              </td>
              <td className="ad-td"><span className="ad-td-title">{book.title}</span></td>
              <td className="ad-td ad-td-r"><span className="ad-td-price">${book.price}</span></td>
              <td className="ad-td">{book.condition}</td>
              <td className="ad-td">{(book.genres ?? []).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS PANEL — User-based suspicious activity (NEW)
// საეჭვო მომხმარებლები — ბევრი request-ი + block/unban
// ─────────────────────────────────────────────────────────────
function ReportsPanel({ users, loading, onRefresh, onBlock, onUnban, onViewLogs, busyUserId }) {
  const unbannedSuspicious = users.filter(u => !u.is_banned);

  return (
    <>
      <div className="rp-filter-row">
        <span className="rp-open-count">
          {loading
            ? "Checking suspicious users..."
            : `${unbannedSuspicious.length} suspicious user${unbannedSuspicious.length !== 1 ? "s" : ""} in the last hour`}
        </span>
        <button className="rp-filter-btn" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="rp-list">
        {!loading && users.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-2)", fontSize: "0.85rem" }}>
            No suspicious users in the last hour.
          </p>
        ) : (
          users.map((u) => (
            <div key={u.user_id} className="rp-card">
              <div className="rp-alert-icon" style={{ color: u.is_banned ? "#fc8181" : "var(--accent)" }}>
                <NfFlagIcon />
              </div>
              <div className="rp-body" style={{ flex: 1 }}>
                <div className="rp-top-row">
                  <div className="rp-user-line" style={{ flexWrap: "wrap", gap: 6 }}>
                    <span className="rp-username">{u.username}</span>
                    <span className="rp-badge rp-badge-open">HIGH TRAFFIC</span>
                    <span className="rp-flag-count">{u.request_count} requests/hr</span>
                    {u.is_banned && (
                      <span className="rp-badge" style={{ background: "#7f1d1d", color: "#fca5a5", border: "1px solid #fca5a5" }}>
                        BANNED
                      </span>
                    )}
                  </div>
                </div>
                <p className="rp-desc" style={{ marginTop: 4 }}>{u.email}</p>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    className="rp-filter-btn"
                    onClick={() => onViewLogs(u.username)}
                    style={{ fontSize: "0.8rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <FileIcon /> Logs
                  </button>
                  {u.is_banned ? (
                    <button
                      className="ad-approve-btn"
                      disabled={busyUserId === u.user_id}
                      onClick={() => onUnban(u.user_id)}
                      aria-label={`Unban ${u.username}`}
                    >
                      <CheckIcon /> განბლოკვა
                    </button>
                  ) : (
                    <button
                      className="ad-reject-btn"
                      disabled={busyUserId === u.user_id}
                      onClick={() => onBlock(u.user_id)}
                      aria-label={`Block ${u.username}`}
                    >
                      <XIcon /> დაბლოკვა
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function AdminBookDetailModal({ book, onClose, onApprove, onReject }) {
  const [editTitle, setEditTitle] = useState(book.title || "");
  const [editCondition, setEditCondition] = useState(book.condition || "good");
  const [editGenres, setEditGenres] = useState((book.genres || []).join(", "));

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

  const cover = book.photos_urls?.[0] ?? book.cover;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="bdm-card" role="dialog" aria-modal="true" aria-labelledby="bdm-heading">
        <button className="modal-x bdm-close" onClick={onClose} aria-label="Close details">
          <XIcon size={16} />
        </button>

        <div className="bdm-gallery">
          <div className="bdm-main-img-wrap">
            <img src={cover} alt={editTitle} className="bdm-main-img" />
          </div>
        </div>

        <div className="bdm-details">
          {/* რედაქტირებადი სათაური - ლოგების ინპუტის სტილით */}
          <div>
            <label className="text-xs" style={{ color: "var(--text-3, #718096)" }}>Title (Editable)</label>
            <div className="lg-search-row mt-1">
              <input 
                type="text"
                className="lg-search-input w-full"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="წიგნის სათაური"
              />
            </div>
            <p className="bdm-author mt-2">{book.author || "—"}</p>
          </div>

          {/* Condition-ის ველი (ლოგების სტილის გარსით) */}
          <div className="mt-3">
             <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>Condition</label>
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

          <div className="bdm-stars-price mt-3">
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

          {/* რედაქტირებადი ჟანრები - ლოგების ინპუტის სტილით */}
          <div className="mt-3">
             <label className="text-xs block mb-1" style={{ color: "var(--text-3, #718096)" }}>Genres (comma separated)</label>
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
            <p className="bdm-desc-heading">Description</p>
            <p className="bdm-desc-text">{book.description ?? "No description available yet."}</p>
          </div>

          {/* ადმინის მოქმედებები */}
          <div className="bdm-actions mt-4 flex gap-2">
            <button 
              className="bdm-add-cart" 
              style={{ backgroundColor: "#10b981", color: "#fff", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              onClick={() => onApprove(book.id, {
                title: editTitle,
                condition: editCondition,
                genres: editGenres.split(",").map(g => g.trim()).filter(Boolean)
              })}
            >
              <CheckIcon size={14} /> Approve & Save
            </button>
            <button 
              className="bdm-wishlist-action" 
              style={{ backgroundColor: "#ef4444", color: "#fff", flex: 1, borderRadius: "8px", padding: "10px", fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
              onClick={() => onReject(book)}
            >
              <XIcon size={14} /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGS PANEL — real data from /admin/audit-logs, nginx-style format
// ─────────────────────────────────────────────────────────────
export function LogsPanel({ initialQuery = "" }) {
  // 1. State-ები
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // 2. initialQuery-ს ცვლილებაზე რეაგირება
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // 3. ლოგების წამოღება ბექენდიდან
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/admin/audit-logs`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data.logs) ? data.logs : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  // 4. როცა ძებნის ტექსტი (query) იცვლება, ვბრუნდებით პირველ გვერდზე
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // 5. დამხმარე ფორმატირების ფუნქციები
  function formatNginxDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const tz = d.toTimeString().match(/GMT([+-]\d{4})/)?.[1] ?? "+0000";
    return `[${day}/${month}/${year}:${hh}:${mm}:${ss} ${tz}]`;
  }

  function methodStyle(method = "") {
    const m = method.toUpperCase();
    if (m === "POST") return { backgroundColor: "rgba(72, 187, 120, 0.15)", color: "#48bb78", border: "1px solid rgba(72, 187, 120, 0.3)" };
    if (m === "PUT") return { backgroundColor: "rgba(236, 201, 75, 0.15)", color: "#ecc94b", border: "1px solid rgba(236, 201, 75, 0.3)" };
    if (m === "DELETE") return { backgroundColor: "rgba(245, 101, 101, 0.15)", color: "#f56565", border: "1px solid rgba(245, 101, 101, 0.3)" };
    if (m === "GET") return { backgroundColor: "rgba(66, 153, 225, 0.15)", color: "#4299e1", border: "1px solid rgba(66, 153, 225, 0.3)" };
    return { backgroundColor: "rgba(160, 174, 192, 0.15)", color: "#a0aec0", border: "1px solid rgba(160, 174, 192, 0.3)" };
  }

  function statusColor(code) {
    if (!code) return "var(--text-3)";
    if (code >= 500) return "#fc8181";
    if (code >= 400) return "#f0c674";
    if (code >= 300) return "#63b3ed";
    return "#8fbc8f";
  }

  // 6. ფილტრაციის ლოგიკა (ჯერ ითვლება ფილტრი)
  const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filtered = searchTerms.length > 0
    ? logs.filter((log) => {
        const id = String(log.id || "");
        const userId = String(log.user_id || "");
        const username = (log.username || log.users?.username || "").toLowerCase();
        const ip = (log.ip_address || "").toLowerCase();
        const timestamp = formatNginxDate(log.created_at).toLowerCase();
        const statusCode = String(log.status_code || "").toLowerCase();
        const method = (log.method || "").toLowerCase();
        const path = (log.path || "").toLowerCase();
        const userAgent = (log.user_agent || "").toLowerCase();
        const metadata = (log.metadata ? JSON.stringify(log.metadata) : "").toLowerCase();

        const searchableText = `${id} ${userId} ${username} ${ip} ${timestamp} ${statusCode} ${method} ${path} ${userAgent} ${metadata}`;
        return searchTerms.every((term) => searchableText.includes(term));
      })
    : logs;

  // 7. პაგინაციის დათვლა (მას შემდეგ, რაც `filtered` უკვე გამოითვალა!)
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 8. პაგინაციის UI კომპონენტი
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", margin: "16px 0", flexWrap: "wrap" }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ padding: "6px 12px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-1)" }}
        >
          &larr; Prev
        </button>
        
        {getPageNumbers().map((p, i) => (
          <button
            key={i}
            onClick={() => p !== "..." && handlePageChange(p)}
            disabled={p === "..."}
            style={{
              padding: "6px 10px",
              cursor: p === "..." ? "default" : "pointer",
              backgroundColor: p === currentPage ? "var(--accent)" : "var(--bg-2)",
              color: p === currentPage ? "#fff" : "var(--text-1)",
              border: p === "..." ? "none" : "1px solid var(--border)",
              borderRadius: "4px",
              fontWeight: p === currentPage ? "bold" : "normal"
            }}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ padding: "6px 12px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-1)" }}
        >
          Next &rarr;
        </button>
      </div>
    );
  };

  // 9. რენდერი
  return (
    <>
      <div className="lg-search-row">
        <input
          type="text"
          className="lg-search-input"
          placeholder="გაფილტრეთ სვეტების მნიშვნელობების შეყვანით"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter logs"
        />
        <span className="lg-entry-count">{filtered.length} entries</span>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px" }}>იტვირთება...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-2)", fontSize: "0.85rem" }}>
          {query ? "No matching log entries." : "No audit logs found."}
        </p>
      ) : (
        <div>
          {/* ზედა პაგინაცია */}
          <PaginationControls />

          <div className="ad-table-wrap" style={{ overflowX: "auto", width: "100%" }}>
            <table className="ad-table lg-table" style={{ minWidth: 1800, width: "100%" }}>
              <thead>
                <tr>
                  <th className="ad-th" style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>Timestamp</th>
                  <th className="ad-th" style={{ fontFamily: "monospace" }}>IP</th>
                  <th className="ad-th">User ID</th>
                  <th className="ad-th">Username</th>
                  <th className="ad-th" style={{ textAlign: "center" }}>Method</th>
                  <th className="ad-th">Path</th>
                  <th className="ad-th" style={{ textAlign: "center" }}>Status</th>
                  <th className="ad-th">User Agent</th>
                  <th className="ad-th">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((log) => {
                  const metaStr = log.metadata
                    ? typeof log.metadata === "object"
                      ? JSON.stringify(log.metadata)
                      : String(log.metadata)
                    : "—";

                  return (
                    <tr key={log.id} className="ad-tr">
                      <td className="ad-td" style={{ fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "nowrap", color: "var(--text-2)" }}>
                        {formatNginxDate(log.created_at)}
                      </td>
                      <td className="ad-td" style={{ fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {log.ip_address || "—"}
                      </td>
                      <td className="ad-td" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-3)" }}>
                        {log.user_id ? `#${log.user_id}` : "—"}
                      </td>
                      <td className="ad-td" style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                        {log.username || log.users?.username ? (
                          <span style={{ color: "var(--accent)" }}>{log.username || log.users?.username}</span>
                        ) : (
                          <span style={{ color: "var(--text-3)" }}>—</span>
                        )}
                      </td>
                      <td className="ad-td" style={{ textAlign: "center" }}>
                        {log.method ? (
                          <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace", ...methodStyle(log.method) }}>
                            {log.method.toUpperCase()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="ad-td" style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-1)" }}>
                        {log.path || "—"}
                      </td>
                      <td className="ad-td" style={{ textAlign: "center" }}>
                        {log.status_code ? (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: statusColor(log.status_code) }}>
                            {log.status_code}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="ad-td" title={log.user_agent || ""} style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--text-3)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.user_agent || "—"}
                      </td>
                      <td className="ad-td" title={metaStr} style={{ fontSize: "0.74rem", fontFamily: "monospace", color: "var(--text-2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {metaStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ქვედა პაგინაცია */}
          <PaginationControls />
        </div>
      )}
    </>
  );
}

export function FinancePanel() {
  const [stats, setStats] = useState(null);
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // პარალელურად მოგვაქვს ორივე ენდფოინთის მონაცემები
    Promise.all([
      fetch(`${API_URL}/admin/finance-stats`, { headers: authHeaders() }).then((res) => res.ok ? res.json() : null),
      fetch(`${API_URL}/feed/popular`).then((res) => res.ok ? res.json() : null)
    ])
      .then(([statsData, popularData]) => {
        if (statsData) setStats(statsData);

        // დებაგისთვის (შეგიძლია კონსოლში ნახო ზუსტი სტრუქტურა)
        console.log("Popular endpoint response:", popularData);

        let booksArray = [];

        if (Array.isArray(popularData)) {
          booksArray = popularData;
        } else if (popularData && Array.isArray(popularData.items)) {
          booksArray = popularData.items;
        } else if (popularData && Array.isArray(popularData.books)) {
          booksArray = popularData.books;
        } else if (popularData && Array.isArray(popularData.data)) {
          booksArray = popularData.data;
        }

        // ვიღებთ მხოლოდ პირველ 2 წიგნს
        setTopBooks(booksArray.slice(0, 2));
      })
      .catch((err) => console.error("Error fetching finance data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: "40px" }}>იტვირთება ფინანსური მონაცემები...</p>;
  if (!stats) return <p style={{ textAlign: "center", padding: "40px", color: "#fc8181" }}>მონაცემების ჩატვირთვა ვერ მოხერხდა.</p>;

  // ჩარტის Y ღერძის მაქსიმალური მნიშვნელობის გამოთვლა
  const maxAmount = Math.max(...stats.revenue_chart.map(b => b.amount), 0);
  // თუ ჯერ ტრანზაქციები არ გვაქვს (max = 0), ვიზუალისთვის ავიღოთ 100, რომ ჩარტი არ დამახინჯდეს
  const yMax = maxAmount > 0 ? maxAmount : 100; 

  return (
    <div className="fn-root">
      <div className="fn-top-grid">
        {/* REVENUE CHART */}
        <div className="fn-card fn-revenue-card">
          <div className="fn-rev-header">
            <div>
              <p className="fn-card-title">Platform Revenue</p>
              <p className="fn-card-sub">Last 6 months</p>
            </div>
            {/* აქ შეგიძლიათ MoM (Month-over-Month) ლოგიკაც დინამიური გახადოთ ბექენდიდან მოწოდებით */}
            <span className="fn-mom-badge">+0% MoM</span>
          </div>
          
          <div className="fn-chart-container" style={{ display: "flex", gap: "12px", height: "180px", marginTop: "16px" }}>
            {/* Y Axis (თანხები 0-დან max-მდე) */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", color: "var(--text-3)", fontSize: "0.75rem", textAlign: "right", paddingBottom: "24px" }}>
              <span>${yMax.toLocaleString()}</span>
              <span>${(yMax / 2).toLocaleString()}</span>
              <span>$0</span>
            </div>

            {/* Bars */}
            <div className="fn-bar-chart" aria-label="Monthly revenue bar chart" style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "8%", paddingBottom: "24px", position: "relative" }}>
              {stats.revenue_chart.map((bar, index) => {
                const heightPct = (bar.amount / yMax) * 100;
                // ბოლო თვე გავაფერადოთ როგორც highlight
                const isHighlight = index === stats.revenue_chart.length - 1; 

                return (
                  <div key={bar.label} className="fn-bar-col" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative" }}>
                    <div className="fn-bar-track" style={{ width: "100%", height: "100%", backgroundColor: "var(--bg-2)", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
                      <div className={`fn-bar${isHighlight ? " fn-bar-hi" : ""}`} style={{ height: `${heightPct}%`, width: "100%", backgroundColor: isHighlight ? "var(--accent)" : "var(--text-3)", position: "absolute", bottom: 0, transition: "height 0.3s ease" }} />
                    </div>
                    <span className="fn-bar-label" style={{ position: "absolute", bottom: "-24px", fontSize: "0.75rem", color: "var(--text-2)" }}>{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="fn-stats-col">
          <div className="fn-card fn-stat-card">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Total Transactions</p>
              {/* აქ ვწერთ Completed Book Requests რაოდენობას */}
              <p className="fn-stat-val">{stats.total_transactions}</p> 
            </div>
            <div className="fn-stat-icon"><TrendLineIcon /></div>
          </div>
          <div className="fn-card fn-stat-card fn-stat-green">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Active Sellers</p>
              <p className="fn-stat-val">{stats.active_sellers}</p>
            </div>
            <div className="fn-stat-icon fn-icon-green"><ArrowUpRightIcon /></div>
          </div>
          <div className="fn-card fn-stat-card fn-stat-gold">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Platform Fee Earned</p>
              <p className="fn-stat-val fn-val-gold">${stats.platform_fee.toFixed(2)}</p>
            </div>
            <div className="fn-stat-icon fn-icon-gold"><DollarSignIcon /></div>
          </div>
        </div>
      </div>

      <div className="fn-bottom-grid">
        {/* GENRE POPULARITY */}
        <div className="fn-card fn-genre-card">
          <p className="fn-card-title">Genre Popularity</p>
          <div className="fn-genre-list">
            {stats.genres.map((g) => (
              <div key={g.label} className="fn-genre-row">
                <span className="fn-genre-lbl">{g.label}</span>
                <div className="fn-prog-track" role="progressbar" aria-valuenow={g.pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="fn-prog-fill" style={{ width: `${g.pct}%` }} />
                </div>
                <span className="fn-genre-pct">{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOP BOOKS (From /feed/popular) */}
        <div className="fn-card fn-topbooks-card">
          <p className="fn-card-title">Top Performing Books</p>
          {topBooks.length > 0 ? (
            <ol className="fn-book-list">
              {topBooks.map((item, index) => {
                // 🔍 იღებს მონაცემებს book_data-დან
                const b = item.book_data || item;

                // 🖼️ პირველი ფოტოს ამოღება photos_urls მასივიდან
                const coverImg = 
                  (Array.isArray(b.photos_urls) && b.photos_urls[0]) || 
                  "/placeholder-book.png";

                return (
                  <li key={b.id || index} className="fn-book-row">
                    <span className="fn-book-rank">#{index + 1}</span>
                    <img 
                      src={coverImg} 
                      alt={b.title || "Book"} 
                      className="fn-book-cover" 
                      loading="lazy" 
                      onError={(e) => { e.target.src = "/placeholder-book.png"; }} 
                    />
                    <div className="fn-book-info">
                      <p className="fn-book-title">{b.title}</p>
                      <p className="fn-book-author">{b.author || "—"}</p>
                    </div>
                    <span className="fn-book-price">₾{b.price}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p style={{ color: "var(--text-3)", fontSize: "0.85rem", marginTop: "16px" }}>
              ჯერ წიგნები არ არის.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function TabEmpty({ icon, title, sub }) {
  return (
    <div className="ad-empty">
      <div className="ad-empty-icon">{icon}</div>
      <p className="ad-empty-title">{title}</p>
      <p className="ad-empty-sub">{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [logsFilterQuery, setLogsFilterQuery] = useState(""); // ლოგების ფილტრის state

  // Pending Review
  const [pendingBooks, setPendingBooks]     = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError]     = useState(null);
  const [busyBookId, setBusyBookId]         = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null); // ინახავს წიგნის ობიექტს
  const [rejectNote, setRejectNote] = useState('');
  const [rejectPreset, setRejectPreset] = useState('');
  const [selectedAdminBook, setSelectedAdminBook] = useState(null); // მოდალისთვის
  const [logsSearch, setLogsSearch] = useState(''); // ლოგების ფილტრისთვის

  // All Books
  const [allBooks, setAllBooks]             = useState([]);
  const [allBooksLoading, setAllBooksLoading] = useState(true);

  // Reports (user-based — NEW)
  const [suspiciousUsers, setSuspiciousUsers]       = useState([]);
  const [suspiciousLoading, setSuspiciousLoading]   = useState(true);
  const [busyUserId, setBusyUserId]                 = useState(null);

  // ფუნქცია, რომელიც გადაგვიყვანს Logs ტაბზე არჩეული იუზერით
  function handleViewUserLogs(username) {
    setLogsFilterQuery(username);
    setActiveTab("logs");
  }

  // ── Fetch functions ───────────────────────────────────────

  function fetchPendingBooks() {
    setPendingLoading(true);
    setPendingError(null);
    fetch(`${API_URL}/admin/pending-books`, { headers: authHeaders() })
      .then((res) => { if (!res.ok) throw new Error("Failed to load pending books"); return res.json(); })
      .then((data) => setPendingBooks(Array.isArray(data) ? data : []))
      .catch((e) => setPendingError(e.message))
      .finally(() => setPendingLoading(false));
  }

  function fetchAllBooks() {
    setAllBooksLoading(true);
    fetch(`${API_URL}/books`)
      .then((res) => res.json())
      .then((data) => setAllBooks(Array.isArray(data) ? data : []))
      .catch(() => setAllBooks([]))
      .finally(() => setAllBooksLoading(false));
  }

  function fetchSuspiciousUsers() {
    setSuspiciousLoading(true);
    fetch(`${API_URL}/admin/suspicious_users`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => setSuspiciousUsers(data.suspicious_users ?? []))
      .catch(() => setSuspiciousUsers([]))
      .finally(() => setSuspiciousLoading(false));
  }

  useEffect(() => {
    fetchPendingBooks();
    fetchAllBooks();
    fetchSuspiciousUsers();
  }, []);

  // ── Book approve / reject ─────────────────────────────────

  const handleApprove = async (bookId, updatedData = {}) => {
    setBusyBookId(bookId);
    try {
      const res = await fetch(`${API_URL}/admin/review-book`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: bookId,
          status: "active", // ვადებთ აქტიურ სტატუსს
          ...updatedData,    // title, condition, genres (თუ შეიცვალა)
        }),
      });

      if (!res.ok) throw new Error("ვერ მოხერხდა დადასტურება");

      // სიიდან ამოშლა
      setPendingBooks((prev) => prev.filter((b) => b.id !== bookId));
      setSelectedAdminBook(null); // მოდალის დახურვა
    } catch (err) {
      console.error(err);
      alert("შეცდომა წიგნის დადასტურებისას.");
    } finally {
      setBusyBookId(null);
    }
  };

  const handleQuickApprove = async (bookId) => {
    setBusyBookId(bookId);
    try {
      const res = await fetch(`${API_URL}/admin/review-book`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: bookId,
          status: "active",
        }),
      });

      if (!res.ok) throw new Error("ვერ მოხერხდა დადასტურება");

      setPendingBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error(err);
      alert("შეცდომა წიგნის დადასტურებისას.");
    } finally {
      setBusyBookId(null);
    }
  };

  const handleRejectSubmit = async (bookId, rejectionReason) => {
    setBusyBookId(bookId);
    try {
      const res = await fetch(`${API_URL}/admin/review-book`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: bookId,
          status: "rejected",
          rejection_reason: rejectionReason,
        }),
      });

      if (!res.ok) throw new Error("ვერ მოხერხდა უარყოფა");

      setPendingBooks((prev) => prev.filter((b) => b.id !== bookId));
      setRejectTarget(null);       // უარყოფის მოდალის დახურვა
      setSelectedAdminBook(null);  // დეტალების მოდალის დახურვა (თუ ღია იყო)
    } catch (err) {
      console.error(err);
      alert("შეცდომა წიგნის უარყოფისას.");
    } finally {
      setBusyBookId(null);
    }
  };

  // ── User block / unban (NEW) ──────────────────────────────

  async function handleBlockUser(userId) {
    setBusyUserId(userId);
    try {
      const res = await fetch(`${API_URL}/admin/ban-user/${userId}`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setSuspiciousUsers((prev) =>
        prev.map((u) => u.user_id === userId ? { ...u, is_banned: true } : u)
      );
    } catch {
      alert("დაბლოკვა ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleUnbanUser(userId) {
    setBusyUserId(userId);
    try {
      const res = await fetch(`${API_URL}/admin/unban-user/${userId}`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setSuspiciousUsers((prev) =>
        prev.map((u) => u.user_id === userId ? { ...u, is_banned: false } : u)
      );
    } catch {
      alert("განბლოკვა ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setBusyUserId(null);
    }
  }

  // ── Tabs ──────────────────────────────────────────────────

  const unbannedSuspicious = suspiciousUsers.filter((u) => !u.is_banned);

  const TABS = [
    { id: "pending",       label: "Pending Review",  Icon: ClockIcon,    badge: pendingBooks.length || null },
    { id: "all",           label: "All Books",       Icon: BookIcon,     badge: null },
    { id: "reports",       label: "Reports",         Icon: NfFlagIcon,   badge: unbannedSuspicious.length || null },
    { id: "logs",          label: "Logs",            Icon: FileIcon,     badge: null },
    { id: "finance",       label: "Finance",         Icon: BarChartIcon, badge: null },
  ];

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main className="ad-page">
        <div className="ad-header">
          <div className="ad-title-group">
            <svg className="ad-shield-svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <h1 className="ad-page-title">Admin Dashboard</h1>
              <p className="ad-page-sub">Manage listings, sellers, and platform activity</p>
            </div>
          </div>
          <span className="ad-admin-badge">Administrator</span>
        </div>

        <nav className="ad-tabs" aria-label="Admin sections">
          {TABS.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              className={`ad-tab${activeTab === id ? " active" : ""}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon />
              {label}
              {badge != null && badge > 0 && <span className="ad-tab-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="ad-content">
          {/* Pending Review */}
          {activeTab === "pending" && (
            pendingLoading ? (
              <p style={{ textAlign: "center", padding: "40px" }}>იტვირთება...</p>
            ) : pendingError ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#fc8181" }}>{pendingError}</p>
            ) : pendingBooks.length > 0 ? (
              <>
                <p className="ad-count-text">
                  {pendingBooks.length} listing{pendingBooks.length !== 1 ? "s" : ""} awaiting your review
                </p>
                {pendingBooks.map((book) => (
                  <BookReviewCard
                    key={book.id}
                    book={book}
                    onApprove={() => handleQuickApprove(book.id)}
                    onReject={() => setRejectTarget(book)} 
                    onSelect={() => setSelectedAdminBook(book)} 
                    busy={busyBookId === book.id}
                  />
                ))}
              </>
            ) : (
              <TabEmpty
                icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                title="All caught up!"
                sub="No listings are pending review right now."
              />
            )
          )}

          {/* All Books */}
          {activeTab === "all" && (
            allBooksLoading ? (
              <p style={{ textAlign: "center", padding: "40px" }}>იტვირთება...</p>
            ) : allBooks.length > 0 ? (
              <>
                <p className="ad-count-text">
                  {allBooks.length} active listing{allBooks.length !== 1 ? "s" : ""} (pending/rejected books aren't shown here)
                </p>
                <AllBooksTable books={allBooks} />
              </>
            ) : (
              <TabEmpty
                icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                title="No active books yet"
                sub="The catalogue is empty."
              />
            )
          )}

          {/* Reports (user-based) */}
          {activeTab === "reports" && (
            <ReportsPanel
              users={suspiciousUsers}
              loading={suspiciousLoading}
              onRefresh={fetchSuspiciousUsers}
              onBlock={handleBlockUser}
              onUnban={handleUnbanUser}
              onViewLogs={handleViewUserLogs}
              busyUserId={busyUserId}
            />
          )}

          {/* Logs */}
          {activeTab === "logs" && <LogsPanel initialQuery={logsFilterQuery} />}

          {/* Admin Book Detail Modal */}
          {selectedAdminBook && (
            <AdminBookDetailModal 
              book={selectedAdminBook}
              onClose={() => setSelectedAdminBook(null)}
              onApprove={handleApprove}
              onReject={(book) => {
                setSelectedAdminBook(null); // ჯერ ვხურავთ დეტალურ მოდალს
                setRejectTarget(book);      // მერე ვხსნით უარყოფის (Reject) მოდალს
              }}
            />
          )}

          {/* Reject Modal */}
          {rejectTarget && (
            <div
              className="reject-modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setRejectTarget(null);
                  setRejectNote("");
                  setRejectPreset("");
                }
              }}
            >
              <div className="reject-modal-container">
                <div className="reject-modal-header">
                  <h3 className="reject-modal-title">
                    <span className="reject-modal-title-icon"><XIcon size={16} /></span> წიგნის უარყოფა
                  </h3>
                  <button
                    className="reject-modal-close"
                    onClick={() => {
                      setRejectTarget(null);
                      setRejectNote("");
                      setRejectPreset("");
                    }}
                  >
                    <XIcon size={16} />
                  </button>
                </div>

                <div>
                  <label className="reject-modal-label-small">
                    Quick presets
                  </label>
                  <div className="reject-modal-presets">
                    {REJECT_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setRejectPreset(p);
                          setRejectNote(p);
                        }}
                        className={`reject-preset-btn ${rejectPreset === p ? "selected" : ""}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="reject-modal-label">
                    მიზეზი (მყიდველთან გაიგზავნება)
                  </label>
                  <textarea
                    className="reject-modal-textarea"
                    rows={3}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="მიუთითეთ უარყოფის მიზეზი..."
                  />
                </div>

                <div className="reject-modal-actions">
                  <button
                    type="button"
                    className="reject-btn-cancel"
                    onClick={() => {
                      setRejectTarget(null);
                      setRejectNote("");
                      setRejectPreset("");
                    }}
                  >
                    უკან
                  </button>
                  <button
                    type="button"
                    className="reject-btn-submit"
                    disabled={!rejectNote.trim() || busyBookId === rejectTarget.id}
                    onClick={() => handleRejectSubmit(rejectTarget.id, rejectNote)}
                  >
                    {busyBookId === rejectTarget.id ? "იგზავნება" : "უარყოფის გაგზავნა"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finance */}
          {activeTab === "finance" && <FinancePanel />}
        </div>
      </main>
    </>
  );
}

export default AdminDashboard;