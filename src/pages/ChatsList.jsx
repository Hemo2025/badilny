import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import useSound from "use-sound";

export default function ChatsList() {
  const [chats, setChats] = useState([]);
  const [previewItem, setPreviewItem] = useState(null); // لمعاينة الصور
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState("");
  const openChatIdRef = useRef(null);
  const seenMessagesRef = useRef(new Set());
  const [playNotification] = useSound(
    `${process.env.PUBLIC_URL}/sounds/notification.mp3`,
    { volume: 0.5 }
  );

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) =>
      setUser(currentUser)
    );
    return () => unsubscribeAuth();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "م" : "ص";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `اليوم ${timeString}`;
    } else {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year} ${timeString}`;
    }
  };

  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const chatMap = {};

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const chatId = data.chatId;

        if (!chatMap[chatId]) {
          const otherUid = data.participants.find((uid) => uid !== user.uid);
          let otherName = "مستخدم";

          if (otherUid) {
            const otherDoc = await getDoc(doc(db, "users", otherUid));
            if (otherDoc.exists()) {
              otherName = otherDoc.data().displayName || "مستخدم";
            }
          }

          chatMap[chatId] = {
            chatId,
            requestedItem: data.requestedItem,
            offeredItem: data.offeredItem,
            participants: data.participants,
            otherName,
            messages: [],
            unreadCount: 0,
            lastMessage: "",
            lastTimestamp: null,
          };
        }

        chatMap[chatId].messages.push({ ...data, id: docSnap.id });

        if (
          !data.readBy?.includes(user.uid) &&
          data.senderId !== user.uid &&
          !seenMessagesRef.current.has(docSnap.id)
        ) {
          seenMessagesRef.current.add(docSnap.id);
          showNotification(`رسالة جديدة من ${chatMap[chatId].otherName}`);
          playNotification();
        }

        if (!data.readBy?.includes(user.uid)) {
          chatMap[chatId].unreadCount++;
        }
      }

      Object.values(chatMap).forEach((chat) => {
        chat.messages.sort((a, b) => a.timestamp - b.timestamp);
        if (chat.messages.length > 0) {
          const lastMsg = chat.messages[chat.messages.length - 1];
          chat.lastMessage = lastMsg.text;
          chat.lastTimestamp = formatTimestamp(lastMsg.timestamp);
        }
      });

      const chatList = Object.values(chatMap);
      // ترتيب المحادثات حسب آخر رسالة (الأحدث أولاً)
      chatList.sort(
        (a, b) =>
          (b.messages[b.messages.length - 1]?.timestamp || 0) -
          (a.messages[a.messages.length - 1]?.timestamp || 0)
      );

      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user, playNotification]);

  const handleOpenChat = async (chat) => {
    openChatIdRef.current = chat.chatId;

    for (let msg of chat.messages) {
      if (!msg.readBy?.includes(user.uid) && msg.senderId !== user.uid) {
        const msgRef = doc(db, "messages", msg.id);
        await updateDoc(msgRef, { readBy: arrayUnion(user.uid) });
      }
    }

    navigate(`/chat/${chat.chatId}`, { state: { chat } });
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2000);
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setImageIndex(0);
  };

  return (
    <PageWrapper>
      <div style={{ position: "relative", zIndex: "20" }}>
        <Navbar />
      </div>
      <div
        style={{
          padding: "1rem",
          background:
            "linear-gradient(135deg, #E9F1FA, #00ABE4) no-repeat fixed",
          minHeight: "100svh",
          height:"100dvh",
          color: "#f9fafb",
        }}
      >
        <h2
          style={{
            color: "snow",
            marginBottom: "1rem",
            background:
              "linear-gradient(135deg, rgb(40, 57, 76), rgb(61, 54, 127))",
          }}
        >
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
            }}
          >
            {notification}
          </div>
        )}

        {chats.length === 0 && <p>لا توجد محادثات.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              onClick={() => handleOpenChat(chat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#1f2937",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                position: "relative",
                marginBottom: "0.5rem",
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
                    cursor: "pointer",
                    transition: "transform 0.3s",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(chat.requestedItem);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
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
                    cursor: "pointer",
                    transition: "transform 0.3s",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(chat.offeredItem);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              )}
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <span style={{ fontWeight: "bold", color: "#facc15" }}>
                  {chat.otherName}
                </span>
                <span style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
                  {chat.lastMessage || "بدون رسائل بعد"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  {chat.requestedItem?.name} ↔ {chat.offeredItem?.name}
                </span>
                {chat.lastTimestamp && (
                  <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                    {chat.lastTimestamp}
                  </span>
                )}
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
            </li>
          ))}
        </ul>
      </div>

      {/* Modal معاينة الصور */}
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
              src={previewItem.image}
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
          @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}
      </style>
    </PageWrapper>
  );
}
