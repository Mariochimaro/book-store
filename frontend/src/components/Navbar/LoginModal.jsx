import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Styles/auth.css"

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

// FastAPI-ს error detail შეიძლება იყოს:
// - string (ჩვენი საკუთარი HTTPException-ები)
// - obj-ების მასივი (Pydantic-ის ავტომატური 422 validation errors)
// ეს ფუნქცია ორივე შემთხვევას სწორ string-ად აქცევს, რომ React-მა არ ჩამოაგდოს app
function extractErrorMessage(data) {
  if (!data) return "შეცდომა";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => e?.msg ?? "არასწორი მონაცემები")
      .join(", ");
  }
  return "შეცდომა";
}

export function LoginModal({ onClose, onSwitchToRegister }) {
  const { login } = useAuth();
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
      const result = await login(email, password);
      if (result.success) {
        onClose();
      } else {
        setError(extractErrorMessage({ detail: result.error }));
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