import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chat } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [otherName, setOtherName] = useState("مستخدم");
  const [stickyDate, setStickyDate] = useState("");
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const currentUser = auth.currentUser;

  const audioRef = useRef(
    new Audio("https://www.myinstants.com/media/sounds/notification.mp3")
  ); // ضع ملف الصوت في public

  // جلب اسم الطرف الآخر
  useEffect(() => {
    const fetchOtherName = async () => {
      if (!chat || !currentUser) return;
      const otherUid = chat.participants.find((uid) => uid !== currentUser.uid);
      if (otherUid) {
        const otherDoc = await getDoc(doc(db, "users", otherUid));
        if (otherDoc.exists()) {
          setOtherName(otherDoc.data().displayName || "مستخدم");
        }
      }
    };
    fetchOtherName();
  }, [chat, currentUser]);

  // جلب الرسائل مع تحديث readBy
  useEffect(() => {
    if (!chat?.chatId) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chat.chatId)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      msgs.sort((a, b) => a.timestamp - b.timestamp);

      for (let msg of msgs) {
        if (
          msg.senderId !== currentUser.uid &&
          !msg.readBy?.includes(currentUser.uid)
        ) {
          const msgRef = doc(db, "messages", msg.id);
          await updateDoc(msgRef, { readBy: arrayUnion(currentUser.uid) });

          // اشعار صوتي لو انت مو في نفس المحادثة
          if (location.pathname !== `/chat/${chat.chatId}`) {
            audioRef.current.play().catch(() => {});
          }
        }
      }

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chat, currentUser, location.pathname]);

  // Scroll لأول مرة عند فتح المحادثة
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [chat?.chatId]);

  // Scroll عند إضافة رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // تحديث التاريخ sticky عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const children = Array.from(containerRef.current.children);
      const firstVisible = children.find(
        (child) => child.getBoundingClientRect().bottom > 0
      );
      if (firstVisible && firstVisible.dataset.date) {
        setStickyDate(firstVisible.dataset.date);
      }
    };
    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat?.chatId || !currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        chatId: chat.chatId,
        senderId: currentUser.uid,
        text: input,
        timestamp: Date.now(),
        participants: chat.participants || [],
        requestedItem: chat.requestedItem,
        offeredItem: chat.offeredItem,
        readBy: [currentUser.uid],
      });
      setInput("");
    } catch (err) {
      console.error("خطأ أثناء إرسال الرسالة:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div style={{ padding: "1rem", color: "#facc15" }}>
        لا توجد بيانات كافية لعرض المحادثة.
      </div>
    );
  }

  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "اليوم";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "أمس";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: "date", text: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: "message", ...msg });
  });

  return (
    <PageWrapper>
      <div style={{ position: "relative", zIndex: "20" }}>
        <Navbar />
      </div>
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
          <div>
            <div style={{ fontWeight: "bold", color: "#facc15" }}>
              {otherName}
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              {chat.requestedItem?.name} ↔ {chat.offeredItem?.name}
            </div>
          </div>
        </div>

        {/* Sticky التاريخ */}
        <div
          style={{
            position: "sticky",
            top: 0,
            textAlign: "center",
            background: "#111827",
            color: "#9ca3af",
            padding: "3px 0",
            fontSize: "0.8rem",
            zIndex: 10,
          }}
        >
          {stickyDate}
        </div>

        {/* المحادثة */}
        <div
          ref={containerRef}
          style={{ flex: .8, overflowY: "auto", padding: "1rem" }}
        >
          {groupedMessages.map((msg, idx) =>
            msg.type === "date" ? (
              <div
                key={idx}
                style={{
                  textAlign: "center",
                  margin: "10px 0",
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                {msg.text}
              </div>
            ) : (
              <div
                key={msg.id}
                data-date={formatDate(msg.timestamp)}
                style={{
                  textAlign:
                    msg.senderId === currentUser?.uid ? "right" : "left",
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
                    overflowWrap: "anywhere",
                    maxWidth: "70%",
                  }}
                >
                  {msg.text}{" "}
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#d1d5db",
                      marginLeft: "5px",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </span>
              </div>
            )
          )}
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
            onKeyDown={handleKeyPress}
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
