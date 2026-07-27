import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookPlus, PackageOpen, Trash2, Eye, Pencil, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { authFetch, formatMoney } from "../../context/Apihelpers";
import OnboardingModal from "./OnboardingModal";
import AddBook from "./AddBook";
import { StoreIcon } from "../icons";
import { Upload, Check } from "lucide-react";

/**
 * MyListingsTab — "ჩემი წიგნები" ტაბი Profile-ში.
 */
export default function MyListingsTab({ onOpenAddBook }) {
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false); // AddBook-ის მდგომარეობა (state)

  const [editingBook, setEditingBook] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [previewBook, setPreviewBook] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewClick = (book) => {
    setPreviewBook(book);
    setShowPreview(true);
  };

  const computeOnboarded = (profile) =>
    Boolean(
      profile?.location &&
      profile?.phone_numbers?.length
    );

  const loadListings = useCallback(() => {
    setLoadingListings(true);
    setError(null);
    authFetch("/user/my-books")
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingListings(false));
  }, []);

  const checkOnboardingStatus = useCallback(() => {
    setCheckingProfile(true);
    setError(null);
    authFetch("/user/profile")
      .then((profile) => {
        const onboarded = computeOnboarded(profile);
        setIsOnboarded(onboarded);
        if (onboarded) loadListings();
      })
      .catch((e) => setError(e.message))
      .finally(() => setCheckingProfile(false));
  }, [loadListings]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);


  const handleAddClick = () => {
    if (isOnboarded) {
      setShowAddBook(true);
    } else {
      setShowOnboarding(true);
    }
  };

  const handleAddBookOpenChange = (isOpen) => {
    setShowAddBook(isOpen);
    if (!isOpen) {
      // მოდალი დაიხურა, ვაახლებთ სიას
      loadListings();
    }
  };

  const handleEditClick = (book) => {
    setEditingBook(book);
    setShowEditModal(true);
  };

  const handleEditSaved = () => {
    setShowEditModal(false);
    setEditingBook(null);
    loadListings();
  };

  const handleDelete = (bookId, title) => {
    if (!window.confirm(`ნამდვილად გსურთ "${title}"-ის წაშლა?`)) return;
    setDeletingId(bookId);
    authFetch(`/books/${bookId}/delete`, { method: "DELETE" })
      .then(() => setListings((prev) => prev.filter((b) => b.id !== bookId)))
      .catch((e) => alert(e.message))
      .finally(() => setDeletingId(null));
  };

  const getStatusBadge = (book) => {
    if (book.status === "sold") return { text: "გაყიდულია", color: "#8fbc8f" };
    if (book.rejection_reason) return { text: "უარყოფილია", color: "#fc8181" };
    if (!book.is_approved) return { text: "დასტურის მოლოდინში", color: "#f0c674" };
    return { text: "აქტიური", color: "#8fbc8f" };
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsOnboarded(true); // ვაახლებთ სტატუსს
    loadListings();       // ვტვირთავთ სიას
  };

  // ── საწყისი შემოწმება ──
  if (checkingProfile) {
    return <div className="pf-card"><p className="pf-card-body">იტვირთება...</p></div>;
  }

  // ── ჯერ არ არის გავლილი გამყიდველის ონბორდინგი ──
  if (!isOnboarded) {
    return (
      <>
        <div className="pf-card">
          <p className="pf-card-title"><StoreIcon size={15} /> გამყიდველის პროფილი</p>
          <p className="pf-card-body">
            წიგნების გასაყიდად გამოსაქვეყნებლად საჭიროა გამყიდველის მონაცემების შევსება.
          </p>
          <button className="btn-bronze" onClick={() => setShowOnboarding(true)}>
            <StoreIcon size={13} /> გამყიდველად რეგისტრაცია
          </button>
        </div>

        <OnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />
      </>
    );
  }

  // ── გამყიდველია — წიგნების ჩამონათვალი (Wishlist-ის სტილში) ──
  return (
    <>
      <div className="pf-listings-header">
        <p className="pf-card-title" style={{ margin: 0 }}>
          <StoreIcon size={15} /> ჩემი წიგნები
        </p>
        <button className="btn-bronze" onClick={handleAddClick}>
          <BookPlus size={14} /> წიგნის დამატება
        </button>
      </div>

      {loadingListings && (
        <p style={{ padding: "20px", opacity: 0.5 }}>იტვირთება...</p>
      )}

      {!loadingListings && error && (
        <div className="pf-card">
          <p className="pf-card-body" style={{ color: "#fc8181" }}>{error}</p>
          <button className="btn-bronze" onClick={loadListings}>ხელახლა ცდა</button>
        </div>
      )}

      {!loadingListings && !error && listings.length === 0 && (
        <div className="pf-empty">
          <PackageOpen size={48} className="pf-empty-icon" strokeWidth="1.3" />
          <p className="pf-empty-title">ჯერ არცერთი წიგნი არ გაქვთ დამატებული</p>
          <p className="pf-empty-sub">დააჭირეთ „წიგნის დამატება" ღილაკს რომ დაიწყოთ.</p>
        </div>
      )}

      {!loadingListings && !error && listings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {listings.map((book) => {
            const badge = getStatusBadge(book);
            const cover = book.photos_urls?.[0] ||
              "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop";
            return (
              <div key={book.id} style={{ display: "flex", gap: "14px", alignItems: "center",
                background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
                <img src={cover} alt={book.title}
                  style={{ width: "50px", height: "68px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {book.title}
                    </p>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px",
                      background: badge.color, color: "#08091a", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {badge.text}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", opacity: 0.6, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span>{formatMoney(book.price)}</span>
                    <span>· {book.condition}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      · <Eye size={12} /> {book.views ?? 0}
                    </span>
                  </p>
                  {book.rejection_reason && (
                    <p style={{ fontSize: "0.78rem", color: "#fc8181" }}>მიზეზი: {book.rejection_reason}</p>
                  )}
                </div>

                <button onClick={() => handleEditClick(book)}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem",
                    display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}
                  title="რედაქტირება">
                  <Pencil size={13} /> რედაქტირება
                </button>

                <button
                  onClick={() => handlePreviewClick(book)}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                >
                  ნახვა
                </button>

                <button onClick={() => handleDelete(book.id, book.title)} disabled={deletingId === book.id}
                  style={{ background: "none", border: "none", color: "#fc8181", cursor: "pointer", fontSize: "0.8rem" }}
                  title="წაშლა">
                  {deletingId === book.id ? "..." : <Trash2 size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddBook
        open={showAddBook}
        onOpenChange={handleAddBookOpenChange}
      />

      <EditBookModal
        book={editingBook}
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingBook(null); }}
        onSaved={handleEditSaved}
      />

      <ListingPreviewModal
        book={previewBook}
        open={showPreview}
        onClose={() => { setShowPreview(false); setPreviewBook(null); }}
      />
    </>
  );
}

const CONDITION_LABELS = {
  new:     "ახალი",
  good:    "კარგი",
  average: "საშუალო",
  damaged: "დაზიანებული",
};

function ListingPreviewModal({ book, open, onClose }) {
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (open) setActivePhoto(0);
  }, [book, open]);

  if (!open || !book) return null;

  const photos = book.photos_urls ?? [];
  const hasVideo = !!book.book_video_url;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)", borderRadius: "12px", width: "100%",
          maxWidth: "760px", maxHeight: "90vh", overflowY: "auto", padding: "24px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="დახურვა"
          style={{
            position: "absolute", top: "14px", right: "14px", background: "none",
            border: "none", cursor: "pointer", color: "#F4E8D8", opacity: 0.7,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          {/* ─── MEDIA ─── */}
          <div>
            {hasVideo && activePhoto === photos.length ? (
              <video
                src={book.book_video_url}
                controls
                playsInline
                controlsList="nodownload"
                style={{ width: "240px", height: "320px", backgroundColor: "#000", objectFit: "contain", borderRadius: "8px" }}
              />
            ) : (
              <img
                src={photos[activePhoto] ?? "/placeholder.jpg"}
                alt={book.title}
                style={{ width: "240px", height: "320px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}

            {(photos.length > 1 || hasVideo) && (
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: "50px", height: "68px", objectFit: "cover", borderRadius: "4px", cursor: "pointer",
                      opacity: i === activePhoto ? 1 : 0.5,
                      border: i === activePhoto ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  />
                ))}
                {hasVideo && (
                  <div
                    onClick={() => setActivePhoto(photos.length)}
                    style={{
                      width: "50px", height: "68px", backgroundColor: "#1a202c",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "4px", cursor: "pointer",
                      opacity: activePhoto === photos.length ? 1 : 0.5,
                      border: activePhoto === photos.length ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <span style={{ color: "#fff", fontSize: "1rem" }}>▶</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── DETAILS ─── */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h2 style={{ marginBottom: "6px" }}>{book.title}</h2>
            {book.author && <p style={{ color: "var(--text-muted)", marginBottom: "4px" }}>{book.author}</p>}

            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)", margin: "10px 0" }}>
              {book.price} ₾
            </p>

            <p><strong>მდგომარეობა:</strong> {CONDITION_LABELS[book.condition] ?? book.condition}</p>
            {book.language && <p><strong>ენა:</strong> {book.language}</p>}
            {book.genres?.length > 0 && <p><strong>ჟანრი:</strong> {book.genres.join(", ")}</p>}
            {book.publication_year && <p><strong>გამოცემის წელი:</strong> {book.publication_year}</p>}

            {book.description && (
              <p style={{ marginTop: "14px", lineHeight: "1.6", fontSize: "0.92rem" }}>{book.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadField({ label, required, accept, onChange, fileName }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px", display: "block" }}>
        {label}
      </label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: fileName ? "1px solid #8fbc8f80" : "1px dashed #ffffff35",
          background: fileName ? "#8fbc8f14" : "#08091a",
          cursor: "pointer",
          transition: "border-color 0.15s, background-color 0.15s",
          fontSize: "0.85rem",
        }}
        onMouseOver={(e) => { if (!fileName) e.currentTarget.style.borderColor = "#c97d3a80"; }}
        onMouseOut={(e) => { if (!fileName) e.currentTarget.style.borderColor = "#ffffff35"; }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: fileName ? "#8fbc8f30" : "#c97d3a25",
            color: fileName ? "#8fbc8f" : "#d6a05a",
            flexShrink: 0,
          }}
        >
          {fileName ? <Check size={15} /> : <Upload size={14} />}
        </span>

        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: fileName ? 1 : 0.6 }}>
          {fileName ?? "ფაილის არჩევა..."}
        </span>

        {required && !fileName && (
          <span style={{ fontSize: "0.7rem", color: "#d6a05a", flexShrink: 0 }}>საჭირო</span>
        )}

        <input
          type="file"
          accept={accept}
          onChange={onChange}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            opacity: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        />
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT BOOK MODAL — დეტალები / ფოტოები / ვიდეო
// ─────────────────────────────────────────────────────────────
function EditBookModal({ book, open, onClose, onSaved }) {
  const [tab, setTab] = useState("details");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [genresInput, setGenresInput] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [condition, setCondition] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // photoSlots[i] = { existingUrl: string|null, newFile: File|null, previewUrl: string }
  const [photoSlots, setPhotoSlots] = useState([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState(null);

  const [existingVideoUrl, setExistingVideoUrl] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);

  useEffect(() => {
    if (book && open) {
      setTab("details");
      setTitle(book.title ?? "");
      setDescription(book.description ?? "");
      setPrice(book.price ?? "");
      setGenresInput((book.genres ?? []).join(", "));
      setPublicationYear(book.publication_year ?? "");
      setCondition(book.condition ?? "");

      const urls = book.photos_urls ?? [];
      setPhotoSlots(
        Array.from({ length: 5 }, (_, i) => ({
          existingUrl: urls[i] ?? null,
          newFile: null,
          previewUrl: urls[i] ?? null,
        }))
      );

      setExistingVideoUrl(book.book_video_url ?? null);
      setVideoFile(null);

      setDetailsError(null);
      setPhotosError(null);
      setVideoError(null);
    }
  }, [book, open]);

  if (!open || !book) return null;

  const submitDetails = (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsError(null);
    const payload = {
      title,
      description,
      price: Number(price),
      genres: genresInput.split(",").map((g) => g.trim()).filter(Boolean),
      publication_year: Number(publicationYear),
      condition,
    };
    authFetch(`/books/${book.id}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => onSaved())
      .catch((e) => setDetailsError(e.message))
      .finally(() => setSavingDetails(false));
  };

  const handlePhotoChange = (index, file) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        newFile: file,
        previewUrl: file ? URL.createObjectURL(file) : next[index].existingUrl,
      };
      return next;
    });
  };

  // არსებულ URL-ს ვამოწმებთ ფაილად (რომ ხელახლა გავაგზავნოთ, თუ იუზერს არ შეუცვლია)
  const urlToFile = async (url, filename) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const submitPhotos = async (e) => {
    e.preventDefault();

    const slot1 = photoSlots[0];
    if (!slot1?.newFile && !slot1?.existingUrl) {
      setPhotosError("მთავარი ფოტო სავალდებულოა");
      return;
    }

    setSavingPhotos(true);
    setPhotosError(null);

    try {
      const fd = new FormData();

      for (let i = 0; i < 5; i++) {
        const slot = photoSlots[i];
        let file = slot?.newFile ?? null;

        if (!file && slot?.existingUrl) {
          // არ შეუცვლია — ვინახავთ ისევ იმავე ფოტოს
          file = await urlToFile(slot.existingUrl, `photo${i + 1}.jpg`);
        }

        if (file) fd.append(`photo${i + 1}`, file);
      }

      await authFetch(`/books/${book.id}/edit-photos`, { method: "PUT", body: fd });
      onSaved();
    } catch (err) {
      setPhotosError(err.message);
    } finally {
      setSavingPhotos(false);
    }
  };

  const submitVideo = (e) => {
    e.preventDefault();
    if (!videoFile) {
      setVideoError("გთხოვთ აირჩიოთ ახალი ვიდეო ფაილი");
      return;
    }
    setSavingVideo(true);
    setVideoError(null);
    const fd = new FormData();
    fd.append("video", videoFile);
    authFetch(`/books/${book.id}/edit-video`, { method: "PUT", body: fd })
      .then(() => onSaved())
      .catch((e) => setVideoError(e.message))
      .finally(() => setSavingVideo(false));
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ffffff22",
    background: "#08091a",
    color: "#F4E8D8",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px", display: "block" };
  const fieldWrap = { marginBottom: "14px" };

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
          background: "var(--bg-card)", borderRadius: "12px", width: "100%",
          maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", padding: "20px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="დახურვა"
          style={{
            position: "absolute", top: "14px", right: "14px", background: "none",
            border: "none", cursor: "pointer", color: "#F4E8D8", opacity: 0.7,
          }}
        >
          <X size={18} />
        </button>

        <p className="pf-card-title" style={{ marginBottom: "16px" }}>
          <Pencil size={15} /> „{book.title}"-ის რედაქტირება
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid #ffffff1a" }}>
          {[
            { key: "details", label: "დეტალები", icon: <Pencil size={13} /> },
            { key: "photos", label: "ფოტოები", icon: <ImageIcon size={13} /> },
            { key: "video", label: "ვიდეო", icon: <VideoIcon size={13} /> },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 12px", background: "none", border: "none",
                borderBottom: tab === t.key ? "2px solid #c97d3a" : "2px solid transparent",
                color: tab === t.key ? "#F4E8D8" : "#F4E8D890",
                fontWeight: tab === t.key ? 600 : 400,
                cursor: "pointer", fontSize: "0.85rem",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "details" && (
          <form onSubmit={submitDetails}>
            <div style={fieldWrap}>
              <label style={labelStyle}>სათაური</label>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>აღწერა</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ ...fieldWrap, flex: 1 }}>
                <label style={labelStyle}>ფასი (₾)</label>
                <input type="number" step="0.01" min="0" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div style={{ ...fieldWrap, flex: 1 }}>
                <label style={labelStyle}>გამოცემის წელი</label>
                <input type="number" style={inputStyle} value={publicationYear} onChange={(e) => setPublicationYear(e.target.value)} />
              </div>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>მდგომარეობა</label>
              <input style={inputStyle} value={condition} onChange={(e) => setCondition(e.target.value)} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>ჟანრები (მძიმით გამოყოფილი)</label>
              <input style={inputStyle} value={genresInput} onChange={(e) => setGenresInput(e.target.value)} placeholder="მაგ: რომანი, დრამა" />
            </div>

            {detailsError && <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "10px" }}>{detailsError}</p>}

            <button type="submit" className="btn-bronze" disabled={savingDetails} style={{ width: "100%" }}>
              {savingDetails ? "ინახება..." : "შენახვა"}
            </button>
          </form>
        )}

        {tab === "photos" && (
          <form onSubmit={submitPhotos}>
            <p style={{ fontSize: "0.8rem", opacity: 0.65, marginBottom: "14px" }}>
              არსებული ფოტოები ჩანს ქვემოთ — შესაცვლელად დააჭირეთ სასურველ სურათს.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {photoSlots.map((slot, i) => (
                <PhotoSlot
                  key={i}
                  index={i}
                  previewUrl={slot?.previewUrl}
                  required={i === 0}
                  onChange={(file) => handlePhotoChange(i, file)}
                />
              ))}
            </div>

            {photosError && <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "10px" }}>{photosError}</p>}

            <button type="submit" className="btn-bronze" disabled={savingPhotos} style={{ width: "100%" }}>
              {savingPhotos ? "იტვირთება..." : "ფოტოების განახლება"}
            </button>
          </form>
        )}

        {tab === "video" && (
          <form onSubmit={submitVideo}>
            {existingVideoUrl && !videoFile && (
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>ამჟამინდელი ვიდეო</label>
                <video
                  src={existingVideoUrl}
                  controls
                  style={{ width: "100%", maxHeight: "220px", borderRadius: "8px", background: "#000" }}
                />
              </div>
            )}

            <VideoUploadField
              label={existingVideoUrl ? "შეცვლა ახალი ვიდეოთი (მაქს. 50MB)" : "ვიდეოს ატვირთვა (მაქს. 50MB)"}
              fileName={videoFile?.name}
              onChange={(file) => setVideoFile(file)}
            />

            {videoError && <p style={{ color: "#fc8181", fontSize: "0.85rem", marginBottom: "10px" }}>{videoError}</p>}

            <button type="submit" className="btn-bronze" disabled={savingVideo || !videoFile} style={{ width: "100%" }}>
              {savingVideo ? "იტვირთება..." : "ვიდეოს განახლება"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PHOTO SLOT — thumbnail + overlay "შეცვლა"
// ─────────────────────────────────────────────────────────────
function PhotoSlot({ index, previewUrl, required, onChange }) {
  return (
    <label
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        paddingTop: "133%", // 3:4 თანაფარდობა
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        border: previewUrl ? "1px solid #ffffff22" : "1px dashed #ffffff35",
        background: "#08091a",
      }}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`ფოტო ${index + 1}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "4px", color: "#F4E8D890",
          }}
        >
          <Upload size={16} />
          <span style={{ fontSize: "0.65rem" }}>{index === 0 ? "მთავარი *" : `ფოტო ${index + 1}`}</span>
        </div>
      )}

      {/* hover overlay */}
      <div
        className="photo-slot-overlay"
        style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(8,9,26,0.55)", opacity: 0, transition: "opacity 0.15s",
          color: "#F4E8D8", fontSize: "0.7rem", fontWeight: 600,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseOut={(e) => (e.currentTarget.style.opacity = 0)}
      >
        {previewUrl ? "შეცვლა" : "ატვირთვა"}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" }}
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// VIDEO UPLOAD FIELD
// ─────────────────────────────────────────────────────────────
function VideoUploadField({ label, fileName, onChange }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px", display: "block" }}>
        {label}
      </label>
      <label
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: fileName ? "1px solid #8fbc8f80" : "1px dashed #ffffff35",
          background: fileName ? "#8fbc8f14" : "#08091a",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        <span
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "6px",
            background: fileName ? "#8fbc8f30" : "#c97d3a25",
            color: fileName ? "#8fbc8f" : "#d6a05a", flexShrink: 0,
          }}
        >
          {fileName ? <Check size={15} /> : <VideoIcon size={14} />}
        </span>

        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: fileName ? 1 : 0.6 }}>
          {fileName ?? "ფაილის არჩევა..."}
        </span>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" }}
        />
      </label>
    </div>
  );
}