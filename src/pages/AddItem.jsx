import React, { useState, useEffect, useRef } from "react";
import PageWrapper from "../components/PageWrapper";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// إصلاح أيقونات Marker
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function AddItem() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [featured, setFeatured] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [addressDesc, setAddressDesc] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const mapRef = useRef(null);
  const navigate = useNavigate();

  const categoriesList = [
    { value: "clothes", label: "👕 ملابس" },
    { value: "electronics", label: "📱 إلكترونيات" },
    { value: "furniture", label: "🏠 أثاث" },
    { value: "books", label: "📚 كتب" },
    { value: "other", label: "📦 أخرى" },
  ];

  const regionsList = [
    "الرياض",
    "جدة",
    "مكة",
    "المدينة",
    "الدمام",
    "الخبر",
    "أبها",
    "تبوك",
    "حائل",
    "جازان",
  ];

  const neighborhoodToRegion = {
    "الحي الأول": "الرياض",
    "الحي الثاني": "جدة",
    "الحي الثالث": "مكة",
    // أضف أي حي => منطقة
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const goBack = () => navigate(-1);

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
      } catch {
        showToastMsg("حدث خطأ أثناء معالجة الصورة!", "error");
      }
    }
  };

  const handleSelectCategory = (value) => {
    setCategory(value);
    setCategoryOpen(false);
  };
  const handleSelectRegion = (value) => {
    setRegion(value);
    setRegionOpen(false);
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
    if (!region) {
      showToastMsg("يرجى اختيار منطقة!", "error");
      return;
    }
    if (!location) {
      showToastMsg("يرجى تحديد الموقع على الخريطة!", "error");
      return;
    }
    if (!locationConfirmed) {
      showToastMsg("يرجى تأكيد الموقع أولاً!", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "items"), {
        name,
        desc,
        category,
        region,
        image: imageBase64,
        featured,
        userId: user.uid,
        userName: user.displayName || user.email,
        location,
        addressDesc,
        createdAt: serverTimestamp(),
      });

      setName("");
      setDesc("");
      setCategory("");
      setRegion("");
      setImageBase64("");
      setFeatured(false);
      setLocation(null);
      setAddressDesc("");
      setLocationConfirmed(false);
      showToastMsg("تم إرسال الغرض بنجاح", "success");
      navigate("/Market");
    } catch (err) {
      console.error(err);
      showToastMsg("حدث خطأ أثناء إرسال الطلب!", "error");
    } finally {
      setLoading(false);
    }
  };

  function LocationMarker() {
    const map = useMap();
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setLocation({ lat, lng });
        map.flyTo([lat, lng], 16);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const neighborhood =
            data.address.neighbourhood ||
            data.address.suburb ||
            data.address.village ||
            data.address.city_district ||
            "";
          setAddressDesc(neighborhood);
          if (neighborhoodToRegion[neighborhood]) {
            setRegion(neighborhoodToRegion[neighborhood]);
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
    return location ? <Marker position={[location.lat, location.lng]} /> : null;
  }

  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      showToastMsg("المتصفح لا يدعم الموقع الجغرافي!", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        showToastMsg("تم تحديد موقعك الحالي ✔️", "success");

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 16);
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const neighborhood =
            data.address.neighbourhood ||
            data.address.suburb ||
            data.address.village ||
            data.address.city_district ||
            "";
          setAddressDesc(neighborhood);
          if (neighborhoodToRegion[neighborhood]) {
            setRegion(neighborhoodToRegion[neighborhood]);
          }
        } catch (err) {
          console.error(err);
        }
      },
      () => showToastMsg("تعذر الحصول على موقعك!", "error")
    );
  };

  const confirmLocation = () => {
    if (!location) {
      showToastMsg("يرجى اختيار الموقع على الخريطة أولاً!", "error");
      return;
    }
    setLocationConfirmed(true);
    showToastMsg("تم تأكيد الموقع ✔️", "success");
  };

  return (
    <PageWrapper>
      <button onClick={goBack} style={backButtonStyle}>
        &lt; الخلف
      </button>
      {showToast && (
        <div
          style={{
            ...toastStyle,
            background: toastType === "success" ? "#10b981" : "#ef4444",
          }}
        >
          {toastType === "success" ? "✅ " : "❌ "}
          {toastMessage}
        </div>
      )}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "1rem",
          width: "100%",
        }}
      >
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

          {/* التصنيف */}
          <div style={{ position: "relative", width: "100%" }}>
            <button
              type="button"
              onClick={() => setCategoryOpen((prev) => !prev)}
              style={toggleButtonStyle}
            >
              {category
                ? categoriesList.find((c) => c.value === category)?.label
                : "التصنيف"}
            </button>
            {categoryOpen && (
              <div style={dropdownContainer}>
                {categoriesList.map((cat) => (
                  <div
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    style={{
                      ...dropdownItem,
                      background:
                        category === cat.value ? "#facc15" : "#1f2937",
                      color: category === cat.value ? "#1f2937" : "#f9fafb",
                      border:
                        category === cat.value
                          ? "2px solid #fbbf24"
                          : "2px solid #374151",
                    }}
                  >
                    {cat.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* المنطقة */}
          <div style={{ position: "relative", width: "100%" }}>
            <button
              type="button"
              onClick={() => setRegionOpen((prev) => !prev)}
              style={toggleButtonStyle}
            >
              {region || "المنطقة"}
            </button>
            {regionOpen && (
              <div style={dropdownContainer}>
                {regionsList.map((r) => (
                  <div
                    key={r}
                    onClick={() => handleSelectRegion(r)}
                    style={{
                      ...dropdownItem,
                      background: region === r ? "#facc15" : "#1f2937",
                      color: region === r ? "#1f2937" : "#f9fafb",
                      border:
                        region === r
                          ? "2px solid #fbbf24"
                          : "2px solid #374151",
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* وصف الموقع */}
          <input
            value={addressDesc}
            onChange={(e) => setAddressDesc(e.target.value)}
            placeholder="وصف الموقع أو الحي"
            style={inputStyle}
          />

          {/* Image uploader */}
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

          {/* الخريطة مع أزرار فوقها */}
          <div style={{ position: "relative", marginBottom: "0.5rem" }}>
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "flex",
                gap: "0.5rem",
                zIndex: 1000,
              }}
            >
              <button
                onClick={goToMyLocation}
                type="button"
                style={iconButtonStyle}
                title="موقعي"
              >
                📍
              </button>
              {location && !locationConfirmed && (
                <button
                  onClick={confirmLocation}
                  type="button"
                  style={confirmButtonStyle}
                >
                  تأكيد الموقع
                </button>
              )}
            </div>
            <MapContainer
              center={[24.7136, 46.6753]}
              zoom={13}
              style={{ height: "300px", width: "100%" }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
          </div>

          {/* Featured toggle */}
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

// ===== Styles =====
const backButtonStyle = {
  display: "inline-block",
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
const toggleButtonStyle = {
  padding: "0.5rem 1rem",
  borderRadius: "0.7rem",
  border: "1px solid #facc15",
  background: "#111827",
  color: "#f9fafb",
  cursor: "pointer",
  width: "100%",
  textAlign: "right",
};
const dropdownContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.5rem",
  padding: "0.5rem",
  background: "#111827",
  borderRadius: "0.5rem",
};
const dropdownItem = {
  padding: "0.5rem 1rem",
  borderRadius: "999px",
  cursor: "pointer",
  userSelect: "none",
  transition: "all 0.2s",
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
const iconButtonStyle = {
  padding: "0.5rem",
  borderRadius: "50%",
  border: "none",
  background: "#facc15",
  color: "#111827",
  fontSize: "1.2rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const confirmButtonStyle = {
  padding: "0.4rem 0.8rem",
  borderRadius: "0.5rem",
  border: "none",
  background: "#34d399",
  color: "#111827",
  fontWeight: "bold",
  cursor: "pointer",
};
