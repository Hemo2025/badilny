import React from "react";

export default function UpdateScreen({ updateUrl, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: 30,
          borderRadius: 12,
          width: "90%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>تحديث التطبيق</h2>
        <p style={{ marginBottom: 30 }}>
          هناك نسخة جديدة من التطبيق متاحة. يرجى التحديث للاستمرار.
        </p>

        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <button
            onClick={() => {
              window.open(updateUrl, "_blank");
            }}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            تحديث الآن
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              backgroundColor: "#ccc",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
}
