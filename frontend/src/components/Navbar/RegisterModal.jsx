import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

// იგივე წესები, რაც ბექენდზეა (auth.py-ის username_alphanumeric და
// password_complexity Pydantic validator-ები) — მომხმარებელმა შეცდომა
// დაუყოვნებლივ დაინახოს, network round-trip-მდე.
function validateUsername(v) {
  if ((v.match(/ /g) || []).length > 2) {
    return "მომხმარებლის სახელი არ უნდა შეიცავდეს 2-ზე მეტ სფეისს.";
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(v)) {
    return "მომხმარებლის სახელი უნდა შეიცავდეს მხოლოდ ასოებს, ციფრებს და სფეისებს.";
  }
  if (v.startsWith(" ") || v.endsWith(" ")) {
    return "მომხმარებლის სახელი არ უნდა იწყებოდეს ან მთავრდებოდეს სფეისით.";
  }
  return null;
}

function validatePassword(v) {
  if (v.length < 8) {
    return "პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან.";
  }
  return null;
}

// FastAPI-ს 422 error detail შეიძლება იყოს string ან Pydantic
// validation error-ების მასივი — ორივე უსაფრთხოდ string-ად ვაქციოთ
// (იგივე ფიქსი, რაც LoginModal.jsx-შია).
function extractErrorMessage(data) {
  if (!data) return "შეცდომა";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e?.msg ?? "არასწორი მონაცემები").join(", ");
  }
  return "შეცდომა";
}

export function RegisterModal({ onClose, onSwitchToLogin }) {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  useModalBehavior(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(username);
    if (usernameError) { setError(usernameError); return; }
    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(extractErrorMessage(data));
        return;
      }

      // /auth/register ახლა პირდაპირ აბრუნებს access_token-საც (ცალკე
      // POST /auth/login აღარ სჭირდება) — setSession უბრალოდ ინახავს
      // token-ს და იღებს /auth/me-ს, რომ Navbar-მაც მაშინვე დაინახოს
      // ავტორიზებული მდგომარეობა.
      const sessionResult = await setSession(data.access_token);
      if (!sessionResult.success) {
        // ძალიან იშვიათი edge case — რეგისტრაცია მოხერხდა, მაგრამ
        // სესიის დაწყება ვერ. მაინც წარმატებულად ჩავთვალოთ და login-ზე გადავიდეთ.
        onSwitchToLogin();
        return;
      }

      onClose();
      navigate("/");
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
            autoComplete="new-password" required minLength={8}
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