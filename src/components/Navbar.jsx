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
        const tradesQuery = query(
          collection(db, "trades"),
          where("ownerId", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
          setPendingTrades(snapshot.docs.length);
        });

        const messagesQuery = query(
          collection(db, "messages"),
          where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
          let count = 0;
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (
              !data.readBy?.includes(currentUser.uid) &&
              data.senderId !== currentUser.uid
            ) {
              count++;
            }
          });
          setUnreadChats(count);
        });

        return () => {
          unsubscribeTrades();
          unsubscribeMessages();
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
        style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#facc15" }}
      >
        Badilny
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
          السوق
        </Link>
        <Link to="/Profile" style={linkStyle}>
          الملف الشخصي
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
          أضف غرض
          </Link>
        )}

        {user && (
          <button
            onClick={() => navigate("/traderequests")}
            style={{
              padding: "0.3rem 0.6rem",
              background: "green",
              color: "#fff",
              fontWeight: "bold",
              fontSize:" 0.9rem",
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

        {user && (
          <button
            onClick={() => navigate("/chatslist")}
            style={{
              padding: "0.1rem 0.5rem",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.4rem",
              borderRadius: "0.4rem",
              cursor: "pointer",
              position: "relative",
            }}
          >
            💬
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
            الخروج 🚪
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
  margin: "10px 0rem",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  transition: "0.2s",
  background: "#374151",
};

const buttonStyle = {
  padding: "0.3rem 0.6rem",
  background: "tomato",
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
};
