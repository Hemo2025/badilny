import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const oobCode = new URLSearchParams(window.location.search).get("oobCode");
    if (!oobCode) {
      setMessage("رابط إعادة التعيين غير صالح.");
      return;
    }
    setCode(oobCode);

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => setEmail(email))
      .catch(() => setMessage("الرابط غير صالح أو منتهي الصلاحية."));
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage("الرجاء إدخال كلمة مرور جديدة.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, code, newPassword);
      setMessage("✅ تم إعادة تعيين كلمة المرور بنجاح!");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      setMessage("حدث خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleReset}>
        <h2 style={titleStyle}>إعادة تعيين كلمة المرور</h2>
        {message && <div style={msgStyle}>{message}</div>}
        <input
          type="password"
          placeholder="أدخل كلمة المرور الجديدة"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={inputStyle}
          disabled={loading}
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
        </button>
      </form>
    </div>
  );
}

// ---- Styles مشابهة ----
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "linear-gradient(135deg, #E9F1FA, #00ABE4)",
};

const formStyle = {
  background: "#E9F1FA",
  padding: "2rem",
  borderRadius: "1rem",
  width: "350px",
  textAlign: "center",
  boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
};

const titleStyle = { marginBottom: "1rem", color: "#00ABE4" };
const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  marginBottom: "0.5rem",
  borderRadius: "0.5rem",
};
const buttonStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  background: "#00ABE4",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};
const msgStyle = { marginBottom: "1rem", color: "#f87171", fontWeight: "bold" };
