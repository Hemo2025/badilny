import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";

export default function AddItem() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(""); // ✅ التصنيف
  const [imageBase64, setImageBase64] = useState("");
  const [featured, setFeatured] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser)
    );
    return () => unsubscribe();
  }, []);

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
        console.error("حدث خطأ أثناء ضغط الصورة:", error);
        alert("حدث خطأ أثناء معالجة الصورة!");
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("يجب تسجيل الدخول أولاً!");
      navigate("/Auth");
      return;
    }
    if (!imageBase64) {
      alert("يرجى اختيار صورة للغرض!");
      return;
    }
    if (!category) {
      alert("يرجى اختيار تصنيف!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "items"), {
        name,
        desc,
        category, // ✅ إضافة التصنيف
        image: imageBase64,
        featured,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });

      setName("");
      setDesc("");
      setCategory(""); // ✅ إفراغ التصنيف بعد الإرسال
      setImageBase64("");
      setFeatured(false);

      alert("تم إرسال الطلب ✅");
      navigate("/Market");
    } catch (error) {
      console.error("خطأ أثناء إرسال الطلب:", error);
      alert("حدث خطأ أثناء إرسال الطلب!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <div className="container">
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

          {/* ✅ حقل اختيار التصنيف */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">-- اختر التصنيف --</option>
            <option value="electronics">📱 إلكترونيات</option>
            <option value="clothes">👕 ملابس</option>
            <option value="furniture">🏠 أثاث</option>
            <option value="games">🎮 ألعاب</option>
            <option value="books">📚 كتب</option>
            <option value="other">📦 أخرى</option>
          </select>

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

          {/* زر التميز */}
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
