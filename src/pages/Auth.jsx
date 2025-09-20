import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // تحديث Firestore في الخلفية بدون انتظار UI
  const updateFirestoreAsync = async (user, displayName) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: displayName || user.displayName || "مستخدم",
          email: user.email,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("Firestore update failed:", err);
    }
  };

  // تسجيل الدخول
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // نجاح فوري للواجهة
      setMessage({ type: "success", text: "تم تسجيل الدخول بنجاح!" });
      navigate(from);

      // تحديث Firestore في الخلفية
      updateFirestoreAsync(user);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // إنشاء حساب جديد
  const handleSignUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setNewUser(userCredential.user);
      setShowNameInput(true);

      // UI سريع: لا تنتظر Firestore
      setMessage({ type: "success", text: "تم إنشاء الحساب! الآن أدخل اسمك." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // حفظ الاسم
  const handleSaveName = async () => {
    if (!name.trim() || !newUser) {
      setMessage({ type: "error", text: "يرجى إدخال الاسم!" });
      return;
    }
    setLoading(true);
    try {
      await updateProfile(newUser, { displayName: name.trim() });

      // Firestore في الخلفية
      updateFirestoreAsync(newUser, name.trim());

      setMessage({ type: "success", text: "تم حفظ الاسم بنجاح!" });
      navigate(from);
    } catch (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء حفظ الاسم!" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) handleSignUp();
    else handleSignIn();
  };

  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>
          {isSignup ? "تسجيل حساب جديد" : "تسجيل الدخول"}
        </h2>

        {message && <MessageBox message={message} />}

        {showNameInput ? (
          <>
            <input
              type="text"
              placeholder="أدخل اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSaveName}
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? "جارٍ الحفظ..." : "حفظ الاسم"}
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              disabled={loading}
            />
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading
                ? isSignup
                  ? "جارٍ إنشاء الحساب..."
                  : "جارٍ تسجيل الدخول..."
                : isSignup
                ? "إنشاء حساب"
                : "تسجيل الدخول"}
            </button>
            <p style={{ textAlign: "center", marginTop: "1rem" }}>
              {isSignup ? "لديك حساب؟" : "لا تملك حساب؟"}{" "}
              <span
                onClick={() => {
                  setIsSignup(!isSignup);
                  setShowNameInput(false);
                }}
                style={{ color: "#facc15", cursor: "pointer" }}
              >
                {isSignup ? "تسجيل الدخول" : "إنشاء حساب"}
              </span>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

// رسالة تنبيه
const MessageBox = ({ message }) => (
  <div
    style={{
      marginBottom: "1rem",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      textAlign: "center",
      backgroundColor: message.type === "success" ? "#34d399" : "#f87171",
      color: "#111827",
      fontWeight: "bold",
    }}
  >
    {message.text}
  </div>
);

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#111827",
};

const formStyle = {
  background: "#1f2937",
  padding: "2rem",
  borderRadius: "1rem",
  color: "#f9fafb",
  width: "300px",
  position: "relative",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "1rem",
  color: "#facc15",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  marginBottom: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #facc15",
  background: "#111827",
  color: "#f9fafb",
};

const buttonStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#facc15",
  color: "#111827",
  fontWeight: "bold",
  cursor: "pointer",
};
