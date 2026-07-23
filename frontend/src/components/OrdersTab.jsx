import { useState, useEffect } from "react";
import { authFetch, contactHref, formatMoney, REQUEST_STATUS_LABELS } from "./apiHelpers";
import { ReceiptIcon } from "./icons";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch("/user/orders")
      .then((data) => setOrders(data.orders ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>;
  if (error) return <p style={{ padding: "20px", color: "#fc8181" }}>{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="pf-empty">
        <ReceiptIcon size={48} className="pf-empty-icon" strokeWidth="1.3" />
        <p className="pf-empty-title">შეკვეთები არ არის</p>
        <p className="pf-empty-sub">როცა წიგნს იყიდი, აქ გამოჩნდება ისტორია.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {orders.map((o) => {
        const st = REQUEST_STATUS_LABELS[o.status] ?? { label: o.status, color: "#a0aec0" };
        // Payment is owed while the 15-minute timer is running or the seller
        // is verifying it — these are the two statuses that actually occur
        // (not "pending_payment", which nothing in the backend sets).
        const needsPayment = o.status === "active_timer" || o.status === "checking_payment";
        const link = contactHref(o.seller?.email);

        return (
          <div key={o.order_id} style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600 }}>{o.book?.title}</p>
                <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                  გამყიდველი: {o.seller?.username ?? "—"} · {new Date(o.requested_at).toLocaleDateString("ka-GE")}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 700 }}>{formatMoney(o.book?.price)}</p>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: st.color }}>● {st.label}</span>
              </div>
            </div>

            {needsPayment && o.seller?.bank_accounts?.length > 0 && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: "0.78rem", opacity: 0.6, marginBottom: "6px" }}>გადარიცხვის რეკვიზიტები:</p>
                {o.seller.bank_accounts.map((acc, i) => (
                  <p key={i} style={{ fontSize: "0.82rem" }}>{acc.bank_name}: {acc.account_number}</p>
                ))}
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                    დაკავშირება გამყიდველთან
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}