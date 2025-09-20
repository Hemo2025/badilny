import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import PageWrapper from "../components/PageWrapper";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function Market() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all"); // all, featured, category
  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const allCategories = [
    { value: "clothes", label: "ملابس" },
    { value: "electronics", label: "إلكترونيات" },
    { value: "furniture", label: "أثاث" },
    { value: "books", label: "كتب" },
    { value: "other", label: "أخرى" },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let q = query(
          collection(db, "items"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
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
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const toggleCategory = (value) => {
    if (categories.includes(value)) {
      setCategories(categories.filter((c) => c !== value));
    } else {
      setCategories([...categories, value]);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    if (tab === "all") return matchesSearch;
    if (tab === "featured") return matchesSearch && item.featured;
    if (tab === "category") {
      if (categories.length === 0) return matchesSearch;
      return matchesSearch && categories.includes(item.category);
    }
    return matchesSearch;
  });

  return (
    <PageWrapper>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "1rem" }}>
        {/* مربع البحث */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {[
            { key: "all", label: "الكل" },
            { key: "featured", label: "مميز" },
            { key: "category", label: "تصنيفات" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "category") setDropdownOpen(!dropdownOpen);
                else setDropdownOpen(false);
              }}
              style={{
                ...tabButtonStyle,
                background: tab === t.key ? "#facc15" : "#f3f4f6",
                color: tab === t.key ? "#1f2937" : "#6b7280",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dropdown التصنيفات */}
        {tab === "category" && dropdownOpen && (
          <div style={dropdownContainer}>
            {allCategories.map((cat) => (
              <div
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                style={{
                  ...dropdownItem,
                  background: categories.includes(cat.value)
                    ? "#facc15"
                    : "#1f2937",
                  color: categories.includes(cat.value) ? "#1f2937" : "#f9fafb",
                  border: categories.includes(cat.value)
                    ? "2px solid #fbbf24"
                    : "2px solid #374151",
                }}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat.value)}
                  onChange={() => toggleCategory(cat.value)}
                  style={{ display: "none" }}
                />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* عرض المنتجات */}
        {loading ? (
          <p
            style={{ textAlign: "center", marginTop: "3rem", color: "#fbbf24" }}
          >
            جاري التحميل...
          </p>
        ) : filteredItems.length === 0 ? (
          <p
            style={{ textAlign: "center", marginTop: "3rem", color: "#fbbf24" }}
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
                imgProps={{ loading: "lazy" }}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.6rem 1rem",
  borderRadius: "0.5rem",
  border: "1px solid #facc15",
  outline: "none",
};

const tabButtonStyle = {
  padding: "0.6rem 1.2rem",
  borderRadius: "999px",
  border: "none",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
};

const dropdownContainer = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "0.5rem",
  marginBottom: "2rem",
  padding: "0.5rem",
  background: "#111827",
  borderRadius: "0.5rem",
};

const dropdownItem = {
  padding: "0.5rem 1rem",
  borderRadius: "999px",
  cursor: "pointer",
  userSelect: "none",
  transition: "all 0.2s",
};
