import { useState, useEffect } from "react";
import { authFetch } from "../../context/Apihelpers";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart
} from "lucide-react";

export default function FinancesTab() {
  const [finances, setFinances] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch("/user/finances"),
      authFetch("/user/transactions")
    ])
      .then(([finData, transData]) => {
        setFinances(finData);
        setTransactions(transData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", opacity: 0.5, color: "var(--text-color, #fff)" }}>
        იტვირთება ფინანსური მონაცემები...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(252, 129, 129, 0.1)", color: "#fc8181", border: "1px solid rgba(252, 129, 129, 0.2)" }}>
        შეცდომა: {error}
      </div>
    );
  }

  const totalEarned = Number(finances?.total_earnings || 0);
  const booksSold = Number(finances?.books_sold_count || 0);
  const avgPrice = Number(finances?.average_price || 0);
  const activeListings = Number(finances?.active_listings_count || 0);

  // --- ძველი ლოგიკის ნაცვლად ჩასვი ეს ---
  const rawMonths = finances?.monthly_totals || [];
  
  // 1. ვქმნათ ბოლო 6 თვის სახელები ქრონოლოგიურად (მაგ: ['MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'])
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const currentDate = new Date();
  const last6MonthsKeys = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const mKey = monthNames[d.getMonth()];
    last6MonthsKeys.push({
      key: mKey,
      label: mKey.toUpperCase()
    });
  }

  // 2. ვანაწილებთ ბექენდიდან მოსულ მონაცემებს ამ 6 თვეზე (თუ თვე არ მოიძებნა, ვწერთ 0-ს)
  const revenueByMonth = last6MonthsKeys.map(({ key }) => {
    // rawMonths არის მასივი სადაც ელემენტებია მაგ: {"jan": 56}
    const foundObj = rawMonths.find(m => m[key] !== undefined);
    return foundObj ? Number(foundObj[key]) : 0;
  });

  const monthsKeys = last6MonthsKeys.map(m => m.label);
  const maxRev = revenueByMonth.length > 0 ? Math.max(...revenueByMonth) : 0;
  // თუ მაქსიმალური შემოსავალი 0-ია (სულ ახალი იუზერია), რომ სვეტები არ აირიოს, maxRev გავხადოთ 1
  const chartMax = maxRev > 0 ? maxRev : 1; 
  
  const len = revenueByMonth.length;
  const thisMonthRevenue = revenueByMonth[revenueByMonth.length - 1];
  const prevMonthRevenue = revenueByMonth[revenueByMonth.length - 2] || 0;
  const monthChange = prevMonthRevenue > 0 ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  const rawGenres = finances?.sales_by_genre_percentages || {};
  const genresData = Object.entries(rawGenres)
    .map(([genre, pct]) => ({ genre, pct: Number(pct) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const platformFee = totalEarned * 0.08;
  const processingFee = totalEarned * 0.02;
  const netPayout = totalEarned - platformFee - processingFee;

  const kpis = [
    {
      label: "სულ შემოსავალი",
      value: `₾${totalEarned.toFixed(2)}`,
      sub: prevMonthRevenue > 0 ? "წინა თვესთან შედარებით" : "მიმდინარე შემოსავალი",
      icon: DollarSign,
      change: monthChange,
      color: "#34d399",
      bg: "rgba(52, 211, 153, 0.1)",
      border: "rgba(52, 211, 153, 0.2)"
    },
    {
      label: "გაყიდული წიგნები",
      value: booksSold,
      sub: "ჯამური გაყიდვები",
      icon: TrendingUp,
      change: 0,
      color: "var(--accent, #a78bfa)",
      bg: "var(--accent-glow, rgba(167, 139, 250, 0.1))",
      border: "rgba(167, 139, 250, 0.2)"
    },
    {
      label: "საშუალო ფასი",
      value: `₾${avgPrice.toFixed(2)}`,
      sub: "თითო წიგნზე",
      icon: BarChart3,
      change: 0,
      color: "#60a5fa",
      bg: "rgba(96, 165, 250, 0.1)",
      border: "rgba(96, 165, 250, 0.2)"
    },
    {
      label: "აქტიური განცხადებები",
      value: activeListings,
      sub: "ამჟამად იყიდება",
      icon: Activity,
      change: 0,
      color: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.1)",
      border: "rgba(251, 191, 36, 0.2)"
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>ფინანსური მიმოხილვა</h2>
          <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "4px" }}>
            შენი გაყიდვებისა და შემოსავლების დეტალური სტატისტიკა
          </p>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.2)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)", fontSize: "0.75rem", fontWeight: 500 }}>
          აქტიური გამყიდველი
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {kpis.map(({ label, value, sub, icon: Icon, change, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", opacity: 0.7, fontWeight: 500 }}>{label}</span>
              <Icon style={{ width: "16px", height: "16px", color }} />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color, marginBottom: "4px" }}>{value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", opacity: 0.7 }}>
              {change !== 0 && (
                change > 0 ? <ChevronUp style={{ width: "12px", height: "12px", color: "#34d399" }} /> : <ChevronDown style={{ width: "12px", height: "12px", color: "#fc8181" }} />
              )}
              <span>{change !== 0 ? `${Math.abs(change).toFixed(1)}% ` : ""}{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Revenue Chart */}
        <div style={{ background: "var(--bg-card, #1e1e1e)", border: "1px solid var(--border, #333)", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>ყოველთვიური შემოსავალი</p>
              <p style={{ fontSize: "0.75rem", opacity: 0.6, margin: 0 }}>ბოლო თვეების დინამიკა</p>
            </div>
            {len > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: monthChange >= 0 ? "#34d399" : "#fc8181", fontSize: "0.75rem", fontWeight: 600 }}>
                {monthChange >= 0 ? <ArrowUpRight style={{ width: "16px", height: "16px" }} /> : <ArrowDownRight style={{ width: "16px", height: "16px" }} />}
                <span>{Math.abs(monthChange).toFixed(1)}% MoM</span>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "110px", marginTop: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px" }}>
            {revenueByMonth.map((val, i) => {
              const isLast = i === revenueByMonth.length - 1;
              const barHeight = chartMax > 0 ? (val / chartMax) * 85 : 0;
              
              return (
                <div key={monthsKeys[i] + i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "9px", opacity: 0.6 }}>₾{val.toFixed(0)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}px` }}
                    transition={{ duration: 0.6, delay: i * 0.07 }}
                    style={{
                      width: "100%",
                      borderRadius: "4px 4px 0 0",
                      background: isLast ? "var(--accent, #a78bfa)" : "rgba(167, 139, 250, 0.4)",
                    }}
                  />
                  <span style={{ fontSize: "9px", opacity: 0.6 }}>{monthsKeys[i]}</span>
                </div>
              );
            })}
            
            {revenueByMonth.length === 0 && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", opacity: 0.5 }}>
                მონაცემები ჯერ არ არის
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.75rem", opacity: 0.7 }}>
            <span>სულ: <strong style={{ color: "inherit" }}>₾{totalEarned.toFixed(2)}</strong></span>
            <span>საშუალოდ თვეში: <strong style={{ color: "inherit" }}>₾{len > 0 ? (totalEarned / len).toFixed(2) : "0.00"}</strong></span>
          </div>
        </div>

        {/* Payout & Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--bg-card, #1e1e1e)", border: "1px solid var(--border, #333)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Wallet style={{ width: "16px", height: "16px", color: "var(--accent, #a78bfa)" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>შემოსავლის განაწილება</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem" }}>
              {[
                { label: "მთლიანი გამომუშავება", val: totalEarned, color: "inherit" },
                { label: "პლატფორმის საკომისიო (8%)", val: -platformFee, color: "#fc8181" },
                { label: "ტრანზაქციის საკომისიო (2%)", val: -processingFee, color: "#fc8181" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.6 }}>{label}</span>
                  <span style={{ fontWeight: 500, color }}>{val < 0 ? "-" : ""}₾{Math.abs(val).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>სუფთა შემოსავალი</span>
                <span style={{ color: "#34d399" }}>₾{netPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card, #1e1e1e)", border: "1px solid var(--border, #333)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <PieChart style={{ width: "16px", height: "16px", color: "var(--accent, #a78bfa)" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>გაყიდვები ჟანრების მიხედვით</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {genresData.length > 0 ? (
                genresData.map(({ genre, pct }, i) => {
                  const colors = ["var(--accent, #a78bfa)", "#60a5fa", "#fbbf24", "#c084fc"];
                  return (
                    <div key={genre}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                        <span style={{ opacity: 0.6 }}>{genre}</span>
                        <span style={{ fontWeight: 500 }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          style={{ height: "100%", borderRadius: "999px", background: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: "0.75rem", opacity: 0.5, textAlign: "center", padding: "8px 0" }}>ჟანრების სტატისტიკა ცარიელია</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ background: "var(--bg-card, #1e1e1e)", border: "1px solid var(--border, #333)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border, #333)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>ტრანზაქციების ისტორია</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {transactions.length > 0 ? (
            transactions.slice(0, 10).map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: i !== transactions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(52, 211, 153, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DollarSign style={{ width: "14px", height: "14px", color: "#34d399" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.book_title}</p>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6, margin: 0 }}>მყიდველი: {tx.buyer_username}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#34d399", margin: 0 }}>+₾{Number(tx.price).toFixed(2)}</p>
                  <p style={{ fontSize: "9px", opacity: 0.5, margin: 0 }}>
                    {new Date(tx.datetime).toLocaleDateString("ka-GE")}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ padding: "32px", textAlign: "center", opacity: 0.5, fontSize: "0.875rem" }}>
              <DollarSign style={{ width: "32px", height: "32px", margin: "0 auto 8px", opacity: 0.3 }} />
              ტრანზაქციები ჯერ არ მოიძებნა — დაამატე წიგნები გასაყიდად
            </div>
          )}
        </div>
      </div>
    </div>
  );
}