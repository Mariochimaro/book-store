import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authFetch, contactHref, timeAgo } from "./Apihelpers";
import { BellIcon } from "./icons";

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null); // { id, kind: 'confirm' | 'reject' | 'delete' }
  const [busyId, setBusyId] = useState(null);

  const refresh = () => {
    authFetch("/requests/notifications")
      .then((data) => { setNotifications(data.notifications ?? []); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const runAction = (notif, kind) => {
    const url = notif.group_id
      ? `/requests/group/${notif.group_id}/${kind}`
      : notif.request_id
        ? `/requests/${notif.request_id}/${kind}`
        : null;

    if (!url) {
      setError("ამ შეტყობინებას აკლია საჭირო იდენტიფიკატორი.");
      return;
    }
    setBusyId(notif.id);
    authFetch(url, { method: "POST" })
      .then(() => { setConfirming(null); refresh(); })
      .catch((e) => setError(e.message))
      .finally(() => setBusyId(null));
  };

  const deleteNotification = (id) => {
    setBusyId(id);
    authFetch(`/requests/notifications/${id}`, { method: "DELETE" })
      .then(() => {
        setConfirming(null);
        // ოპტიმისტური განახლება: ამოვშალოთ ლოკალური state-იდან
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusyId(null));
  };

  if (loading) return <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>;

  if (notifications.length === 0) {
    return (
      <div className="pf-empty">
        <BellIcon size={48} className="pf-empty-icon" strokeWidth="1.3" />
        <p className="pf-empty-title">შეტყობინებები არ არის</p>
        <p className="pf-empty-sub">როცა ვინმე შენს წიგნს მოინდომებს ან შენი შესყიდვის სტატუსი შეიცვლება, აქ გამოჩნდება.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error && <p style={{ fontSize: "0.8rem", color: "#fc8181" }}>{error}</p>}

      {notifications.map((notif) => {
        const book = notif.books ?? {};
        const cover = book.photos_urls?.[0] ?? "/placeholder.jpg";
        const isConfirming = confirming?.id === notif.id;
        const link = contactHref(notif.counterpart_email);
        const isGroup = notif.group_id && notif.books?.length > 1;

        return (
          <div key={notif.id} style={{
            position: "relative",
            display: "flex", gap: "14px", alignItems: "flex-start",
            background: "var(--bg-card)", borderRadius: "8px", padding: "12px",
            borderLeft: notif.type === "payment_check" ? "3px solid #f6e05e" : "3px solid transparent",
          }}>
            {/* წაშლის ღილაკი ზედა მარჯვენა კუთხეში */}
            {!isConfirming && (
              <button
                onClick={() => setConfirming({ id: notif.id, kind: "delete" })}
                title="შეტყობინების წაშლა"
                style={{
                  position: "absolute", top: "8px", right: "8px",
                  background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", fontSize: "0.85rem", padding: "4px", lineHeight: 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#fc8181"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
              >
                ✕
              </button>
            )}

            <img src={cover} alt={book.title ?? ""}
              style={{ width: "44px", height: "60px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />

            <div style={{ flex: 1, paddingRight: "16px" }}>
              <p style={{ fontWeight: 600, marginBottom: "2px" }}>
                {isGroup ? `${notif.books.length} წიგნი` : (book.title ?? notif.message)}
              </p>

              {notif.type === "payment_check" ? (
                <p style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "4px" }}>
                  {notif.counterpart_name ?? "მყიდველი"} ითხოვს ყიდვას
                  {notif.total_price != null ? ` · ჯამი ${Number(notif.total_price).toFixed(2)} ₾` : ""}
                </p>
              ) : (
                <p style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "4px" }}>{notif.message}</p>
              )}

              {isGroup && (
                <ul style={{ fontSize: "0.78rem", opacity: 0.65, margin: "0 0 6px 0", paddingLeft: "16px" }}>
                  {notif.books.map((b) => (
                    <li key={b.book_id}>{b.title} — {Number(b.price).toFixed(2)} ₾</li>
                  ))}
                </ul>
              )}

              <p style={{ fontSize: "0.72rem", opacity: 0.45, marginBottom: "8px" }}>{timeAgo(notif.created_at)}</p>

              {isConfirming ? (
                <div>
                  <p style={{ fontSize: "0.82rem", marginBottom: "8px" }}>
                    {confirming.kind === "confirm"
                      ? "თუ დაადასტურებთ, წიგნი ჩაითვლება გაყიდულად."
                      : confirming.kind === "reject"
                        ? `დარწმუნებული ხართ, რომ თანხა ${notif.counterpart_name ?? "მყიდველისგან"} არ მოგსვლიათ?`
                        : "ნამდვილად გსურთ ამ შეტყობინების წაშლა?"}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-bronze" disabled={busyId === notif.id}
                      onClick={() => {
                        if (confirming.kind === "delete") {
                          deleteNotification(notif.id);
                        } else {
                          runAction(notif, confirming.kind);
                        }
                      }}>
                      {busyId === notif.id ? "..." : "დიახ"}
                    </button>
                    <button style={{ color: "#f3f4f6", opacity: 0.7, background: "none", border: "none", cursor: "pointer" }}
                      disabled={busyId === notif.id} onClick={() => setConfirming(null)}>
                      არა
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  {notif.book_id && (
                    <Link to={`/book/${notif.book_id}`} style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                      წიგნზე გადასვლა
                    </Link>
                  )}
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
                      დაკავშირება
                    </a>
                  )}
                  {notif.type === "purchase_failed" && notif.book_id && (
                    <Link to={`/book/${notif.book_id}`} className="btn-bronze" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                      თავიდან ცდა
                    </Link>
                  )}

                  {notif.type === "payment_check" && (
                    <div style={{ width: "100%", display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                      <button
                        onClick={() => setConfirming({ id: notif.id, kind: "confirm" })}
                        disabled={!notif.request_id}
                        title="თანხა მოვიდა"
                        style={{ color: "#68d391", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                        ✓ თანხა მოვიდა
                      </button>
                      <button
                        onClick={() => setConfirming({ id: notif.id, kind: "reject" })}
                        disabled={!notif.request_id}
                        title="თანხა არ მოვიდა"
                        style={{ color: "#fc8181", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                        ✕ არ მოვიდა
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}