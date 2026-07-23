import { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── /auth/me - მომხმარებლის მონაცემების ხელახლა წამოღება ──
  async function refreshUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("invalid token");
      const meData = await res.json();
      setUser(meData);
      return meData;
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    }
  }

  // ── Mount: localStorage-ში token თუ გვაქვს ──
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  // ── Login ──
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

  // ── setSession ──
  async function setSession(token) {
    if (!token) return { success: false, error: "ტოკენი არ მოვიდა" };
    localStorage.setItem("token", token);
    const meData = await refreshUser();
    if (meData) {
      return { success: true };
    } else {
      return { success: false, error: "სესიის დაწყება ვერ მოხერხდა" };
    }
  }

  // ── Logout ──
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        setSession,
        refreshUser,
        loading,
        isLoggedIn: !!user,
      }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}