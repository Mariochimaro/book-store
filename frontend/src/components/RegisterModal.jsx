import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function useModalBehavior(onClose) {
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
}

export function RegisterModal({ onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  useModalBehavior(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "შეცდომა");
      } else {
        // რეგისტრაციის შემდეგ login modal-ზე გადასვლა
        onSwitchToLogin();
      }
    } catch {
      setError("სერვერთან კავშირი ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reg-heading">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title" id="reg-heading">შემოგვიერთდით</h2>
        <p className="modal-sub">Create an account to join the Georgian Bookstore</p>

        <form onSubmit={handleSubmit}>
          <label className="modal-lbl" htmlFor="reg-name">Username</label>
          <input
            id="reg-name" type="text" className="modal-inp"
            placeholder="Your username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" required autoFocus
          />

          <label className="modal-lbl" htmlFor="reg-email">Email</label>
          <input
            id="reg-email" type="email" className="modal-inp"
            placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required
          />

          <label className="modal-lbl" htmlFor="reg-pw">Password</label>
          <input
            id="reg-pw" type="password" className="modal-inp"
            placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" required
          />

          {error && (
            <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "8px" }}>{error}</p>
          )}

          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? "..." : "რეგისტრაცია — Register"}
          </button>
        </form>

        <p className="modal-footer">
          Already have an account?{" "}
          <button className="modal-link" onClick={onSwitchToLogin}>Sign in</button>
        </p>
      </div>
    </div>
  );
}