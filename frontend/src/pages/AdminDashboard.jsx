import { useState } from "react";
import Navbar from "../components/Navbar";

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const INITIAL_PENDING = [
  {
    id: 1,
    title: "The Amber Witch",
    author: "Philippa Stormcraft",
    listedBy: "Nino Kuarakhelia",
    description:
      "A Victorian-era gothic mystery. A young woman discovers her grandmother's hidden past when she inherits an antique mirror that shows visions of another time.",
    condition: "Like-New",
    condKey: "likenew",
    price: "19.99",
    isbn: "978-0-451523100",
    genres: ["Victorian Gothic", "Mystery"],
    cover: "https://picsum.photos/seed/amberwitch3/200/280",
    submittedAt: "7/14/2026, 9:01:22 PM",
  },
  {
    id: 2,
    title: "Dark Embers",
    author: "R.T. Blackwood",
    listedBy: "Sandro Beridze",
    description:
      "In a world where magic is forbidden, a young fire-wielder must choose between survival and justice.",
    condition: "Good",
    condKey: "good",
    price: "13.40",
    isbn: "978-0-886049052",
    genres: ["Dark Fantasy", "Paranormal"],
    cover: "https://picsum.photos/seed/darkembers2/200/280",
    submittedAt: "7/14/2026, 9:01:33 PM",
  },
];

// ─────────────────────────────────────────────────────────────
// ALL-BOOKS MOCK DATA
// ─────────────────────────────────────────────────────────────

const ALL_BOOKS = [
  { id: 101, title: "The Shadow of the Raven",  author: "Eleonora Blackwood",  price: "24.99", rating: 4.8, popular: true,  cover: "https://picsum.photos/seed/shadowraven/200/280"    },
  { id: 102, title: "Whispers in the Dark",      author: "Marcus Nightshade",   price: "19.99", rating: 4.6, popular: true,  cover: "https://picsum.photos/seed/whispersdark/200/280"   },
  { id: 103, title: "The Crimson Veil",          author: "Victoria Thornfield", price: "22.99", rating: 4.9, popular: true,  cover: "https://picsum.photos/seed/crimsonveil2/200/280"   },
  { id: 104, title: "Moonlit Requiem",           author: "Sebastian Graves",    price: "21.99", rating: 4.7, popular: true,  cover: "https://picsum.photos/seed/moonlitrequiem/200/280" },
  { id: 105, title: "The Obsidian Crown",        author: "Lilith Ravencroft",   price: "26.99", rating: 4.5, popular: false, cover: "https://picsum.photos/seed/obsidiancrown/200/280"  },
  { id: 106, title: "Eternal Nightfall",         author: "Damien Cross",        price: "23.99", rating: 4.4, popular: false, cover: "https://picsum.photos/seed/eternalnightfall/200/280"},
  { id: 107, title: "The Phantom's Lament",      author: "Arabella Shadowmere", price: "20.99", rating: 4.8, popular: true,  cover: "https://picsum.photos/seed/phantomslament/200/280" },
  { id: 108, title: "Blood and Roses",           author: "Cassandra Noir",      price: "25.99", rating: 4.6, popular: true,  cover: "https://picsum.photos/seed/bloodroses/200/280"     },
  { id: 109, title: "The Hollowed Halls",        author: "Edgar Grimwood",      price: "22.99", rating: 4.7, popular: false, cover: "https://picsum.photos/seed/hollowedhalls/200/280"  },
  { id: 110, title: "Witching Hour Chronicles",  author: "Morgana Blackthorn",  price: "24.99", rating: 4.9, popular: true,  cover: "https://picsum.photos/seed/witchinghour3/200/280"  },
];

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS MOCK DATA
// ─────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    id: "n1", type: "listing",
    title: 'New listing submitted by Nino Kvaratskhelia — "The Amber Witch"',
    sub:   "Condition: like-new · $19.99",
    date:  "7/14/2026, 9:01:22 PM",
    action: "Review →",
  },
  {
    id: "n2", type: "listing",
    title: 'New listing submitted by Sandro Beridze — "Dark Embers"',
    sub:   "Condition: good · $15.50",
    date:  "7/14/2026, 8:31:22 PM",
    action: "Review →",
  },
  {
    id: "n3", type: "flag",
    title: "User Darkwing99 flagged for excessive submissions",
    sub:   "12 listing requests in under 1 hour",
    date:  "7/14/2026, 7:31:22 PM",
    action: "View →",
  },
  {
    id: "n4", type: "sale",
    title: 'Sale completed — "Blood & Roses" by Tamara Bakradze',
    sub:   "Sold to Giorgi K. · $22.00",
    date:  "7/13/2026, 9:31:22 PM",
    action: null,
  },
  {
    id: "n5", type: "flag",
    title: "User BookSpammer flagged for duplicate listings",
    sub:   "8 identical listings detected",
    date:  "7/12/2026, 9:31:22 PM",
    action: "View →",
  },
  {
    id: "n6", type: "sale",
    title: 'Sale completed — "The Obsidian Mirror" by Lali Mgeladze',
    sub:   "Sold to Nino A. · $17.99",
    date:  "7/11/2026, 9:31:22 PM",
    action: null,
  },
  {
    id: "n7", type: "listing",
    title: 'New listing submitted by Giorgi Beridze — "The Lost Kingdom"',
    sub:   "Condition: new · $28.00",
    date:  "7/11/2026, 8:15:00 PM",
    action: "Review →",
  },
];

