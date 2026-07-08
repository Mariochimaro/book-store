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

      localStorage.setItem("token", data.access_token);

      // token მივიღეთ — ახლა ვიღებთ სრულ user ობიექტს
      const meRes  = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const meData = await meRes.json();
      setUser(meData);
      return { success: true };
    } catch {
      return { success: false, error: "სერვერთან კავშირი ვერ მოხერხდა" };
    }
  }

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isLoggedIn: !!user }}>
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
