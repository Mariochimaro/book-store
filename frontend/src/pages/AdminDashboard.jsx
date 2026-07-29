import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import AdminBookDetailModal from "../components/Admin/BookReview";
import FinancePanel from "../components/Admin/FinancePanel";
import LogsPanel from "../components/Admin/LogsPanel";
import { authHeaders } from "../context/AuthContext";
import "../styles/admin.css"

const API_URL = import.meta.env.VITE_API_URL;

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

const REJECT_PRESETS = [
  'ყდა არ შეესაბამება წიგნის სათაურს.',
  'ფასი ზედმეტად მაღალია.',
  'დუბლირებული განცხადება — ეს წიგნი უკვე დამატებულია.',
  'აღწერა ზედმეტად მოკლეა და არ შეიცავს საკმარის ინფორმაციას.',
  'ფოტოების ხარისხი ძალიან დაბალია.'
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