// ─────────────────────────────────────────────────────────────
// REPORTS MOCK DATA
// ─────────────────────────────────────────────────────────────

const REPORTS = [
  {
    id: "rp1",
    user: "Darkwing99",
    status: "open",
    flags: 12,
    description: "Excessive listing requests — 12 submissions in under 1 hour, possible spam",
    date: "7/14/2026, 8:31:22 PM",
  },
  {
    id: "rp2",
    user: "BookSpammer",
    status: "open",
    flags: 8,
    description: "Duplicate listing spam detected — same book listed 8 times under different prices",
    date: "7/14/2026, 7:31:22 PM",
  },
  {
    id: "rp3",
    user: "SpamLister77",
    status: "blocked",
    flags: 5,
    description: "Fraudulent cover images — book covers do not match listed titles",
    date: "7/13/2026, 9:31:22 PM",
  },
  {
    id: "rp4",
    user: "NightReader99",
    status: "resolved",
    flags: 2,
    description: "Slightly inflated pricing on common titles",
    date: "7/12/2026, 9:31:22 PM",
  },
];

// ─────────────────────────────────────────────────────────────
// LOGS MOCK DATA
// ─────────────────────────────────────────────────────────────

const LOG_ENTRIES = [
  { id: "l1",  action: "APPROVE_LISTING", actionKey: "approve", target: "Blood & Roses by Tamara Bakradze",               admin: "admin", date: "7/13/2026, 9:31:22 PM" },
  { id: "l2",  action: "APPROVE_LISTING", actionKey: "approve", target: "The Obsidian Mirror by Lali Mgeladze",           admin: "admin", date: "7/12/2026, 9:31:22 PM" },
  { id: "l3",  action: "REJECT_LISTING",  actionKey: "reject",  target: "Shadow Flame — cover image does not match title", admin: "admin", date: "7/11/2026, 9:31:22 PM" },
  { id: "l4",  action: "BLOCK_USER",      actionKey: "block",   target: "Darkwing99",                                     admin: "admin", date: "7/10/2026, 9:31:22 PM" },
  { id: "l5",  action: "RESOLVE_REPORT",  actionKey: "resolve", target: "BookSpammer",                                    admin: "admin", date: "7/9/2026, 9:31:22 PM"  },
  { id: "l6",  action: "APPROVE_LISTING", actionKey: "approve", target: "The Crimson Pact by Giorgi Khachidze",           admin: "admin", date: "7/8/2026, 9:31:22 PM"  },
  { id: "l7",  action: "REJECT_LISTING",  actionKey: "reject",  target: "Shattered Glass — price set too high ($999)",    admin: "admin", date: "7/7/2026, 9:31:22 PM"  },
  { id: "l8",  action: "APPROVE_LISTING", actionKey: "approve", target: "Moonlit Requiem by Sandro Beridze",              admin: "admin", date: "7/6/2026, 9:31:22 PM"  },
  { id: "l9",  action: "RESOLVE_REPORT",  actionKey: "resolve", target: "NightReader99",                                  admin: "admin", date: "7/5/2026, 9:31:22 PM"  },
  { id: "l10", action: "APPROVE_LISTING", actionKey: "approve", target: "Echoes of the Abyss by Lali Mgeladze",           admin: "admin", date: "7/4/2026, 9:31:22 PM"  },
  { id: "l11", action: "REJECT_LISTING",  actionKey: "reject",  target: "The Silver Thorn — duplicate listing detected",  admin: "admin", date: "7/3/2026, 9:31:22 PM"  },
  { id: "l12", action: "BLOCK_USER",      actionKey: "block",   target: "SpamLister77",                                   admin: "admin", date: "7/2/2026, 9:31:22 PM"  },
];

