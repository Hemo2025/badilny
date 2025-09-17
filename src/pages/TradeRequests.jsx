import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc, // ← أضف هذا السطر
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import Navbar from "../components/Navbar";

export default function TradeRequests() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "trades"),
      where("ownerId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setRequests(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const showNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000); // يختفي بعد 5 ثواني
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

  const handleDelete = async (request) => {
    const tradeRef = doc(db, "trades", request.id);
    try {
      await deleteDoc(tradeRef);
      showNotification("🗑️ تم حذف المقايضة");
    } catch (error) {
      console.error(error);
      showNotification("❌ حدث خطأ أثناء الحذف");
    }
  };

  return (
    <PageWrapper>
      <Navbar />
      <div
        style={{
          padding: "1rem",
          minHeight: "100vh",
          background: "#111827",
          color: "#f9fafb",
        }}
      >
        <h2 style={{ color: "#facc15", marginBottom: "1rem" }}>
          طلبات المقايضة
        </h2>

        {/* إشعارات انزلاق من الأعلى */}
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                transform: "translateY(-50px)",
                animation: "slideDown 0.5s forwards",
                background: "#facc15",
                color: "#111827",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                fontWeight: "bold",
                minWidth: "220px",
              }}
            >
              {n.message}
            </div>
          ))}
        </div>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {requests.map((req) => (
            <li
              key={req.id}
              style={{
                background: "#1f2937",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
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
                    }}
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
                    }}
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

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                <button
                  onClick={() => handleDelete(req)}
                  style={buttonStyleDelete}
                >
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* انميشن CSS */}
      <style>
        {`
          @keyframes slideDown {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
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

const buttonStyleDelete = {
  padding: "0.5rem 1rem",
  background: "#facc15",
  color: "#111827",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontWeight: "bold",
};
