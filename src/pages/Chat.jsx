import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
export default function Chat() {
  const location = useLocation();
  const { chat } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!chat?.id) return;
    const chatDocRef = doc(db, "trades", chat.id);

    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const msgs = Array.isArray(data.messages) ? data.messages : [];
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat?.id || !currentUser) return;
    const chatDocRef = doc(db, "trades", chat.id);
    const newMessage = {
      senderId: currentUser.uid,
      text: input,
      timestamp: Date.now(),
      read: {},
    };
    try {
      await updateDoc(chatDocRef, { messages: arrayUnion(newMessage) });
      setInput("");
    } catch (err) {
      console.error("خطأ أثناء إرسال الرسالة:", err);
    }
  };

  if (!chat || !chat.requestedItem || !chat.offeredItem) {
    return (
      <div style={{ padding: "1rem", color: "#facc15" }}>
        لا توجد بيانات كافية لعرض المحادثة.
      </div>
    );
  }

  return (
    <PageWrapper>
      <Navbar />
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#111827",
          color: "#f9fafb",
        }}
      >
        {/* البار العلوي */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.8rem",
            background: "#1f2937",
            borderBottom: "1px solid #374151",
          }}
        >
          {chat.requestedItem?.image && (
            <img
              src={chat.requestedItem.image}
              alt={chat.requestedItem.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "0.5rem",
                objectFit: "cover",
              }}
            />
          )}
          {chat.offeredItem?.image && (
            <img
              src={chat.offeredItem.image}
              alt={chat.offeredItem.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "0.5rem",
                objectFit: "cover",
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: "bold", color: "#facc15" }}>
              {chat.requesterName || "مستخدم"}
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              {chat.requestedItem.name} ↔ {chat.offeredItem.name}
            </div>
          </div>
        </div>

        {/* المحادثة */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                textAlign: msg.senderId === currentUser?.uid ? "right" : "left",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 0.8rem",
                  borderRadius: "0.5rem",
                  background:
                    msg.senderId === currentUser?.uid ? "#3b82f6" : "#374151",
                  color: "#fff",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* إدخال الرسالة */}
        <div
          style={{
            display: "flex",
            padding: "0.5rem",
            gap: "0.5rem",
            borderTop: "1px solid #374151",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالة..."
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              background: "#1f2937",
              color: "#f9fafb",
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: "0.6rem 1rem",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            إرسال
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
