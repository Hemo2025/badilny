import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import { MdMargin } from "react-icons/md";

export default function AddItem() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [featured, setFeatured] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser)
    );
    return () => unsubscribe();
  }, []);

  const goBack = () => navigate(-1); // زر العودة للخلف

  const showToastMsg = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800 };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => setImageBase64(reader.result);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        showToastMsg("حدث خطأ أثناء معالجة الصورة!", "error");
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      showToastMsg("يجب تسجيل الدخول أولاً!", "error");
      navigate("/Auth");
      return;
    }
    if (!imageBase64) {
      showToastMsg("يرجى اختيار صورة للغرض!", "error");
      return;
    }
    if (!category) {
      showToastMsg("يرجى اختيار تصنيف!", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "items"), {
        name,
        desc,
        category,
        image: imageBase64,
        featured,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });

      setName("");
      setDesc("");
      setCategory("");
      setImageBase64("");
      setFeatured(false);

      showToastMsg("تم إرسال الغرض بنجاح", "success");
      navigate("/Market");
    } catch (error) {
      showToastMsg("حدث خطأ أثناء إرسال الطلب!", "error");
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = [
    { value: "electronics", label: "📱 إلكترونيات" },
    { value: "clothes", label: "👕 ملابس" },
    { value: "furniture", label: "🏠 أثاث" },
    { value: "games", label: "🎮 ألعاب" },
    { value: "books", label: "📚 كتب" },
    { value: "other", label: "📦 أخرى" },
  ];

  return (
    <PageWrapper>
      {/* زر الرجوع */}
      <button onClick={goBack} style={backButtonStyle}>
        &lt; الخلف
      </button>
      <div className="container">
        {showToast && (
          <div
            style={{
              ...toastStyle,
              background: toastType === "success" ? "#10b981" : "#ef4444",
            }}
          >
            <span style={{ marginRight: "0.5rem" }}>
              {toastType === "success" ? "✅" : "❌"}
            </span>
            {toastMessage}
          </div>
        )}

        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
          أضف غرض جديد
        </h1>

        <form
          onSubmit={handleAdd}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الغرض"
            required
            style={inputStyle}
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="الوصف"
            required
            style={inputStyle}
          />

          <div>
            <p
              style={{
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#facc15",
              }}
            >
              التصنيف
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {categoriesList.map((cat) => (
                <div
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    background: category === cat.value ? "#facc15" : "#1f2937",
                    color: category === cat.value ? "#1f2937" : "#f9fafb",
                    cursor: "pointer",
                    border:
                      category === cat.value
                        ? "2px solid #fbbf24"
                        : "2px solid #374151",
                    transition: "all 0.2s",
                  }}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          <div className="image-uploader">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="fileInput"
            />
            <label htmlFor="fileInput" style={imageLabelStyle}>
              {imageBase64 ? (
                <img
                  src={imageBase64}
                  alt="معاينة"
                  style={{ maxHeight: "200px", borderRadius: "0.5rem" }}
                />
              ) : (
                <span>اضغط هنا لإضافة صورة</span>
              )}
            </label>
          </div>

          <label style={featuredLabelResponsiveLabelStyle}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              style={{ display: "none" }}
            />
            <span
              style={{
                display: "inline-block",
                width: "60px",
                height: "28px",
                background: featured ? "#34d399" : "#374151",
                borderRadius: "14px",
                position: "relative",
                transition: "background 0.3s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: featured ? "32px" : "2px",
                  width: "24px",
                  height: "24px",
                  background: "#facc15",
                  borderRadius: "50%",
                  transition: "left 0.3s",
                }}
              />
            </span>
            <span style={{ marginLeft: "0.5rem", fontSize: "1rem" }}>
              اجعل الغرض مميز
            </span>
          </label>

          <button type="submit" disabled={loading} style={submitButtonStyle}>
            {loading ? "جارٍ إرسال الطلب..." : "إضافة"}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

const backButtonStyle = {
  display: "inline-block",
  width: "fit-content",
  padding: "0.4rem .5rem",
  borderRadius: "0.5rem",
  border: "none",
  background: "#facc15",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #facc15",
  background: "#111827",
  color: "#f9fafb",
};

const imageLabelStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "150px",
  border: "2px dashed #facc15",
  borderRadius: "0.5rem",
  cursor: "pointer",
  color: "#facc15",
};

const submitButtonStyle = {
  padding: "0.6rem",
  borderRadius: "0.5rem",
  border: "none",
  background: "#34d399",
  color: "#111827",
  fontWeight: "bold",
  cursor: "pointer",
};

const featuredLabelResponsiveLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
  flexWrap: "wrap",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  color: "#fff",
  padding: "0.6rem 1.2rem",
  borderRadius: "0.5rem",
  fontWeight: "bold",
  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
};
