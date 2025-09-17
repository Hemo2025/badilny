import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [pendingTrades, setPendingTrades] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // عداد طلبات المقايضة
        const tradesQuery = query(
          collection(db, "trades"),
          where("ownerId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
          setPendingTrades(snapshot.docs.length);
        });

        // عداد الرسائل الجديدة
        const chatsQuery = query(
          collection(db, "trades"),
          where("participants", "array-contains", currentUser.uid)
        );
        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
          let count = 0;
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            // التأكد من أن messages موجودة ومصفوفة
            const messages = Array.isArray(data.messages) ? data.messages : [];
            if (data.chatId) {
              const unread = messages.filter(
                (msg) =>
                  msg.senderId !== currentUser.uid &&
                  !(msg.read && msg.read[currentUser.uid])
              );
              count += unread.length;
            }
          });
          setUnreadChats(count);
        });

        return () => {
          unsubscribeTrades();
          unsubscribeChats();
        };
      }
    });

    return () => {};
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/Auth");
    } catch (error) {
      console.error("خطأ أثناء تسجيل الخروج:", error);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/Auth", { state: { from: location.pathname } });
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.8rem 1rem",
        background: "#1f2937",
        color: "#f9fafb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontSize: "0.9rem",
      }}
    >
      <Link
        to="/"
        style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#facc15" }}
      >
        Baddel Li
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <Link to="/Market" style={linkStyle}>
          الماركت
        </Link>
        <Link to="/Profile" style={linkStyle}>
          ملفي
        </Link>

        {user && (
          <Link
            to="/Add"
            style={{
              padding: "0.3rem 0.6rem",
              background: "#34d399",
              color: "#111827",
              fontWeight: "bold",
              borderRadius: "0.4rem",
              textDecoration: "none",
            }}
          >
            إضافة غرض
          </Link>
        )}

        {/* زر المقايضات مع العداد */}
        {user && (
          <button
            onClick={() => navigate("/traderequests")}
            style={{
              padding: "0.3rem 0.6rem",
              background: "#f59e0b",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "0.4rem",
              cursor: "pointer",
              position: "relative",
            }}
          >
            المقايضات
            {pendingTrades > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "0.15rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {pendingTrades}
              </span>
            )}
          </button>
        )}

        {/* زر الدردشات مع العداد */}
        {user && (
          <button
            onClick={() => navigate("/chatslist")}
            style={{
              padding: "0.3rem 0.6rem",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "0.4rem",
              cursor: "pointer",
              position: "relative",
            }}
          >
            الدردشات
            {unreadChats > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "0.15rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {unreadChats}
              </span>
            )}
          </button>
        )}

        {user && (
          <button onClick={handleLogout} style={buttonStyle}>
            تسجيل الخروج
          </button>
        )}

        {!user && (
          <button onClick={handleLoginRedirect} style={buttonStyle}>
            تسجيل الدخول
          </button>
        )}
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "#f9fafb",
  textDecoration: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  transition: "0.2s",
  background: "#374151",
};

const buttonStyle = {
  padding: "0.3rem 0.6rem",
  background: "#facc15",
  color: "#111827",
  fontWeight: "bold",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
};
