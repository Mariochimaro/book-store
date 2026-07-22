import { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // token-ის შემოწმება mount-ზე

  // ── Mount: localStorage-ში token თუ გვაქვს, /auth/me-ს ვეკითხებით ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid token");
        return res.json();
      })
      .then((data) => { setUser(data); })
      .catch(() => { localStorage.removeItem("token"); })
      .finally(() => { setLoading(false); });
  }, []);

  // ── Login: API call → token save → user set ──────────────
  async function login(email, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail ?? "შეცდომა" };

      return setSession(data.access_token);
    } catch {
      return { success: false, error: "სერვერთან კავშირი ვერ მოხერხდა" };
    }
  }

  // ── setSession: token უკვე გვაქვს (მაგ. /auth/register-იდან) ──
  // მხოლოდ ვინახავთ localStorage-ში და ვიღებთ /auth/me-ს, login-ის
  // ცალკე request-ის გარეშე. login()-იც ამას იყენებს token-ის მიღების
  // შემდეგ, რომ user state-ის დაყენების ლოგიკა ერთ ადგილას იყოს.
  async function setSession(token) {
    if (!token) return { success: false, error: "ტოკენი არ მოვიდა" };
    localStorage.setItem("token", token);
    try {
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("invalid token");
      const meData = await meRes.json();
      setUser(meData);
      return { success: true };
    } catch {
      localStorage.removeItem("token");
      return { success: false, error: "სესიის დაწყება ვერ მოხერხდა" };
    }
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setSession, loading, isLoggedIn: !!user }}>
      {/* loading-ის დროს არაფერს არ ვრენდერავთ — თავიდან ავიცილებთ "ცარიელ flash"-ს */}
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
