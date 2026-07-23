import { useState, useEffect, useRef } from "react";
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
 * user: ობიექტი ბაზიდან, რომ ველები შევავსოთ
 * hasActiveBooks: boolean, თუ true-ს გადმოაწვდი, ველები სავალდებულო გახდება
 */
export default function EditProfileModal({ open, onClose, onComplete, user, hasActiveBooks }) {
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [phones, setPhones] = useState([""]);
  const [accounts, setAccounts] = useState([{ bank_name: "", account_number: "" }]);
  const [methods, setMethods] = useState([]);
  
  // ფოტოს სტეიტები
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [photoAction, setPhotoAction] = useState(null); // 'upload', 'delete', ან null
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // მონაცემების შევსება user ობიექტიდან
  useEffect(() => {
    if (user && open) {
      setUsername(user.username || "");
      setLocation(user.location || "");
      setBirthYear(user.birth_year || "");
      
      // --- ტელეფონის ნომრები ---
      let phonesToSet = [""];
      try {
        let rawPhones = user.phone_numbers;
        if (typeof rawPhones === "string") rawPhones = JSON.parse(rawPhones);
        if (Array.isArray(rawPhones) && rawPhones.length > 0) phonesToSet = rawPhones;
      } catch (e) {
        console.error("Error parsing phone numbers", e);
      }
      setPhones(phonesToSet);

      // --- საბანკო ანგარიშები (გაძლიერებული პარსვით) ---
      let accountsToSet = [{ bank_name: "", account_number: "" }];
      try {
        let rawAccounts = user.bank_accounts;
        
        if (rawAccounts) {
          // თუ უკვე მასივია
          if (Array.isArray(rawAccounts)) {
            if (rawAccounts.length > 0) accountsToSet = rawAccounts;
          } 
          // თუ სტრინგია
          else if (typeof rawAccounts === "string") {
            let parsed = JSON.parse(rawAccounts);
            // ზოგჯერ JSON.parse ორმაგად დასტრინგულსაც აბრუნებს და მეორედაც ვპარსავთ თუ საჭიროა
            if (typeof parsed === "string") {
              parsed = JSON.parse(parsed);
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
              accountsToSet = parsed;
            }
          }
        }
      } catch (e) {
        console.error("ანგარიშების პარსვას მოჰყვა შეცდომა:", e);
      }
      setAccounts(accountsToSet);
      
      // --- გადაცემის მეთოდები ---
      let methodsToSet = [];
      try {
        let rawMethods = user.selling_method;
        if (typeof rawMethods === "string") rawMethods = JSON.parse(rawMethods);
        if (Array.isArray(rawMethods)) methodsToSet = rawMethods;
      } catch (e) {
        console.error("Error parsing selling methods", e);
      }
      setMethods(methodsToSet);

      setCurrentPhoto(user.profile_picture || null);
      setNewPhotoFile(null);
      setPhotoAction(null);
      setError(null);
    }
  }, [user, open]);

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

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhotoFile(e.target.files[0]);
      setCurrentPhoto(URL.createObjectURL(e.target.files[0])); // Preview
      setPhotoAction("upload");
    }
  };

  const handlePhotoRemove = () => {
    setNewPhotoFile(null);
    setCurrentPhoto(null);
    setPhotoAction("delete");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ვალიდაცია დამოკიდებულია იმაზე, აქვს თუ არა აქტიური წიგნები
  const isProfileDataValid = () => {
    if (!username.trim()) return false; // Username ყოველთვის სავალდებულოა
    
    if (hasActiveBooks) {
      // თუ გამყიდველია და წიგნები უდევს, ყველაფერი სავალდებულოა
      return (
        location.trim() &&
        birthYear &&
        phones.length > 0 && phones.every((p) => p.trim()) &&
        accounts.length > 0 && accounts.every((a) => a.bank_name.trim() && a.account_number.trim()) &&
        methods.length > 0
      );
    }
    return true; // თუ არ უდევს წიგნები, შეუძლია ცარიელი დატოვოს (გარდა username-ისა)
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let latestUserObj = { ...user };

      // 1. თუ ფოტო შეიცვალა ან წაიშალა
      if (photoAction) {
        const formData = new FormData();
        formData.append("action", photoAction);
        if (photoAction === "upload" && newPhotoFile) {
          formData.append("photo", newPhotoFile);
        }

        // ვიყენებთ ზუსტად იმავე authFetch-ს, რომელიც ტექსტური მონაცემებისთვის მუშაობს!
        const photoData = await authFetch("/user/photo", {
          method: "PUT",
          body: formData,
        });

        if (photoData && photoData.user) {
          latestUserObj = photoData.user;
        }
      }

      // 2. ტექსტური მონაცემების განახლება
      const textData = await authFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          username: username.trim(),
          location: location.trim(),
          phone_numbers: phones.map((p) => p.trim()).filter(Boolean),
          bank_accounts: accounts.filter(a => a.bank_name.trim() && a.account_number.trim()),
          birth_year: birthYear ? Number(birthYear) : null,
          selling_method: methods,
        }),
      });

      if (textData && textData.user) {
        latestUserObj = textData.user;
      }

      onComplete(latestUserObj);
      onClose();

    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
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
        <h3 style={{ marginBottom: "4px" }}>პროფილის რედაქტირება</h3>
        {hasActiveBooks && (
          <p style={{ fontSize: "0.85rem", color: "var(--accent)", marginBottom: "16px" }}>
            რადგან გაყიდვაში გაქვთ წიგნები, რეკვიზიტების დატოვება სავალდებულოა.
          </p>
        )}

        {error && <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</p>}

        {/* პროფილის ფოტო */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.1)",
            backgroundImage: currentPhoto ? `url(${currentPhoto})` : "none",
            backgroundSize: "cover", backgroundPosition: "center"
          }} />
          <div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handlePhotoSelect} 
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{...addBtnStyle, marginRight: "10px"}}>
              ფოტოს შეცვლა
            </button>
            {currentPhoto && (
              <button type="button" onClick={handlePhotoRemove} style={removeBtnStyle}>
                წაშლა
              </button>
            )}
          </div>
        </div>

        <label style={fieldLabelStyle}>მომხმარებლის სახელი (Username)*</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />

        <label style={fieldLabelStyle}>ლოკაცია {hasActiveBooks ? "*" : ""}</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="მაგ: თბილისი, ვაკე" style={inputStyle} />

        <label style={fieldLabelStyle}>დაბადების წელი {hasActiveBooks ? "*" : ""}</label>
        <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
          placeholder="1998" min={1900} max={2026} style={inputStyle} />

        <label style={fieldLabelStyle}>ტელეფონის ნომრები {hasActiveBooks ? "*" : ""}</label>
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

        <label style={{ ...fieldLabelStyle, marginTop: "16px" }}>საბანკო ანგარიშები {hasActiveBooks ? "*" : ""}</label>
        {accounts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input 
                list="bank-names" 
                value={a.bank_name || ""} /* <-- აქ || "" დაამატე */
                onChange={(e) => updateAccount(i, "bank_name", e.target.value)}
                placeholder="ბანკის სახელი" 
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }} 
            />
            <input 
                value={a.account_number || ""} /* <-- აქ || "" დაამატე */
                onChange={(e) => updateAccount(i, "account_number", e.target.value)}
                placeholder="ანგარიშის ნომერი (IBAN)" 
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }} 
            />
            {accounts.length > 1 && (
              <button type="button" onClick={() => removeAccount(i)} style={removeBtnStyle}>✕</button>
            )}
          </div>
        ))}
        <datalist id="bank-names">
          {BANK_SUGGESTIONS.map((b) => <option key={b} value={b} />)}
        </datalist>
        <button type="button" onClick={addAccount} style={addBtnStyle}>+ ანგარიშის დამატება</button>

        <label style={{ ...fieldLabelStyle, marginTop: "16px" }}>წიგნის გადაცემის ხერხი {hasActiveBooks ? "*" : ""}</label>
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
          <button type="button" onClick={onClose} style={{ background: "none", color: "#f3f4f6", border: "none", opacity: 0.7, cursor: "pointer" }}>
            გაუქმება
          </button>
          <button type="button" className="btn-bronze" disabled={!isProfileDataValid() || submitting} onClick={submit}>
            {submitting ? "..." : "შენახვა"}
          </button>
        </div>
      </div>
    </div>
  );
}