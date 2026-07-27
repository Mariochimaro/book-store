import { useState, useEffect } from "react";
import { authHeaders } from "../../context/AuthContext";
import "./Styles/logs.css";

const API_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────────────────────
// LOGS PANEL — real data from /admin/audit-logs, nginx-style format
// ─────────────────────────────────────────────────────────────
function LogsPanel({ initialQuery = "" }) {
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
export default LogsPanel;