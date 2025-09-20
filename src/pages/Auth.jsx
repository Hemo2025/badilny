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
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // تحقق من وجود المستخدم في مجموعة users
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || "مستخدم",
          email: user.email,
          createdAt: new Date(),
        });
      }

      setMessage({ type: "success", text: "تم تسجيل الدخول بنجاح!" });
      navigate(from);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setNewUser(userCredential.user);
      setShowNameInput(true);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleSaveName = async () => {
    if (name.trim() && newUser) {
      try {
        await updateProfile(newUser, { displayName: name.trim() });

        // أضف المستخدم لمجموعة users
        await setDoc(doc(db, "users", newUser.uid), {
          uid: newUser.uid,
          displayName: name.trim(),
          email: newUser.email,
          createdAt: new Date(),
        });

        setMessage({ type: "success", text: "تم حفظ الاسم بنجاح!" });
        navigate(from);
      } catch (error) {
        setMessage({ type: "error", text: "حدث خطأ أثناء حفظ الاسم!" });
      }
    } else {
      setMessage({ type: "error", text: "يرجى إدخال الاسم!" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) handleSignUp();
    else handleSignIn();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#111827",
      }}
    >
      <form
        style={{
          background: "#1f2937",
          padding: "2rem",
          borderRadius: "1rem",
          color: "#f9fafb",
          width: "300px",
          position: "relative",
        }}
        onSubmit={handleSubmit}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            color: "#facc15",
          }}
        >
          {isSignup ? "تسجيل حساب جديد" : "تسجيل الدخول"}
        </h2>

        {message && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              textAlign: "center",
              backgroundColor:
                message.type === "success" ? "#34d399" : "#f87171",
              color: "#111827",
              fontWeight: "bold",
            }}
          >
            {message.text}
          </div>
        )}

        {showNameInput ? (
          <>
            <input
              type="text"
              placeholder="أدخل اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="button" onClick={handleSaveName} style={buttonStyle}>
              حفظ الاسم
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
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" style={buttonStyle}>
              {isSignup ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem" }}>
              {isSignup ? "لديك حساب؟" : "لا تملك حساب؟"}{" "}
              <span
                onClick={() => setIsSignup(!isSignup)}
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