// ─────────────────────────────────────────────────────────────
// FINANCE MOCK DATA
// ─────────────────────────────────────────────────────────────

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
  { label: "Cozy Fantasy",     pct: 48 },
  { label: "Dark Romance",     pct: 43 },
];

const TOP_BOOKS_FINANCE = [
  { rank: 1, title: "The Shadow of the Raven",  author: "Eleonora Blackwood",  price: "$24.99", cover: "https://picsum.photos/seed/shadowraven/200/280"    },
  { rank: 2, title: "Whispers in the Dark",      author: "Marcus Nightshade",   price: "$19.99", cover: "https://picsum.photos/seed/whispersdark/200/280"   },
  { rank: 3, title: "The Crimson Veil",          author: "Victoria Thornfield", price: "$22.99", cover: "https://picsum.photos/seed/crimsonveil2/200/280"   },
  { rank: 4, title: "Moonlit Requiem",           author: "Sebastian Graves",    price: "$21.99", cover: "https://picsum.photos/seed/moonlitrequiem/200/280" },
  { rank: 5, title: "The Phantom's Lament",      author: "Arabella Shadowmere", price: "$20.99", cover: "https://picsum.photos/seed/phantomslament/200/280" },
  { rank: 6, title: "Blood and Roses",           author: "Cassandra Noir",      price: "$25.99", cover: "https://picsum.photos/seed/bloodroses/200/280"     },
];

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
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
);
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// Notification-specific icons (16 px — used inside coloured icon-wrap squares)
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

// Reports action icons
const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const BlockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

// Finance stat icons (16 px)
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

// ─────────────────────────────────────────────────────────────
// BOOK REVIEW CARD
// ─────────────────────────────────────────────────────────────

