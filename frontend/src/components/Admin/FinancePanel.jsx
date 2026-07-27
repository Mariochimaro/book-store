import { useState, useEffect } from "react";
import { authHeaders } from "../../context/AuthContext";
import "./Styles/finance.css";

const API_URL = import.meta.env.VITE_API_URL;

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

function FinancePanel() {
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
export default FinancePanel;