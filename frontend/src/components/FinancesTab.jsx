import { useState, useEffect } from "react";
import { authFetch, formatMoney } from "./apiHelpers";

const KPIS = [
  { key: "total_earned",      label: "სულ შემოსავალი",       format: formatMoney, color: "#68d391" },
  { key: "total_sold_books",  label: "გაყიდული წიგნები",      format: (v) => v,    color: "var(--accent)" },
  { key: "active_listings",   label: "აქტიური განცხადებები",  format: (v) => v,    color: "#63b3ed" },
  { key: "pending_sales",     label: "მოლოდინში",             format: (v) => v,    color: "#f6e05e" },
  { key: "total_views",       label: "ნახვები",               format: (v) => v,    color: "#a0aec0" },
];

export default function FinancesTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch("/user/seller-stats")
      .then((data) => setStats(data.stats))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>;
  if (error) return <p style={{ padding: "20px", color: "#fc8181" }}>{error}</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
      {KPIS.map(({ key, label, format, color }) => (
        <div key={key} style={{ background: "var(--bg-card)", borderRadius: "10px", padding: "16px" }}>
          <p style={{ fontSize: "0.78rem", opacity: 0.6, marginBottom: "6px" }}>{label}</p>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color }}>{format(stats?.[key] ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}