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

export function LoginModal({ onClose, onSwitchToRegister }) {
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "შეცდომა");
      } else {
        localStorage.setItem("token", data.access_token);
        onClose();
        // TODO: replace reload with proper auth context
        window.location.reload();
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
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="login-heading">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title" id="login-heading">კეთილი იყოს თქვენი დაბრუნება</h2>
        <p className="modal-sub">Welcome back — enter the archive</p>

        <form onSubmit={handleSubmit}>
          <label className="modal-lbl" htmlFor="li-email">Email</label>
          <input
            id="li-email" type="email" className="modal-inp"
            placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required
          />

          <label className="modal-lbl" htmlFor="li-pw">Password</label>
          <input
            id="li-pw" type="password" className="modal-inp"
            placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required
          />

          {error && (
            <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "8px" }}>{error}</p>
          )}

          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? "..." : "შესვლა — Enter"}
          </button>
        </form>

        <p className="modal-footer">
          Don&apos;t have an account?{" "}
          <button className="modal-link" onClick={onSwitchToRegister}>Sign up</button>
        </p>
      </div>
    </div>
  );
}