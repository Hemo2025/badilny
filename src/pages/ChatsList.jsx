import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";

export default function ChatsList() {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser)
    );
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, "trades"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const chatData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const msgs = Array.isArray(data.messages) ? data.messages : [];
        const unreadCount = msgs.filter(
          (msg) => msg.senderId !== user.uid && !msg.read?.[user.uid]
        ).length;

        return {
          id: docSnap.id,
          chatId: data.chatId || docSnap.id,
          requestedItem: data.requestedItem,
          offeredItem: data.offeredItem,
          requesterName: data.requesterName,
          unreadCount,
          messages: msgs,
          participants: data.participants,
          deletedChatsFor: data.deletedChatsFor || [],
          status: data.status,
        };
      });

      const visibleChats = chatData.filter(
        (chat) => !chat.deletedChatsFor.includes(user.uid)
      );

      visibleChats.sort((a, b) => b.unreadCount - a.unreadCount);
      setChats(visibleChats);
    });

    return () => unsubscribeChats();
  }, [user]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2000);
  };

  const handleOpenChat = async (chat) => {
    const chatRef = doc(db, "trades", chat.id);
    const updatedMessages = chat.messages.map((msg) => {
      if (msg.senderId !== user.uid) {
        msg.read = { ...msg.read, [user.uid]: true };
      }
      return msg;
    });
    await updateDoc(chatRef, { messages: updatedMessages });
    navigate(`/chat/${chat.chatId}`, { state: { chat } });
  };

  const handleDeleteChat = async (chatId) => {
    const chatRef = doc(db, "trades", chatId);
    await updateDoc(chatRef, { deletedChatsFor: arrayUnion(user.uid) });
    showNotification("🗑️ تم حذف المحادثة من عندك فقط");
  };

  return (
    <PageWrapper>
      <Navbar />
      <div
        style={{
          padding: "1rem",
          background: "#111827",
          minHeight: "100vh",
          color: "#f9fafb",
        }}
      >
        <h2 style={{ color: "#facc15", marginBottom: "1rem" }}>
          قائمة المحادثات
        </h2>

        {notification && (
          <div
            style={{
              background: "#10b981",
              color: "#fff",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              transition: "0.3s",
            }}
          >
            {notification}
          </div>
        )}

        {chats.length === 0 && <p>لا توجد محادثات.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => handleOpenChat(chat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#1f2937",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                position: "relative",
                cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1f2937")
              }
            >
              {chat.requestedItem?.image && (
                <img
                  src={chat.requestedItem.image}
                  alt={chat.requestedItem.name}
                  style={{
                    width: "50px",
                    height: "50px",
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
                    width: "50px",
                    height: "50px",
                    borderRadius: "0.5rem",
                    objectFit: "cover",
                  }}
                />
              )}

              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <span style={{ fontWeight: "bold", color: "#facc15" }}>
                  {chat.requesterName || "مستخدم"}
                </span>
                <span>
                  {chat.requestedItem?.name} ↔ {chat.offeredItem?.name}
                </span>
              </div>

              {chat.unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "red",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  {chat.unreadCount}
                </span>
              )}

              {/* زر الحذف */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // لمنع فتح السطر عند الضغط على الحذف
                  handleDeleteChat(chat.id);
                }}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "0.5rem",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
}
