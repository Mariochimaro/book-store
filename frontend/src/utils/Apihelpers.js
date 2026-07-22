const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_DOMAINS = ["gmail.com", "googlemail.com"];

// book_requests.status -> display label. Matches the enum values actually
// used across buy_book/timerworker/confirm/reject.
export const REQUEST_STATUS_LABELS = {
  waiting:           { label: "რიგში",               color: "#a0aec0" },
  active_timer:      { label: "გადახდის მოლოდინში",  color: "#f6e05e" },
  checking_payment:  { label: "გადახდა მოწმდება",     color: "#f6e05e" },
  completed:         { label: "დასრულებული",          color: "#68d391" },
  rejected:          { label: "უარყოფილი",            color: "#fc8181" },
  cancelled:         { label: "გაუქმებული",           color: "#a0aec0" },
};

/**
 * Parses back-end validation errors (including Pydantic structural errors)
 * into a user-friendly Georgian string.
 */
function extractErrorMessage(data) {
  if (!data) return "დაფიქსირდა შეცდომა";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e?.msg ?? "არასწორი მონაცემები").join(", ");
  }
  return "დაფიქსირდა შეცდომა";
}

/**
 * Core fetch wrapper: Automatically appends API_URL, attaches the Authorization 
 * Bearer token, handles JSON content-type wrapping safely, and parses errors 
 * directly into raw string formats so .catch((e) => setError(e.message)) won't crash.
 *
 * @param {string} path - e.g., "/user/onboarding"
 * @param {RequestInit} options - Standard fetch configurations
 * @returns {Promise<any>} - Resolved JSON response
 */
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };

  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
}

/**
 * Convenience wrapper specifically for sending multi-part Form Data files.
 * Reuses core authFetch logic to avoid code duplication.
 */
export function authFetchForm(path, formData) {
  return authFetch(path, {
    method: "POST",
    body: formData,
  });
}

/** 
 * Returns a Google Chat DM link for Google accounts, 
 * or a classic standard mailto: link for other domains.
 */
export function contactHref(email) {
  if (!email) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && GOOGLE_DOMAINS.includes(domain)) {
    return `https://mail.google.com/chat/u/0/#chat/dm/${encodeURIComponent(email)}`;
  }
  return `mailto:${email}`;
}

/** Converts timestamps into descriptive relative time frames in Georgian. */
export function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return "ახლახან";
  if (seconds < 60) return `${seconds} წამის წინ`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} წუთის წინ`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} საათის წინ`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} დღის წინ`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} თვის წინ`;

  const years = Math.floor(months / 12);
  return `${years} წლის წინ`;
}

/** Formats values into Georgian Lari currency syntax. */
export function formatMoney(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `${n.toFixed(2)} ₾` : "—";
}