import React from "react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
export default function Home() {
  return (
    <PageWrapper>
      <Navbar />
      <div className="container">
        <h1
          style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
        >
          مرحباً بك في موقع بادلني 
        </h1>
        <p style={{ fontSize: "1rem", color: "#d1d5db" }}>
          ابدأ بتصفح الأغراض وبادلها بسهولة!
        </p>
      </div>
    </PageWrapper>
  );
}
