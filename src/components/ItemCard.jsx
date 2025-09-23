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
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMyItems(data);
        };
        fetchMyItems();
      }

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

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    const timeStr = date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isToday) return `اليوم ${timeStr}`;
    if (isYesterday) return `أمس ${timeStr}`;
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return `${date.toLocaleDateString("en-US", options)} ${timeStr}`;
  };

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

      <div style={{ position: "relative" }}>
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
          onClick={() => setLightboxOpen(true)}
        />
        {item.featured && <div style={featuredBadgeStyle}>⭐ مميز</div>}
      </div>

      {/* تفاصيل الغرض */}
      <div style={{ marginTop: "0.5rem" }}>
        <h3 style={{ color: "#00ABE4" }}>{item.name}</h3>
        <p
          style={{
            fontSize: "0.9rem",
            background: "#1e293b",
            padding: "3px 10px 3px 5px",
            marginBottom: "0.3rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgb(136 212 241)",
          }}
        >
          {item.desc}
        </p>
        {item.category && <p style={infoStyle}>التصنيف : "{item.category}"</p>}
        {item.region && <p style={infoStyle}>📍 {item.region}</p>}
        {item.addressDesc && <p style={infoStyle}>الحي: {item.addressDesc}</p>}
        {distanceKm && <p style={infoStyle}>🛣️ على بعد {distanceKm} كم</p>}
        {item.userName && <p style={infoStyle}>بواسطة: {item.userName}</p>}
        {item.createdAt && (
          <p
            style={{
              fontSize: "0.7rem",
              color: "#4B5563",
              marginBottom: "0.2rem",
            }}
          >
            أضيف بتاريخ: {formatDate(item.createdAt)}
          </p>
        )}
      </div>

      {/* زر المقايضة */}
      {user && item.userId !== user.uid && (
        <>
          <button
            ref={tradeButtonRef}
            onClick={() => setShowTradeForm((prev) => !prev)}
            style={tradeButtonStyle}
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
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  background:
                    selectedItem === myItem.id ? "#facc15" : "#111827",
                  color: "#fff",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                <img
                  src={myItem.image}
                  alt={myItem.name}
                  style={{
                    width: "100%",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "0.3rem",
                  }}
                />
                <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
                  {myItem.name}
                </p>
              </div>
            ))}
            <button onClick={handleTradeRequest} style={sendButtonStyle}>
              إرسال الطلب
            </button>
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div style={lightboxStyle} onClick={() => setLightboxOpen(false)}>
          <img
            src={item.image}
            alt={item.name}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "0.5rem",
            }}
          />
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
  color: "#f9fafb",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  transition: "0.2s",
  position: "relative",
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
  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
  zIndex: 100,
};
const featuredBadgeStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "#03a9f4",
  color: "white",
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
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "0.5rem",
  transition: "all 0.3s ease",
};
const sendButtonStyle = {
  gridColumn: "1 / -1",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#facc15",
  color: "#111827",
  fontWeight: "bold",
  cursor: "pointer",
};
const infoStyle = {
  fontSize: "0.8rem",
  color: "#4B5563",
  marginBottom: "0.3rem",
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
