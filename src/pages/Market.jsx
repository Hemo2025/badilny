import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import PageWrapper from "../components/PageWrapper";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function Market() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all"); // all, new, used, featured

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // ترتيب featured أولًا
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

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    if (tab === "all") return matchesSearch;
    if (tab === "new") return matchesSearch && item.condition === "new";
    if (tab === "used") return matchesSearch && item.condition === "used";
    if (tab === "featured") return matchesSearch && item.featured;
    return matchesSearch;
  });

  return (
    <PageWrapper>
      <Navbar />
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto",
          padding: "1rem",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {/* حقل البحث */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #facc15",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              width: "320px",
              maxWidth: "90%",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) =>
              (e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)")
            }
            onBlur={(e) =>
              (e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)")
            }
          />
        </div>

        {/* التبويبات */}
        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {["all", "new", "used", "featured"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background: tab === t ? "#facc15" : "#f3f4f6",
                color: tab === t ? "#1f2937" : "#6b7280",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow:
                  tab === t
                    ? "0 4px 12px rgba(250, 204, 21, 0.4)"
                    : "0 2px 5px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {t === "all"
                ? "الكل"
                : t === "new"
                ? "جديد"
                : t === "used"
                ? "قديم"
                : "مميز"}
            </button>
          ))}
        </div>

        {/* عرض المنتجات */}
        {filteredItems.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              marginTop: "3rem",
              color: "#fbbf24",
              fontWeight: "500",
              fontSize: "1.2rem",
            }}
          >
            لا توجد أغراض.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "1.8rem",
            }}
          >
            {filteredItems.map((item, idx) => (
              <ItemCard
                key={idx}
                item={item}
                style={{
                  borderRadius: "1rem",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  transition: "transform 0.2s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
