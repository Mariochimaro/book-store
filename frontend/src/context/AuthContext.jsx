import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /**
   * Mock login — swap the body for a real fetch() when the backend is ready.
   * Returns { success: true } or { success: false, error: string }.
   */
  function login(email, password) {
    if (!email || !password) {
      return { success: false, error: "Please fill in all fields." };
    }
    if (password.length < 3) {
      return { success: false, error: "Password must be at least 3 characters." };
    }

    // Admin demo credentials
    if (email === "admin@darklibrary.com" && password === "admin") {
      setUser({ name: "Admin", email, role: "admin" });
      return { success: true };
    }

    // Accept any valid-looking credentials (mock backend behaviour)
    const nameFromEmail = email.split("@")[0].replace(/[._]/g, " ");
    const displayName   = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    setUser({ name: displayName, email, role: "user" });
    return { success: true };
  }

  /**
   * Mock register — auto-logs in the new user on success.
   */
  function register(name, email, password) {
    if (!name.trim() || !email || !password) {
      return { success: false, error: "Please fill in all fields." };
    }
    if (password.length < 3) {
      return { success: false, error: "Password must be at least 3 characters." };
    }

    setUser({ name: name.trim(), email, role: "user" });
    return { success: true };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
