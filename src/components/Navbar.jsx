import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FiUser } from "react-icons/fi";
import { NavLink } from "react-router-dom";

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
        background: "rgb(136, 212, 241)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.4)",
        color: "#f9fafb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontSize: "0.9rem",
      }}
    >
      <NavLink
        to="/"
        style={({ isActive }) => ({
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: "snow",
          textTransform: "uppercase",
          padding: "0.3rem 0.5rem",
          borderRadius: "0.4rem",
          transition: "0.2s",
          ...(isActive && {
            color: "#00ABE4",
            backgroundColor: "#ffffff",
            transform: "scale(1.01)",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          }),
        })}
      >
        Badilny
      </NavLink>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <NavLink
          to="/Market"
          style={({ isActive }) => ({
            ...linkStyle,
            // إذا كان الزر active (أي نحن في صفحة /Market)
            ...(isActive && {
              color: "#00ABE4",
              transform: "scale(1.01)",
              backgroundColor: "#ffffff",
              padding: "0.3rem 4rem",
              borderRadius: "0.4rem",
              transition: "0.2s",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }),
          })}
        >
          السوق
        </NavLink>

        <NavLink
          to="/Profile"
          style={({ isActive }) => ({
            ...linkStyle,
            padding: "0.3rem 4rem", // حجم أصغر للأيقونة
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(isActive && {
              color: "#00ABE4",
              transform: "scale(1.01)",
              backgroundColor: "#ffffff",
              borderRadius: "0.4rem",
              transition: "0.2s",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }),
          })}
        >
          <FiUser
            style={{
              display: "inline",
              verticalAlign: "middle",
              fontSize: "1.6rem",
              padding: "0.2rem",
            }}
          />
        </NavLink>

        {user && (
          <Link to="/Add" className="add-btn floating-btn">
            أضف غرض
          </Link>
        )}

        {user && (
          <NavLink
            to="/traderequests"
            style={({ isActive }) => ({
              padding: "0.25rem 0.5rem", // أصغر شوي
              color: "#f6f6f6",
              background: "rgb(0, 171, 228) ",
              fontWeight: "bold",
              fontSize: "0.85rem",
              borderRadius: "0.4rem",
              cursor: "pointer",
              position: "relative",
              textAlign: "center",
              transition: "all 0.2s ease",
              ...(isActive && {
                color: "#00ABE4",
                backgroundColor: "#ffffff",
                transform: "scale(1.01)",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }),
            })}
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
                  padding: "0.15rem 0.4rem",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                }}
              >
                {pendingTrades}
              </span>
            )}
          </NavLink>
        )}

        {user && (
          <button
            onClick={() => navigate("/chatslist")}
            style={{
              background: "rgb(50 160 73)",
              fontWeight: "bold",
              fontSize: "1rem",
              padding: "0.25rem 0.5rem",
              color: "#fff",
              borderRadius: "0.4rem",
              cursor: "pointer",
              position: "relative",
            }}
          >
            المحادثات💬
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

      {/* Floating button animation */}
      <style>{`
        .add-btn {
          padding: 0.3rem 0.6rem;
          background: #32e033;
          color: #fff;
          font-weight: bold;
          border-radius: 0.4rem;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.3s ease;
        }

        .floating-btn {
          animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </nav>
  );
}

const linkStyle = {
  color: "#f9fafb",
  textDecoration: "none",
  margin: "10px 0rem",
  padding: "0.3rem 4rem",
  borderRadius: "0.4rem",
  transition: "0.2s",
};

const buttonStyle = {
  padding: "0.3rem 0.6rem",
  background: "tomato",
  position: "relative",
  top: "0",
  left: "0",
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: "0.4rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
};
