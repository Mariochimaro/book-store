import { useState, useRef } from 'react';
import { BookPlus, CheckCircle, X, Upload, Video, Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import "./Styles/add-book.css"

const API_URL = import.meta.env.VITE_API_URL;

const AVAILABLE_GENRES = [
  "მხატვრული", "ფანტასტიკა", "სამეცნიერო ფანტასტიკა", "დეტექტივი",
  "თრილერი", "რომანი", "ისტორიული", "ბიოგრაფია", "თვითგანვითარება",
  "ფსიქოლოგია", "ბიზნესი და ეკონომიკა", "საბავშვო", "პოეზია",
  "ფილოსოფია", "თავგადასავალი", "საშინელებათა", "კომიქსი/მანგა"
];

function AddBook({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genreSearch, setGenreSearch] = useState('');

  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    language: 'geo',
    price: '',
    publication_year: '',
    condition: 'good',
    description: '',
    listing_type: 'second-hand',
    stock_quantity: '1'
  });

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleGenre = (genre) =>
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      alert("მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!");
      return;
    }
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("ვიდეოს ზომა არ უნდა აღემატებოდეს 50MB-ს!");
        return;
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const filteredGenres = AVAILABLE_GENRES.filter(g =>
    g.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert("გთხოვთ ატვირთოთ მინიმუმ 1 ფოტო!");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('genres', selectedGenres.join(','));
      formData.append('language', form.language);
      formData.append('price', form.price);
      formData.append('publication_year', form.publication_year || String(new Date().getFullYear()));
      formData.append('condition', form.condition);
      formData.append('description', form.description);
      formData.append('listing_type', form.listing_type);
      formData.append('stock_quantity', form.stock_quantity || '1');

      photos.forEach((photo, index) => {
        formData.append(`photo${index + 1}`, photo);
      });

      if (video) {
        formData.append('video', video);
      }

      const token = localStorage.getItem("token");

      // ✅ FIX: /upload → /books/upload
      const response = await fetch(`${API_URL}/books/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "ატვირთვისას მოხდა შეცდომა!");
      }

      setDone(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setDone(false);
        onOpenChange(false);
        setForm({ title: '', language: 'geo', price: '', publication_year: '', condition: 'good', description: '', listing_type: 'second-hand', stock_quantity: '1' });
        setSelectedGenres([]);
        setPhotos([]);
        setPhotoPreviews([]);
        setVideo(null);
        setVideoPreview(null);
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "შეცდომა კავშირისას. სცადეთ თავიდან.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const submitDisabled = selectedGenres.length === 0 || photos.length === 0 || loading;

  return (
    <div className="modal-backdrop" onClick={() => onOpenChange(false)}>
      <div className="modal-card ab-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" type="button" onClick={() => onOpenChange(false)} aria-label="დახურვა">
          <X size={16} />
        </button>

        <div className="seller-modal-title-row">
          <BookPlus size={20} />
          <h2 className="modal-title">წიგნის დამატება გაყიდვაში</h2>
        </div>
        <p className="modal-sub">
          შეავსეთ ინფორმაცია. წიგნი კატალოგში გამოჩნდება ადმინისტრატორის მიერ დასტურის შემდეგ.
        </p>

        {done ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0 12px', gap: 12, textAlign: 'center' }}
          >
            <CheckCircle size={64} style={{ color: 'var(--green)' }} />
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>წიგნი წარმატებით გაიგზავნა!</p>
            <p className="modal-sub" style={{ marginBottom: 0 }}>
              თქვენი განცხადება გადაიგზავნა ადმინისტრაციასთან და შემოწმების შემდეგ გამოჩნდება კატალოგში.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && <div className="modal-error">{errorMsg}</div>}

            {/* ფოტოების ატვირთვა */}
            <div className="ab-field">
              <label className="modal-lbl">ფოტოები * (მაქსიმუმ 5, მინიმუმ 1)</label>
              <div className="ab-photo-grid">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="ab-photo-tile">
                    <img src={src} alt="preview" />
                    <button type="button" className="ab-photo-remove" onClick={() => removePhoto(idx)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <div className="ab-add-tile" onClick={() => photoInputRef.current?.click()}>
                    <Upload size={20} />
                    <span>ფოტოს დამატება</span>
                  </div>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="visually-hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* ვიდეოს ატვირთვა */}
            <div className="ab-field">
              <label className="modal-lbl">
                ვიდეო მიმოხილვა <span className="modal-opt">(არასავალდებულო, მაქს. 50MB)</span>
              </label>
              {videoPreview ? (
                <div className="ab-video-set">
                  <span className="ab-video-name">{video?.name}</span>
                  <button type="button" className="ab-video-remove" onClick={() => { setVideo(null); setVideoPreview(null); }}>
                    <X size={14} /> წაშლა
                  </button>
                </div>
              ) : (
                <div className="ab-video-box" onClick={() => videoInputRef.current?.click()}>
                  <Video size={16} /> ვიდეოს ატვირთვა
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="visually-hidden" onChange={handleVideoChange} />
            </div>

            {/* ძირითადი ინფორმაცია */}
            <div className="ab-grid2">
              <div className="ab-field ab-span2">
                <label className="modal-lbl">წიგნის სათაური *</label>
                <input className="modal-inp" value={form.title} onChange={e => update('title', e.target.value)} placeholder="მაგ. ვეფხისტყაოსანი" required />
              </div>

              <div className="ab-field">
                <label className="modal-lbl">ფასი (₾) *</label>
                <input className="modal-inp" value={form.price} onChange={e => update('price', e.target.value)} placeholder="0.00" type="number" step="0.5" min="1" required />
              </div>

              <div className="ab-field">
                <label className="modal-lbl">ენა *</label>
                <select className="modal-inp" value={form.language} onChange={e => update('language', e.target.value)}>
                  <option value="geo">ქართული</option>
                  <option value="eng">ინგლისური</option>
                  <option value="rus">რუსული</option>
                  <option value="other">სხვა</option>
                </select>
              </div>

              <div className="ab-field">
                <label className="modal-lbl">მდგომარეობა *</label>
                <select className="modal-inp" value={form.condition} onChange={e => update('condition', e.target.value)}>
                  <option value="new">ახალი</option>
                  <option value="good">კარგი</option>
                  <option value="average">საშუალო</option>
                  <option value="damaged">დაზიანებული</option>
                </select>
              </div>

              <div className="ab-field">
                <label className="modal-lbl">გამოშვების წელი</label>
                <input className="modal-inp" value={form.publication_year} onChange={e => update('publication_year', e.target.value)} placeholder="მაგ. 2021" type="number" />
              </div>

              <div className="ab-field">
                <label className="modal-lbl">გაყიდვის ტიპი *</label>
                <select className="modal-inp" value={form.listing_type} onChange={e => update('listing_type', e.target.value)}>
                  <option value="second-hand">მეორადი (პირადი)</option>
                  <option value="first-hand">ახალი (მაღაზია)</option>
                </select>
              </div>

              <div className="ab-field">
                <label className="modal-lbl">რაოდენობა მარაგში</label>
                <input className="modal-inp" value={form.stock_quantity} onChange={e => update('stock_quantity', e.target.value)} type="number" min="1" />
              </div>

              <div className="ab-field ab-span2">
                <label className="modal-lbl">აღწერა *</label>
                <textarea
                  className="modal-inp modal-textarea"
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="მოკლედ აღწერეთ წიგნის შინაარსი ან მდგომარეობის დეტალები..."
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* ჟანრები */}
            <div className="ab-field" style={{ marginTop: 4 }}>
              <label className="modal-lbl">ჟანრები *</label>

              <div className="ab-search-wrap">
                <Search size={14} className="ab-search-icon" />
                <input
                  type="text"
                  placeholder="მოძებნეთ ჟანრი..."
                  value={genreSearch}
                  onChange={e => setGenreSearch(e.target.value)}
                  className="modal-inp ab-search-input"
                />
              </div>

              <div className="ab-genre-box">
                {filteredGenres.map(genre => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`fp-tag ${isSelected ? 'on' : ''}`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>

              {selectedGenres.length > 0 && (
                <div className="ab-genre-chips">
                  {selectedGenres.map(g => (
                    <span key={g} className="ab-genre-chip">
                      {g}
                      <button type="button" onClick={() => toggleGenre(g)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ღილაკები */}
            <div className="modal-btn-row" style={{ marginTop: 18 }}>
              <button type="button" className="modal-btn-ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                გაუქმება
              </button>
              <button
                type="submit"
                className="modal-btn modal-btn-grow"
                disabled={submitDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: submitDisabled ? 0.6 : 1,
                  cursor: submitDisabled ? 'default' : 'pointer'
                }}
              >
                {loading && <Loader2 size={16} className="ab-spin" />}
                {loading ? "იგზავნება..." : "გაგზავნა დასადასტურებლად"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddBook;