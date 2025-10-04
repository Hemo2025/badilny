import React from "react";

export default function UpdateScreen({ updateUrl, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        zIndex: 9999,
        padding: 20,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>تحديث التطبيق</h1>
      <p style={{ fontSize: 16, marginBottom: 20 }}>
        يوجد تحديث جديد للتطبيق للحصول على أفضل تجربة.
      </p>
      <div>
        <button
          style={{
            padding: "10px 20px",
            marginRight: 10,
            fontSize: 16,
            cursor: "pointer",
            borderRadius: 5,
          }}
          onClick={() => window.open(updateUrl, "_blank")}
        >
          تحديث الآن
        </button>
        <button
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: "pointer",
            borderRadius: 5,
          }}
          onClick={onClose}
        >
          لاحقًا
        </button>
      </div>
    </div>
  );
}
