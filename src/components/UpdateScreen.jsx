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
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        zIndex: 9999,
      }}
    >
      <h1>يوجد تحديث جديد</h1>
      <p>للحصول على أفضل تجربة، يرجى تحديث التطبيق.</p>
      <div style={{ marginTop: 20 }}>
        <button
          style={{
            padding: "10px 20px",
            marginRight: 10,
            fontSize: 16,
            cursor: "pointer",
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
          }}
          onClick={onClose}
        >
          لاحقًا
        </button>
      </div>
    </div>
  );
}
