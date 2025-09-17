import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import PageWrapper from "../components/PageWrapper";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function Market() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        list.sort((a, b) =>
          a.featured === b.featured ? 0 : a.featured ? -1 : 1
        );
        setItems(list);
      } catch (error) {
        console.error(error);
      }
    };
    fetchItems();
  }, []);

  return (
    <PageWrapper>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "1rem" }}>
        {items.length === 0 && (
          <p
            style={{ textAlign: "center", marginTop: "2rem", color: "#facc15" }}
          >
            لا توجد أغراض بعد.
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {items.map((item, idx) => (
            <ItemCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
