import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const UserBookInteractionsContext = createContext(null);

export function UserBookInteractionsProvider({ children }) {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());
  const [ratings, setRatings] = useState({}); // { [book_id]: "like" | "dislike" }
  const [loaded, setLoaded] = useState(false);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setBookmarkedIds(new Set());
      setRatings({});
      setLoaded(true);
      return;
    }

    try {
      const [bmRes, rtRes] = await Promise.all([
        fetch(`${API_URL}/books/bookmarks/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/books/ratings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (bmRes.ok) {
        const data = await bmRes.json();
        setBookmarkedIds(new Set(data.book_ids ?? []));
      }
      if (rtRes.ok) {
        const data = await rtRes.json();
        setRatings(data.ratings ?? {});
      }
    } catch {
      // Network error — leave state as-is; UI just shows the default (unset) state
    } finally {
      setLoaded(true);
    }
  }, []);

  // Refetch whenever the logged-in user changes (login, logout, switch account)
  useEffect(() => {
    if (user) {
      fetchAll();
    } else {
      setBookmarkedIds(new Set());
      setRatings({});
      setLoaded(true);
    }
  }, [user, fetchAll]);

  const setBookmark = useCallback((bookId, value) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(bookId);
      else next.delete(bookId);
      return next;
    });
  }, []);

  const setRating = useCallback((bookId, value) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (value === null) delete next[bookId];
      else next[bookId] = value;
      return next;
    });
  }, []);

  return (
    <UserBookInteractionsContext.Provider
      value={{ bookmarkedIds, ratings, loaded, setBookmark, setRating, refresh: fetchAll }}
    >
      {children}
    </UserBookInteractionsContext.Provider>
  );
}

export function useUserBookInteractions() {
  const ctx = useContext(UserBookInteractionsContext);
  if (!ctx) {
    throw new Error("useUserBookInteractions must be used within a UserBookInteractionsProvider");
  }
  return ctx;
}