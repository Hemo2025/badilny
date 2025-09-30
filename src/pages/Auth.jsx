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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import emailjs from "@emailjs/browser";

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
  const [verificationCode, setVerificationCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/profile";

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // -------------------------
  // البريد المؤقت
  const disposableDomains = new Set([
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "trashmail.com",
    "guerrillamail.com",
    "yopmail.com",
  ]);
  const isDisposableEmail = (emailStr) => {
    try {
      const domain = emailStr.split("@")[1].toLowerCase();
      return disposableDomains.has(domain);
    } catch {
      return false;
    }
  };

  // -------------------------
  // تحديث Firestore
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
          email: user.email ? user.email.toLowerCase() : "",
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("Firestore update failed:", err);
    }
  };

  // -------------------------
  // التحقق من تسجيل البريد
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

  // -------------------------
  // تسجيل الدخول
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      await user.reload();
      setMessage({ type: "success", text: "تم تسجيل الدخول بنجاح!" });
      navigate(from);
      updateFirestoreAsync(user);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // تسجيل حساب جديد + التحقق
  const handleSignUp = async () => {
    if (isDisposableEmail(email)) {
      setMessage({
        type: "error",
        text: "الرجاء استخدام بريد حقيقي (غير مؤقت).",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      setNewUser(user);

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      await addDoc(collection(db, "emailVerification"), {
        uid: user.uid,
        code,
        createdAt: serverTimestamp(),
      });

      await emailjs.send(
        "service_bchvqoe",
        "template_svlws3c",
        { user_email: email, otp_code: code },
        "rV01AhweJSjgaU6Q6"
      );

      setShowCodeInput(true);
      setMessage({
        type: "success",
        text: "تم إرسال رمز التحقق إلى بريدك. الرجاء إدخاله هنا.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // التحقق من الرمز
  const handleVerifyCode = async () => {
    if (verificationCode.trim() !== generatedCode) {
      setMessage({ type: "error", text: "الرمز غير صحيح!" });
      return;
    }
    setLoading(true);
    try {
      setShowCodeInput(false);
      setShowNameInput(true);
      setMessage({
        type: "success",
        text: "تم التحقق من بريدك، يمكنك الآن إدخال اسمك.",
      });
    } catch (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء التحقق!" });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // حفظ الاسم بعد التحقق
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

  // -------------------------
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
      await sendPasswordResetEmail(auth, email.trim());
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

  // -------------------------
  // معالجة النموذج
  const handleSubmit = (e) => {
    e.preventDefault();
    if (resetMode) handleResetPassword();
    else if (showCodeInput) handleVerifyCode();
    else if (showNameInput) handleSaveName();
    else if (isSignup) handleSignUp();
    else handleSignIn();
  };

  return (
    <div style={containerStyle}>
      {/* فيديو خلفية */}
      <video
        src="/video.mp4"
        autoPlay
        loop
        muted
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />

      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>
          {resetMode
            ? "إعادة تعيين كلمة المرور"
            : isSignup
            ? "تسجيل حساب جديد"
            : "تسجيل الدخول"}
        </h2>

        {message && <MessageBox message={message} />}

        {showCodeInput ? (
          <>
            <input
              type="text"
              placeholder="أدخل رمز التحقق المرسل للبريد"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              style={inputStyle}
              disabled={loading}
            />
            <HoverButton
              text={loading ? "جارٍ التحقق..." : "تحقق من الرمز"}
              loading={loading}
            />
          </>
        ) : showNameInput ? (
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
            <HoverButton
              text={loading ? "جارٍ الحفظ..." : "حفظ الاسم"}
              loading={loading}
            />
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
            <HoverButton
              text={
                loading
                  ? resetMode
                    ? "جارٍ إرسال الرابط..."
                    : isSignup
                    ? "جارٍ إنشاء الحساب..."
                    : "جارٍ تسجيل الدخول..."
                  : resetMode
                  ? "إرسال رابط إعادة التعيين"
                  : isSignup
                  ? "إنشاء حساب"
                  : "تسجيل الدخول"
              }
              loading={loading}
            />
            {!resetMode && (
              <p style={forgotStyle} onClick={() => setResetMode(true)}>
                نسيت كلمة المرور؟
              </p>
            )}
            <p style={switchStyle}>
              {isSignup ? "لديك حساب؟" : "لا تملك حساب؟"}{" "}
              <span
                onClick={() => {
                  setIsSignup(!isSignup);
                  setShowNameInput(false);
                  setResetMode(false);
                  setShowCodeInput(false);
                }}
                style={switchSpanStyle}
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

// -----------------------------
// Hover Button مع Spinner
const HoverButton = ({ text, loading }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        ...buttonStyle,
        background: hover ? "#0086b3" : "#00ABE4",
        transform: hover ? "scale(1.05)" : "scale(1)",
        boxShadow: hover
          ? "0 6px 20px rgba(0,0,0,0.35)"
          : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "all 0.3s ease",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.6rem",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {loading && <Spinner />}
      {text}
    </button>
  );
};

// -----------------------------
// Spinner دائري
const Spinner = () => (
  <div
    style={{
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderTop: "3px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }}
  />
);

// -----------------------------
// keyframes للـspinner
const styleSheet = document.styleSheets[0];
const keyframes = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

// -----------------------------
// رسالة التنبيه
const MessageBox = ({ message }) => (
  <div
    style={{
      marginBottom: "1rem",
      padding: "0.7rem 1rem",
      borderRadius: "0.7rem",
      textAlign: "center",
      backgroundColor: message.type === "success" ? "#34d399" : "#f87171",
      fontWeight: "bold",
      boxShadow: "0 3px 15px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
    }}
  >
    {message.text}
  </div>
);

// -----------------------------
// الأنماط
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  position: "relative",
  overflow: "hidden",
  padding: "1rem",
};

const formStyle = {
  width: "100%",
  maxWidth: "400px",
  background: "rgba(255, 255, 255, 0.3)", // شفاف جزئياً
  padding: "2.5rem 1.5rem",
  borderRadius: "2rem",
  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  zIndex: 1,
  boxSizing: "border-box",
  backdropFilter: "blur(0px)", // يضمن عدم تأثير البلو على العناصر الداخلية
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "1.8rem",
  fontSize: "1.8rem",
  fontWeight: "800",
  color: "#00ABE4",
};

const inputStyle = {
  width: "100%",
  padding: "0.8rem 1rem",
  marginBottom: "1rem",
  borderRadius: "0.9rem",
  border: "1px solid #ddd",
  background: "#f7f9fb",
  fontWeight: "500",
  fontSize: "0.95rem",
  color: "#555",
  outline: "none",
  transition: "all 0.3s ease",
};

const buttonStyle = {
  width: "100%",
  padding: "0.85rem",
  borderRadius: "0.9rem",
  background: "#00ABE4",
  fontSize: "1.05rem",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  border: "none",
};

const forgotStyle = {
  textAlign: "center",
  marginTop: "0.9rem",
  color: "#00ABE4",
  cursor: "pointer",
  fontWeight: "bold",
  textDecoration: "underline",
  fontSize: "0.9rem",
};

const switchStyle = {
  textAlign: "center",
  marginTop: "1rem",
  fontSize: "0.95rem",
  color: "#555",
  fontWeight: "600",
};

const switchSpanStyle = {
  color: "#00ABE4",
  cursor: "pointer",
  fontWeight: "800",
};
