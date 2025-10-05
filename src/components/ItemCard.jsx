import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function ItemCard({ item }) {
  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const tradeFormRef = useRef(null);
  const tradeButtonRef = useRef(null);

  // ===== تحميل بيانات المستخدم وأغراضه =====
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const fetchMyItems = async () => {
          const q = query(
            collection(db, "items"),
            where("userId", "==", currentUser.uid)
          );
          const snapshot = await getDocs(q);
          setMyItems(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        };
        fetchMyItems();
      }

      // حساب المسافة بين المستخدم والعنصر
      if (navigator.geolocation && item.location) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const { lat, lng } = item.location;
          const distance = getDistanceFromLatLonInKm(
            userLat,
            userLng,
            lat,
            lng
          );
          setDistanceKm(distance.toFixed(1));
        });
      }
    });

    // إغلاق نموذج المقايضة عند النقر خارجها
    const handleClickOutside = (e) => {
      if (
        tradeFormRef.current &&
        !tradeFormRef.current.contains(e.target) &&
        tradeButtonRef.current &&
        !tradeButtonRef.current.contains(e.target)
      ) {
        setShowTradeForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [item.location]);

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // إرسال طلب المقايضة
  const handleTradeRequest = async () => {
    if (!user) return showToastMsg("يجب تسجيل الدخول!");
    if (!selectedItem) return showToastMsg("اختر غرضك أولاً!");

    try {
      await addDoc(collection(db, "trades"), {
        requesterId: user.uid,
        requesterName: user.displayName || "مستخدم",
        ownerId: item.userId,
        ownerName: item.userName || "مستخدم",
        requestedItem: item,
        offeredItem: myItems.find((i) => i.id === selectedItem),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      showToastMsg("تم إرسال طلب المقايضة ✅");
      setShowTradeForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      showToastMsg("حدث خطأ أثناء إرسال الطلب!");
    }
  };

  // حساب المسافة
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <div style={cardStyle}>
      {showToast && <div style={toastStyle}>{toastMessage}</div>}

      {/* صورة العنصر */}
      <div style={{ position: "relative" }}>
        <img
          src={item.image}
          alt={item.name}
          style={imageStyle}
          onClick={() => setLightboxOpen(true)}
        />
        {item.featured && <div style={featuredBadgeStyle}>⭐ مميز</div>}
      </div>

      {/* تفاصيل العنصر */}
      <div style={{ marginTop: "0.5rem" }}>
        <h3 style={titleStyle}>{item.name}</h3>
        <p style={descStyle}>{item.desc}</p>
        {item.category && <p style={infoStyle}>التصنيف: {item.category}</p>}
        {item.region && <p style={infoStyle}>📍 {item.region}</p>}
        {item.addressDesc && <p style={infoStyle}>الحي: {item.addressDesc}</p>}
        {distanceKm && <p style={infoStyle}>🛣️ على بعد {distanceKm} كم</p>}
        {item.userName && <p style={infoStyle}>بواسطة: {item.userName}</p>}
      </div>

      {/* زر المقايضة */}
      {user && item.userId !== user.uid && (
        <>
          <button
            ref={tradeButtonRef}
            style={tradeButtonStyle}
            onClick={() => setShowTradeForm((prev) => !prev)}
          >
            أرغب بالمقايضة
          </button>

          <div
            ref={tradeFormRef}
            style={{
              ...tradeFormStyle,
              maxHeight: showTradeForm ? "300px" : "0px",
              opacity: showTradeForm ? 1 : 0,
              overflowY: "auto",
            }}
          >
            {myItems.map((myItem) => (
              <div
                key={myItem.id}
                onClick={() => setSelectedItem(myItem.id)}
                style={{
                  ...myItemStyle,
                  border:
                    selectedItem === myItem.id
                      ? "2px solid #00ABE4"
                      : "2px solid transparent",
                }}
              >
                <img
                  src={myItem.image}
                  alt={myItem.name}
                  style={myItemImgStyle}
                />
                <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
                  {myItem.name}
                </p>
              </div>
            ))}
            <button style={sendButtonStyle} onClick={handleTradeRequest}>
              إرسال الطلب
            </button>
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div style={lightboxStyle} onClick={() => setLightboxOpen(false)}>
          <img src={item.image} alt={item.name} style={lightboxImgStyle} />
        </div>
      )}
    </div>
  );
}

// ===== Styles =====
const cardStyle = {
  background: "#F9FAFB",
  padding: "1rem",
  borderRadius: "0.75rem",
  color: "#111827",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  transition: "0.2s",
  position: "relative",
  height: "-webkit-fill-available",
};
const toastStyle = {
  position: "absolute",
  top: "-40px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#10b981",
  color: "#fff",
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  fontWeight: "bold",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  zIndex: 1000,
};
const imageStyle = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "0.5rem",
  cursor: "pointer",
};
const titleStyle = {
  color: "#00ABE4",
  fontSize: "1.2rem",
  marginBottom: "0.3rem",
};
const descStyle = {
  fontSize: "0.9rem",
  background: "#E0F2FE",
  padding: "5px 10px",
  borderRadius: "0.5rem",
  marginBottom: "0.3rem",
};
const infoStyle = {
  fontSize: "0.8rem",
  color: "#4B5563",
  marginBottom: "0.3rem",
};
const featuredBadgeStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "#03a9f4",
  color: "#fff",
  padding: "0.2rem 0.5rem",
  borderRadius: "0.5rem",
  fontWeight: "bold",
  fontSize: "0.8rem",
  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
};
const tradeButtonStyle = {
  marginTop: "0.5rem",
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#10b981",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};
const tradeFormStyle = {
  marginTop: "0.5rem",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))",
  gap: "0.5rem",
  transition: "all 0.3s ease",
};
const myItemStyle = {
  padding: "0.5rem",
  borderRadius: "0.5rem",
  cursor: "pointer",
  background: "#111827",
  color: "#fff",
  textAlign: "center",
  transition: "0.2s",
};
const myItemImgStyle = {
  width: "100%",
  height: "80px",
  objectFit: "cover",
  borderRadius: "0.3rem",
};
const sendButtonStyle = {
  gridColumn: "1/-1",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#facc15",
  color: "#111827",
  fontWeight: "bold",
  cursor: "pointer",
};
const lightboxStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  cursor: "pointer",
};
const lightboxImgStyle = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: "0.5rem",
};
