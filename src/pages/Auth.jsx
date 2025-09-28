import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // تحديث Firestore بدون انتظار UI
  const updateFirestoreAsync = async (user, displayName) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid))
      );
      if (userSnap.empty) {
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

  // تحقق من وجود البريد في Firestore
  const isEmailRegistered = async (emailToCheck) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", emailToCheck.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
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
      setMessage({ type: "success", text: "تم تسجيل الدخول بنجاح!" });
      navigate(from);
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
      updateFirestoreAsync(newUser, name.trim());
      setMessage({ type: "success", text: "تم حفظ الاسم بنجاح!" });
      navigate(from);
    } catch (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء حفظ الاسم!" });
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين كلمة المرور
  const handleResetPassword = async () => {
    if (!email.trim()) {
      setMessage({ type: "error", text: "يرجى إدخال البريد الإلكتروني!" });
      return;
    }
    setLoading(true);
    try {
      const registered = await isEmailRegistered(email.toLowerCase());
      if (!registered) {
        setMessage({ type: "error", text: "الإيميل غير مسجل!" });
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: "success",
        text: "تم إرسال رابط إعادة التعيين إلى بريدك!",
      });
      setResetMode(false);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resetMode) handleResetPassword();
    else if (isSignup) handleSignUp();
    else handleSignIn();
  };

  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>
          {resetMode
            ? "إعادة تعيين كلمة المرور"
            : isSignup
            ? "تسجيل حساب جديد"
            : "تسجيل الدخول"}
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
            {!resetMode && (
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                disabled={loading}
              />
            )}
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading
                ? resetMode
                  ? "جارٍ إرسال الرابط..."
                  : isSignup
                  ? "جارٍ إنشاء الحساب..."
                  : "جارٍ تسجيل الدخول..."
                : resetMode
                ? "إرسال رابط إعادة التعيين"
                : isSignup
                ? "إنشاء حساب"
                : "تسجيل الدخول"}
            </button>
            {!resetMode && (
              <p
                style={{
                  textAlign: "center",
                  marginTop: "1rem",
                  color: "#f1f5f9",
                }}
              >
                <span
                  style={{
                    color: "#00ABE4",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setResetMode(true)}
                >
                  نسيت كلمة المرور؟
                </span>
              </p>
            )}
            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#f1f5f9",
                fontWeight: "900",
                backdropFilter: "blur(5px)",
              }}
            >
              {isSignup ? "لديك حساب؟" : "لا تملك حساب؟"}{" "}
              <span
                onClick={() => {
                  setIsSignup(!isSignup);
                  setShowNameInput(false);
                  setResetMode(false);
                }}
                style={{
                  color: "#00ABE4",
                  cursor: "pointer",
                  fontSize: "1rem",
                  backdropFilter: "blur(5px)",
                  fontWeight: "bold",
                }}
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
      fontWeight: "bold",
    }}
  >
    {message.text}
  </div>
);

const containerStyle = {
  display: "flex",
  background: "linear-gradient(135deg, #E9F1FA, #00ABE4) no-repeat fixed",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

const formStyle = {
  background: "linear-gradient(343deg, #E9F1FA, #00ABE4) no-repeat fixed",
  minHeight: "400px",
  width: "350px",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  backdropFilter: "blur(5px)",
  padding: "2rem",
  borderRadius: "1rem",
  color: "#f9fafb",
  position: "relative",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "1rem",
  color: "snow",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  marginBottom: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #rgb(222 232 255)",
  background: "snow",
  color: "#1c0f0f",
  fontWeight: "500",
};

const buttonStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#00ABE4",
  fontSize: "1rem",
  color: "snow",
  fontWeight: "bold",
  cursor: "pointer",
};
