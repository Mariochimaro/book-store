import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// ── shared: close on Escape + lock body scroll ──────────────
function useModalBehavior(onClose) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
}

// ── Login ────────────────────────────────────────────────────
export function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  useModalBehavior(onClose);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password);

    setLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-heading"
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title" id="login-heading">
          კეთილი იყოს თქვენი დაბრუნება
        </h2>
        <p className="modal-sub">Welcome back — enter the archive</p>

        <form onSubmit={handleSubmit}>
          <label className="modal-lbl" htmlFor="li-email">Email</label>
          <input
            id="li-email"
            type="email"
            className="modal-inp"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="modal-lbl" htmlFor="li-pw">Password</label>
          <input
            id="li-pw"
            type="password"
            className="modal-inp"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <p className="modal-hint">Admin demo: admin@darklibrary.com / admin</p>

          {error && <p className="modal-error" role="alert">{error}</p>}

          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? "Signing in…" : "შესვლა — Enter"}
          </button>
        </form>

        <p className="modal-footer">
          Don't have an account?{" "}
          <button className="modal-link" onClick={onSwitchToRegister}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Register ─────────────────────────────────────────────────
export function RegisterModal({ onClose, onSwitchToLogin }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { register }            = useAuth();
  useModalBehavior(onClose);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = register(name, email, password);

    setLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reg-heading"
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title" id="reg-heading">შემოგვიერთდით</h2>
        <p className="modal-sub">Create an account to join the Georgian Bookstore</p>

        <form onSubmit={handleSubmit}>
          <label className="modal-lbl" htmlFor="reg-name">Name</label>
          <input
            id="reg-name"
            type="text"
            className="modal-inp"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoFocus
          />

          <label className="modal-lbl" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            className="modal-inp"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="modal-lbl" htmlFor="reg-pw">Password</label>
          <input
            id="reg-pw"
            type="password"
            className="modal-inp"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && <p className="modal-error" role="alert">{error}</p>}

          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? "Creating account…" : "რეგისტრაცია — Register"}
          </button>
        </form>

        <p className="modal-footer">
          Already have an account?{" "}
          <button className="modal-link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
