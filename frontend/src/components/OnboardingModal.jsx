import { useState } from "react";
import { authFetch } from "./Apihelpers";

const fieldLabelStyle = { display: "block", fontSize: "0.8rem", opacity: 0.7, marginBottom: "6px", marginTop: "4px" };
const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)",
  color: "inherit", fontSize: "0.9rem", marginBottom: "8px", boxSizing: "border-box",
};
const removeBtnStyle = { background: "none", border: "none", color: "#fc8181", cursor: "pointer", fontSize: "0.9rem" };
const addBtnStyle = { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", padding: 0, marginBottom: "8px" };

const BANK_SUGGESTIONS = ["საქართველოს ბანკი", "თიბისი ბანკი", "ლიბერთი ბანკი", "ბაზისბანკი"];
const SELLING_METHODS = [
  { id: "meetup", label: "პირადი შეხვედრა" },
  { id: "delivery", label: "საკურიერო მიწოდება" },
];

/**
 * Seller onboarding modal.
 * Collects location, phone numbers, bank accounts, birth year, and selling
 * method, then POSTs to /user/onboarding. On success calls onComplete(user)
 * with the updated user object returned by the backend.
 *
 * Usage (e.g. in Profile.jsx):
 *   <OnboardingModal
 *     open={onboardingOpen}
 *     onClose={() => setOnboardingOpen(false)}
 *     onComplete={(updatedUser) => { ... }}
 *   />
 */
export default function OnboardingModal({ open, onClose, onComplete }) {
  const [location, setLocation] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [phones, setPhones] = useState([""]);
  const [accounts, setAccounts] = useState([{ bank_name: "", account_number: "" }]);
  const [methods, setMethods] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const toggleMethod = (m) =>
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const updatePhone = (i, val) => setPhones((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  const addPhone = () => setPhones((prev) => [...prev, ""]);
  const removePhone = (i) => setPhones((prev) => prev.filter((_, idx) => idx !== i));

  const updateAccount = (i, field, val) =>
    setAccounts((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: val } : a)));
  const addAccount = () => setAccounts((prev) => [...prev, { bank_name: "", account_number: "" }]);
  const removeAccount = (i) => setAccounts((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    location.trim() &&
    birthYear &&
    phones.length > 0 && phones.every((p) => p.trim()) &&
    accounts.length > 0 && accounts.every((a) => a.bank_name.trim() && a.account_number.trim()) &&
    methods.length > 0;

  const submit = () => {
    setSubmitting(true);
    setError(null);
    authFetch("/user/onboarding", {
      method: "POST",
      body: JSON.stringify({
        location: location.trim(),
        phone_numbers: phones.map((p) => p.trim()),
        bank_accounts: accounts.map((a) => ({ bank_name: a.bank_name.trim(), account_number: a.account_number.trim() })),
        birth_year: Number(birthYear),
        selling_method: methods,
      }),
    })
      .then((data) => onComplete(data.user))
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)", borderRadius: "12px", padding: "24px",
          maxWidth: "480px", width: "100%", maxHeight: "85vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "4px" }}>გამყიდველის პროფილის შევსება</h3>
        <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "16px" }}>
          წიგნის ასატვირთად საჭიროა ეს ინფორმაცია — ვინც იყიდის, აქედან მიიღებს რეკვიზიტებს.
        </p>

        {error && <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</p>}

        <label style={fieldLabelStyle}>ლოკაცია</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="მაგ: თბილისი, ვაკე" style={inputStyle} />

        <label style={fieldLabelStyle}>დაბადების წელი</label>
        <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
          placeholder="1998" min={1900} max={2026} style={inputStyle} />

        <label style={fieldLabelStyle}>ტელეფონის ნომრები</label>
        {phones.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input value={p} onChange={(e) => updatePhone(i, e.target.value)}
              placeholder="5xx xxx xxx" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            {phones.length > 1 && (
              <button type="button" onClick={() => removePhone(i)} style={removeBtnStyle}>✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addPhone} style={addBtnStyle}>+ ნომრის დამატება</button>

        <label style={{ ...fieldLabelStyle, marginTop: "16px" }}>საბანკო ანგარიშები</label>
        {accounts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input list="bank-names" value={a.bank_name}
              onChange={(e) => updateAccount(i, "bank_name", e.target.value)}
              placeholder="ბანკის სახელი" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            <input value={a.account_number}
              onChange={(e) => updateAccount(i, "account_number", e.target.value)}
              placeholder="ანგარიშის ნომერი (IBAN)" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
            {accounts.length > 1 && (
              <button type="button" onClick={() => removeAccount(i)} style={removeBtnStyle}>✕</button>
            )}
          </div>
        ))}
        <datalist id="bank-names">
          {BANK_SUGGESTIONS.map((b) => <option key={b} value={b} />)}
        </datalist>
        <button type="button" onClick={addAccount} style={addBtnStyle}>+ ანგარიშის დამატება</button>

        <label style={{ ...fieldLabelStyle, marginTop: "16px" }}>წიგნის გადაცემის ხერხი</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {SELLING_METHODS.map((m) => (
            <button key={m.id} type="button" onClick={() => toggleMethod(m.id)}
              style={{
                flex: 1, padding: "10px", borderRadius: "8px",
                border: methods.includes(m.id) ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.15)",
                background: methods.includes(m.id) ? "rgba(255,255,255,0.06)" : "transparent",
                color: "inherit", cursor: "pointer", fontSize: "0.85rem",
              }}>
              {methods.includes(m.id) ? "✓ " : ""}{m.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", opacity: 0.7, cursor: "pointer" }}>
            გაუქმება
          </button>
          <button type="button" className="btn-bronze" disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? "..." : "შენახვა და გაგრძელება"}
          </button>
        </div>
      </div>
    </div>
  );
}