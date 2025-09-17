import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function ItemCard({ item }) {
  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(""); // ← رسالة الإشعار
  const [showToast, setShowToast] = useState(false); // ← للتحكم بعرض الإشعار

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
    });

    return () => unsubscribe();
  }, []);

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // الإشعار يختفي بعد 3 ثواني
  };

  const handleTradeRequest = async () => {
    if (!user) return showToastMsg("يجب تسجيل الدخول!");
    if (!selectedItem)
      return showToastMsg("اختر غرضك أولاً أو قم بإضافة غرضك!");

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

  return (
    <div
      style={{
        background: "#1f2937",
        padding: "1rem",
        borderRadius: "0.75rem",
        color: "#f9fafb",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        transition: "0.2s",
        position: "relative",
      }}
    >
      {/* الإشعار */}
      {showToast && <div style={toastStyle}>{toastMessage}</div>}

      <img
        src={item.image}
        alt={item.name}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
          borderRadius: "0.5rem",
        }}
      />
      <h3 style={{ marginTop: "0.5rem", color: "#facc15" }}>{item.name}</h3>
      <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>{item.desc}</p>
      {item.userName && (
        <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
          بواسطة: {item.userName}
        </p>
      )}

      {user && item.userId !== user.uid && (
        <>
          <button
            onClick={() => setShowTradeForm(!showTradeForm)}
            style={tradeButtonStyle}
          >
            أرغب بالمقايضة
          </button>

          {showTradeForm && (
            <div style={tradeFormStyle}>
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
          )}
        </>
      )}
    </div>
  );
}

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
  animation: "slideDown 0.3s ease-out",
  zIndex: 100,
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
