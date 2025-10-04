import React from "react";

export default function UpdateScreen({ updateUrl, onClose }) {
  const handleUpdate = () => {
    window.open(updateUrl, "_system"); // يفتح الرابط في المتصفح
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚀 تحديث جديد متاح</h1>
      <p style={styles.text}>
        يوجد إصدار جديد من التطبيق. يرجى التحديث للاستمرار.
      </p>

      <div style={styles.btnRow}>
        <button style={styles.buttonPrimary} onClick={handleUpdate}>
          تحديث الآن
        </button>
        <button style={styles.buttonSecondary} onClick={onClose}>
          لاحقًا
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f6f8",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  text: {
    fontSize: "16px",
    marginBottom: "20px",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
  },
  buttonPrimary: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "12px 20px",
    fontSize: "16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  buttonSecondary: {
    backgroundColor: "#ddd",
    color: "#333",
    border: "none",
    padding: "12px 20px",
    fontSize: "16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
