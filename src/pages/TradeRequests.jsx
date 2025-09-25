import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import Navbar from "../components/Navbar";

export default function TradeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [notifications, setNotifications] = useState([]);
  const [transitionKey, setTransitionKey] = useState(0);
  const [previewItem, setPreviewItem] = useState(null);
  const [imageIndex, setImageIndex] = useState(0); // لمتابعة الصور عند التنقل
  const navigate = useNavigate();

  const fetchData = (user) => {
    if (!user) return () => {};
    const q = query(collection(db, "trades"), where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const statusOrder = { pending: 1, accepted: 2, rejected: 3 };
        data.sort((a, b) => {
          const statusDiff =
            (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
          if (statusDiff !== 0) return statusDiff;
          const timeA = (a.createdAt?.seconds || 0) * 1000;
          const timeB = (b.createdAt?.seconds || 0) * 1000;
          return timeB - timeA;
        });

        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setLoading(true);
      unsubscribeSnapshot();
      if (user) {
        unsubscribeSnapshot = fetchData(user);
      } else {
        setRequests([]);
        setLoading(false);
      }
    });

    const handleFocus = () => {
      const user = auth.currentUser;
      if (user) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = fetchData(user);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const showNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000
    );
  };

  const handleAccept = async (request) => {
    const tradeRef = doc(db, "trades", request.id);
    try {
      await updateDoc(tradeRef, {
        status: "accepted",
        chatId: request.chatId || request.id,
        participants: [request.ownerId, request.requesterId],
        acceptedAt: serverTimestamp(),
      });
      showNotification("✅ تمت الموافقة على الطلب");
    } catch (error) {
      console.error(error);
      showNotification("❌ حدث خطأ أثناء الموافقة");
    }
  };

  const handleReject = async (request) => {
    const tradeRef = doc(db, "trades", request.id);
    try {
      await updateDoc(tradeRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      showNotification("❌ تم رفض الطلب");
    } catch (error) {
      console.error(error);
      showNotification("❌ حدث خطأ أثناء الرفض");
    }
  };

  const handleChat = (request) => {
    if (!request.chatId) return;
    navigate(`/chat/${request.chatId}`, { state: { chat: request } });
  };

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTransitionKey((prev) => prev + 1);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const openPreview = (item, index = 0) => {
    setPreviewItem(item);
    setImageIndex(index);
  };

  const nextImage = () => {
    if (!previewItem?.images) return;
    setImageIndex((prev) => (prev + 1) % previewItem.images.length);
  };

  const prevImage = () => {
    if (!previewItem?.images) return;
    setImageIndex((prev) =>
      prev === 0 ? previewItem.images.length - 1 : prev - 1
    );
  };

  return (
    <PageWrapper>
      <div>
        <Navbar />
      </div>
      <div
        style={{
          padding: "1rem",
          minHeight: "100vh",
          color: "#f9fafb",
        }}
      >
        <h2
          style={{
            color: "#00ABE4",
            boxShadow: "0 0 10px snow",
            marginBottom: "1rem",
            background: "snow",
            textShadow: "0 0 5px #00ABE4",
            padding: "0.5rem",
            borderRadius: "0.5rem",
          }}
        >
          طلبات المقايضة
        </h2>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {["pending", "accepted", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.4rem",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                background:
                  activeTab === tab
                    ? tab === "accepted"
                      ? "#16a34a"
                      : "#00abe4"
                    : "#1f2937",
                color: activeTab === tab ? "snow" : "#f9fafb",
              }}
            >
              {tab === "pending"
                ? "قيد الانتظار"
                : tab === "accepted"
                ? "مقبولة"
                : "مرفوضة"}
            </button>
          ))}
        </div>

        {/* Loader / Empty */}
        {loading ? (
          <p
            style={{
              textAlign: "center",
              marginTop: "3rem",
              fontSize: "1.2rem",
              color: "snow",
              animation: "pulse 1.5s infinite",
            }}
          >
            جاري التحميل...
          </p>
        ) : filteredRequests.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              marginTop: "3rem",
              fontSize: "1.1rem",
              color: "snow",
            }}
          >
            لا توجد طلبات في هذه الحالة
          </p>
        ) : (
          <ul
            key={transitionKey}
            style={{
              listStyle: "none",
              padding: 0,
              animation: "fadeSlide 0.4s ease",
            }}
          >
            {filteredRequests.map((req) => (
              <li
                key={req.id}
                style={{
                  background: req.status === "accepted" ? "#1f2937" : "#1f2937",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  marginBottom: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  color: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {req.requestedItem?.image && (
                    <img
                      src={req.requestedItem.image}
                      alt={req.requestedItem.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "0.4rem",
                        cursor: "pointer",
                        transition: "transform 0.3s",
                      }}
                      onClick={() => openPreview(req.requestedItem)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    />
                  )}
                  {req.offeredItem?.image && (
                    <img
                      src={req.offeredItem.image}
                      alt={req.offeredItem.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "0.4rem",
                        cursor: "pointer",
                        transition: "transform 0.3s",
                      }}
                      onClick={() => openPreview(req.offeredItem)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    />
                  )}
                  <div>
                    <strong style={{ color: "#facc15" }}>
                      {req.requesterName || "مستخدم"}
                    </strong>
                    <div style={{ fontSize: "0.85rem" }}>
                      {req.requestedItem?.name || ""} ↔{" "}
                      {req.offeredItem?.name || ""}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#d1d5db" }}>
                    {formatTime(req.createdAt)}
                  </span>
                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAccept(req)}
                        style={buttonStyleAccept}
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        style={buttonStyleReject}
                      >
                        رفض
                      </button>
                    </>
                  )}
                  {req.status === "accepted" && (
                    <button
                      onClick={() => handleChat(req)}
                      style={buttonStyleChat}
                    >
                      دردشة
                    </button>
                  )}
                  {req.status === "rejected" && (
                    <span style={{ color: "#f87171", fontWeight: "bold" }}>
                      مرفوض
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal معاينة الصورة مع تكبير سلس */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
            cursor: "pointer",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1f2937",
              borderRadius: "0.75rem",
              padding: "1rem",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
              color: "#f9fafb",
              animation: "fadeInScale 0.3s ease",
            }}
          >
            <img
              src={
                previewItem.image ||
                (previewItem.images && previewItem.images[imageIndex])
              }
              alt={previewItem.name}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                transition: "transform 0.3s",
              }}
            />
            <h3 style={{ color: "#facc15", marginBottom: "0.5rem" }}>
              {previewItem.name}
            </h3>
            <p style={{ fontSize: "0.9rem" }}>{previewItem.desc}</p>

            {previewItem.images && previewItem.images.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.5rem",
                }}
              >
                <button onClick={prevImage} style={navButtonStyle}>
                  ⟨ السابق
                </button>
                <button onClick={nextImage} style={navButtonStyle}>
                  التالي ⟩
                </button>
              </div>
            )}

            <button
              onClick={() => setPreviewItem(null)}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.4rem",
                background: "#facc15",
                color: "#111827",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
          @keyframes fadeSlide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}
      </style>
    </PageWrapper>
  );
}

const buttonStyleAccept = {
  padding: "0.5rem 1rem",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontWeight: "bold",
};
const buttonStyleReject = {
  padding: "0.5rem 1rem",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontWeight: "bold",
};
const buttonStyleChat = {
  padding: "0.5rem 1rem",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontWeight: "bold",
};
const navButtonStyle = {
  padding: "0.4rem 0.8rem",
  background: "#facc15",
  color: "#111827",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontWeight: "bold",
};