function BookReviewCard({ book, onApprove, onReject }) {
  const condClass = {
    likenew: "ad-cond-likenew",
    new:     "ad-cond-new",
    good:    "ad-cond-good",
    fair:    "ad-cond-fair",
  }[book.condKey] ?? "ad-cond-good";

  return (
    <article className="ad-book-card">
      <img
        src={book.cover}
        alt={book.title}
        className="ad-book-cover"
        loading="lazy"
      />

      <div className="ad-book-body">
        <div className="ad-book-top">
          <div>
            <h3 className="ad-book-title">{book.title}</h3>
            <p className="ad-book-author">{book.author}</p>
            <p className="ad-book-listed">
              Listed by <span className="ad-listed-name">{book.listedBy}</span>
            </p>
          </div>

          {/* Action buttons — right-side column */}
          <div className="ad-book-actions">
            <button
              className="ad-approve-btn"
              onClick={() => onApprove(book.id)}
              aria-label={`Approve ${book.title}`}
            >
              <CheckIcon /> Approve
            </button>
            <button
              className="ad-reject-btn"
              onClick={() => onReject(book.id)}
              aria-label={`Reject ${book.title}`}
            >
              <XIcon /> Reject
            </button>
          </div>
        </div>

        <p className="ad-book-desc">{book.description}</p>

        <div className="ad-book-tags">
          <span className={`ad-tag ${condClass}`}>{book.condition}</span>
          <span className="ad-tag ad-price-tag">${book.price}</span>
          <span className="ad-tag ad-isbn-tag">ISBN {book.isbn}</span>
          {book.genres.map((g) => (
            <span key={g} className="ad-tag ad-genre-tag">{g}</span>
          ))}
        </div>

        <p className="ad-book-date">Submitted {book.submittedAt}</p>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// ALL BOOKS TABLE
// ─────────────────────────────────────────────────────────────

function AllBooksTable({ books, onDelete }) {
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            <th className="ad-th ad-th-cover">Cover</th>
            <th className="ad-th">Title</th>
            <th className="ad-th">Author</th>
            <th className="ad-th ad-th-r">Price</th>
            <th className="ad-th ad-th-r">Rating</th>
            <th className="ad-th">Status</th>
            <th className="ad-th ad-th-r">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} className="ad-tr">
              <td className="ad-td ad-td-cover">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="ad-table-cover"
                  loading="lazy"
                />
              </td>
              <td className="ad-td">
                <span className="ad-td-title">{book.title}</span>
              </td>
              <td className="ad-td">
                <span className="ad-td-author">{book.author}</span>
              </td>
              <td className="ad-td ad-td-r">
                <span className="ad-td-price">${book.price}</span>
              </td>
              <td className="ad-td ad-td-r">
                <span className="ad-td-rating">
                  {book.rating}
                  <span className="ad-td-star" aria-hidden="true">★</span>
                </span>
              </td>
              <td className="ad-td">
                {book.popular && (
                  <span className="ad-popular-badge">Popular</span>
                )}
              </td>
              <td className="ad-td ad-td-r">
                <button
                  className="ad-action-btn ad-edit-btn"
                  aria-label={`Edit ${book.title}`}
                >
                  <PencilIcon />
                </button>
                <button
                  className="ad-action-btn ad-delete-btn"
                  onClick={() => onDelete(book.id)}
                  aria-label={`Delete ${book.title}`}
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────────────────────

const NF_CONFIG = {
  listing: { Icon: NfListingIcon, iconCls: "nf-icon-listing", actionCls: "nf-action-listing", cardCls: "nf-card-listing" },
  flag:    { Icon: NfFlagIcon,    iconCls: "nf-icon-flag",    actionCls: "nf-action-flag",    cardCls: "nf-card-flag"    },
  sale:    { Icon: NfSaleIcon,    iconCls: "nf-icon-sale",    actionCls: "nf-action-sale",    cardCls: "nf-card-sale"    },
};

function NotificationsPanel({ notifications }) {
  const newListings = notifications.filter((n) => n.type === "listing").length;
  const flags       = notifications.filter((n) => n.type === "flag").length;

  return (
    <>
      {/* Summary row */}
      <div className="nf-summary-row">
        <span className="nf-count">{notifications.length} platform notifications</span>
        <div className="nf-pills">
          {newListings > 0 && (
            <span className="nf-pill nf-pill-listing">{newListings} new listings</span>
          )}
          {flags > 0 && (
            <span className="nf-pill nf-pill-flag">{flags} flags</span>
          )}
        </div>
      </div>

      {/* Notification cards */}
      <div className="nf-list">
        {notifications.map((n) => {
          const { Icon, iconCls, actionCls, cardCls } = NF_CONFIG[n.type];
          return (
            <div key={n.id} className={`nf-card ${cardCls}`}>
              <div className={`nf-icon-wrap ${iconCls}`}>
                <Icon />
              </div>

              <div className="nf-body">
                <p className="nf-title">{n.title}</p>
                <p className="nf-sub">{n.sub}</p>
                <p className="nf-date">{n.date}</p>
              </div>

              {n.action && (
                <button className={`nf-action ${actionCls}`}>
                  {n.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS PANEL
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  open:     { cls: "rp-badge-open",     label: "open"     },
  blocked:  { cls: "rp-badge-blocked",  label: "blocked"  },
  resolved: { cls: "rp-badge-resolved", label: "resolved" },
};

function ReportsPanel({ reports: initialReports }) {
  const [reports, setReports] = useState(initialReports);
  const [filter,  setFilter]  = useState("open");

  function handleBlock(id) {
    setReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "blocked" } : r)
    );
  }
  function handleDismiss(id) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const openCount = reports.filter((r) => r.status === "open").length;
  const visible   = filter === "open" ? reports.filter((r) => r.status === "open") : reports;

  return (
    <>
      {/* Sub-filter row */}
      <div className="rp-filter-row">
        <button
          className={`rp-filter-btn${filter === "open" ? " active" : ""}`}
          onClick={() => setFilter("open")}
        >
          Open
        </button>
        <button
          className={`rp-filter-btn${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <span className="rp-open-count">{openCount} open</span>
      </div>

      {/* Report cards */}
      <div className="rp-list">
        {visible.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-2)", fontSize: "0.85rem" }}>
            No reports to show.
          </p>
        ) : (
          visible.map((r) => {
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.open;
            return (
              <div key={r.id} className="rp-card">
                <div className="rp-alert-icon">
                  <NfFlagIcon />
                </div>

                <div className="rp-body">
                  <div className="rp-top-row">
                    <div className="rp-user-line">
                      <span className="rp-username">{r.user}</span>
                      <span className={`rp-badge ${badge.cls}`}>{badge.label}</span>
                      <span className="rp-flag-count">{r.flags} flags</span>
                    </div>

                    {r.status === "open" && (
                      <div className="rp-actions">
                        <button className="rp-logs-btn" aria-label={`View logs for ${r.user}`}>
                          <EyeIcon /> Logs
                        </button>
                        <button
                          className="rp-block-btn"
                          onClick={() => handleBlock(r.id)}
                          aria-label={`Block ${r.user}`}
                        >
                          <BlockIcon /> Block
                        </button>
                        <button
                          className="rp-dismiss-btn"
                          onClick={() => handleDismiss(r.id)}
                          aria-label={`Dismiss report for ${r.user}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="rp-desc">{r.description}</p>
                  <p className="rp-date">{r.date}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGS PANEL
// ─────────────────────────────────────────────────────────────

function LogsPanel() {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? LOG_ENTRIES.filter(
        (l) =>
          l.action.toLowerCase().includes(query.toLowerCase()) ||
          l.target.toLowerCase().includes(query.toLowerCase())
      )
    : LOG_ENTRIES;

  return (
    <>
      {/* Search + entry count row */}
      <div className="lg-search-row">
        <input
          type="text"
          className="lg-search-input"
          placeholder="Filter by action or target..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter logs"
        />
        <span className="lg-entry-count">{filtered.length} entries</span>
      </div>

      {/* Logs table */}
      <div className="ad-table-wrap">
        <table className="ad-table lg-table">
          <thead>
            <tr>
              <th className="ad-th lg-th-action">Action</th>
              <th className="ad-th">Target</th>
              <th className="ad-th lg-th-admin">Admin</th>
              <th className="ad-th lg-th-date">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="lg-empty-row">No entries match your filter.</td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="ad-tr">
                  <td className="ad-td">
                    <span className={`lg-badge lg-badge-${log.actionKey}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="ad-td lg-td-target">{log.target}</td>
                  <td className="ad-td lg-td-muted">{log.admin}</td>
                  <td className="ad-td lg-td-muted">{log.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FINANCE PANEL
// ─────────────────────────────────────────────────────────────

function FinancePanel() {
  return (
    <div className="fn-root">

      {/* ── Top: revenue bar chart + 3 stat cards ─────────── */}
      <div className="fn-top-grid">

        {/* Platform Revenue */}
        <div className="fn-card fn-revenue-card">
          <div className="fn-rev-header">
            <div>
              <p className="fn-card-title">Platform Revenue</p>
              <p className="fn-card-sub">Last 6 months</p>
            </div>
            <span className="fn-mom-badge">+18% MoM</span>
          </div>

          <div className="fn-bar-chart" aria-label="Monthly revenue bar chart">
            {REVENUE_BARS.map((bar) => (
              <div key={bar.label} className="fn-bar-col">
                <div className="fn-bar-track">
                  <div
                    className={`fn-bar${bar.highlight ? " fn-bar-hi" : ""}`}
                    style={{ height: `${bar.pct}%` }}
                  />
                </div>
                <span className="fn-bar-label">{bar.label}</span>
              </div>
            ))}
          </div>

          <div className="fn-chart-foot">
            <span className="fn-foot-txt">Total: <strong>$492.47</strong></span>
            <span className="fn-foot-txt">Avg/mo: <strong>$82.08</strong></span>
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div className="fn-stats-col">
          <div className="fn-card fn-stat-card">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Total Transactions</p>
              <p className="fn-stat-val">8</p>
              <p className="fn-stat-sub">orders + sales</p>
            </div>
            <div className="fn-stat-icon"><TrendLineIcon /></div>
          </div>

          <div className="fn-card fn-stat-card fn-stat-green">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Active Sellers</p>
              <p className="fn-stat-val">4</p>
              <p className="fn-stat-sub">with approved listings</p>
            </div>
            <div className="fn-stat-icon fn-icon-green"><ArrowUpRightIcon /></div>
          </div>

          <div className="fn-card fn-stat-card fn-stat-gold">
            <div className="fn-stat-body">
              <p className="fn-stat-lbl">Platform Fee Earned</p>
              <p className="fn-stat-val fn-val-gold">$39.40</p>
              <p className="fn-stat-sub">8% per sale</p>
            </div>
            <div className="fn-stat-icon fn-icon-gold"><DollarSignIcon /></div>
          </div>
        </div>
      </div>

      {/* ── Bottom: genre popularity + top books ───────────── */}
      <div className="fn-bottom-grid">

        {/* Genre Popularity */}
        <div className="fn-card fn-genre-card">
          <p className="fn-card-title">Genre Popularity</p>
          <div className="fn-genre-list">
            {GENRE_POPULARITY.map((g) => (
              <div key={g.label} className="fn-genre-row">
                <span className="fn-genre-lbl">{g.label}</span>
                <div
                  className="fn-prog-track"
                  role="progressbar"
                  aria-valuenow={g.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="fn-prog-fill" style={{ width: `${g.pct}%` }} />
                </div>
                <span className="fn-genre-pct">{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Books */}
        <div className="fn-card fn-topbooks-card">
          <p className="fn-card-title">Top Performing Books</p>
          <ol className="fn-book-list">
            {TOP_BOOKS_FINANCE.map((b) => (
              <li key={b.rank} className="fn-book-row">
                <span className="fn-book-rank">{b.rank}</span>
                <img
                  src={b.cover}
                  alt={b.title}
                  className="fn-book-cover"
                  loading="lazy"
                />
                <div className="fn-book-info">
                  <p className="fn-book-title">{b.title}</p>
                  <p className="fn-book-author">{b.author}</p>
                </div>
                <span className="fn-book-price">{b.price}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATES FOR TABS
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
  const [pendingBooks, setPendingBooks] = useState(INITIAL_PENDING);
  const [allBooks,     setAllBooks]     = useState(ALL_BOOKS);
  const [activeTab,    setActiveTab]   = useState("pending");

  function handleApprove(id) {
    setPendingBooks((prev) => prev.filter((b) => b.id !== id));
  }
  function handleReject(id) {
    setPendingBooks((prev) => prev.filter((b) => b.id !== id));
  }
  function handleDeleteBook(id) {
    setAllBooks((prev) => prev.filter((b) => b.id !== id));
  }

  // Tabs — badge for "pending" is live; others are static placeholders
  const TABS = [
    { id: "pending",       label: "Pending Review", Icon: ClockIcon,    badge: pendingBooks.length || null },
    { id: "all",           label: "All Books",       Icon: BookIcon,     badge: null },
    { id: "notifications", label: "Notifications",   Icon: BellIcon,     badge: 5 },
    { id: "reports",       label: "Reports",         Icon: AlertIcon,    badge: 2 },
    { id: "logs",          label: "Logs",            Icon: FileIcon,     badge: null },
    { id: "finance",       label: "Finance",         Icon: BarChartIcon, badge: null },
  ];

  return (
    <>
      <Navbar />

      <main className="ad-page">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="ad-header">
          <div className="ad-title-group">
            <svg
              className="ad-shield-svg"
              width="26" height="26"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>

            <div>
              <h1 className="ad-page-title">Admin Dashboard</h1>
              <p className="ad-page-sub">Manage listings, sellers, and platform activity</p>
            </div>
          </div>

          <span className="ad-admin-badge">Administrator</span>
        </div>

        {/* ── Secondary navigation tabs ───────────────────── */}
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
              {badge != null && badge > 0 && (
                <span className="ad-tab-badge">{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Tab panels ──────────────────────────────────── */}
        <div className="ad-content">

          {activeTab === "pending" && (
            pendingBooks.length > 0 ? (
              <>
                <p className="ad-count-text">
                  {pendingBooks.length} listing{pendingBooks.length !== 1 ? "s" : ""} awaiting your review
                </p>
                {pendingBooks.map((book) => (
                  <BookReviewCard
                    key={book.id}
                    book={book}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </>
            ) : (
              <TabEmpty
                icon={
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                }
                title="All caught up!"
                sub="No listings are pending review right now."
              />
            )
          )}

          {activeTab === "all" && (
            allBooks.length > 0 ? (
              <>
                <p className="ad-count-text">{allBooks.length} books in the catalogue</p>
                <AllBooksTable books={allBooks} onDelete={handleDeleteBook} />
              </>
            ) : (
              <TabEmpty
                icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                title="No books yet"
                sub="The catalogue is empty."
              />
            )
          )}

          {activeTab === "notifications" && (
            <NotificationsPanel notifications={NOTIFICATIONS} />
          )}

          {activeTab === "reports" && (
            <ReportsPanel reports={REPORTS} />
          )}

          {activeTab === "logs" && (
            <LogsPanel />
          )}

          {activeTab === "finance" && (
            <FinancePanel />
          )}

        </div>
      </main>
    </>
  );
}

export default AdminDashboard;
