import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import PageWrapper from "../components/PageWrapper";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export default function Market() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  const containerRef = useRef(null);

  const allCategories = [
    { value: "clothes", label: "ملابس" },
    { value: "electronics", label: "إلكترونيات" },
    { value: "furniture", label: "أثاث" },
    { value: "books", label: "كتب" },
    { value: "other", label: "أخرى" },
  ];

  const allRegions = [
    "الرياض",
    "جدة",
    "مكة",
    "المدينة",
    "الدمام",
    "الخبر",
    "أبها",
    "تبوك",
    "حائل",
    "جازان",
  ];

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          distanceKm: calculateDistance(
            doc.data().latitude,
            doc.data().longitude
          ),
        }));
        list.sort((a, b) =>
          a.featured === b.featured ? 0 : a.featured ? -1 : 1
        );
        setItems(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (value) => {
    setCategories(
      categories.includes(value)
        ? categories.filter((c) => c !== value)
        : [...categories, value]
    );
  };

  const toggleRegion = (value) => {
    setRegions(
      regions.includes(value)
        ? regions.filter((r) => r !== value)
        : [...regions, value]
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      categories.length === 0 || categories.includes(item.category);
    const matchesRegion = regions.length === 0 || regions.includes(item.region);
    if (tab === "featured") return matchesSearch && item.featured;
    if (tab === "category")
      return matchesSearch && matchesCategory && matchesRegion;
    return matchesSearch;
  });

  return (
    <PageWrapper>
      <Navbar />
      <div ref={containerRef} style={styles.container}>
        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {[
            { key: "all", label: "الكل" },
            { key: "featured", label: "مميز" },
            { key: "category", label: "فلتر" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setTab(t.key) ||
                setFiltersOpen(t.key === "category" ? !filtersOpen : false)
              }
              style={{
                ...styles.tabButton,
                background: tab === t.key ? "#facc15" : "#f3f4f6",
                color: tab === t.key ? "#1f2937" : "#6b7280",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            ...styles.filtersContainer,
            maxHeight: filtersOpen ? "1000px" : "0",
            opacity: filtersOpen ? 1 : 0,
            transition: "all 0.4s ease",
            overflow: "hidden",
          }}
        >
          <div style={styles.filterSearch}>
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setFiltersOpen(false);
                  e.target.blur();
                }
              }}
            />
          </div>

          {/* Categories */}
          <div style={styles.filterColumn}>
            <div style={styles.filterTitle}>التصنيف</div>
            <div style={styles.filterOptions}>
              {allCategories.map((cat) => (
                <div
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  style={{
                    ...styles.filterOption,
                    background: categories.includes(cat.value)
                      ? "#facc15"
                      : "#1f2937",
                    color: categories.includes(cat.value)
                      ? "#1f2937"
                      : "#f9fafb",
                  }}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div style={styles.filterColumn}>
            <div style={styles.filterTitle}>المنطقة</div>
            <div style={styles.filterOptions}>
              {allRegions.map((r) => (
                <div
                  key={r}
                  onClick={() => toggleRegion(r)}
                  style={{
                    ...styles.filterOption,
                    background: regions.includes(r) ? "#facc15" : "#1f2937",
                    color: regions.includes(r) ? "#1f2937" : "#f9fafb",
                  }}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ width: "100%", marginTop: "1rem", textAlign: "center" }}
          >
            <button
              onClick={() => setFiltersOpen(false)}
              style={styles.searchButton}
            >
              بحث
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <p style={styles.loadingText}>جاري التحميل...</p>
        ) : filteredItems.length === 0 ? (
          <p style={styles.loadingText}>لا توجد أغراض.</p>
        ) : (
          <div style={styles.gridContainer}>
            {filteredItems.map((item, idx) => (
              <ItemCard
                key={idx}
                item={item}
                onImageClick={() => setPreviewImage(item.image)}
              />
            ))}
          </div>
        )}

        {/* Lightbox */}
        {previewImage && (
          <div onClick={() => setPreviewImage(null)} style={styles.lightbox}>
            <img
              src={previewImage}
              alt="Preview"
              style={styles.lightboxImage}
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// ===== Helpers =====
function calculateDistance(lat, lon) {
  if (!lat || !lon) return null;
  // هنا يمكن إضافة إحداثيات المستخدم الحقيقي
  const userLat = 24.7136; // مثال: الرياض
  const userLon = 46.6753;
  return getDistanceFromLatLonInKm(userLat, userLon, lat, lon).toFixed(1);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ===== Styles =====
const styles = {
  container: { maxWidth: "1200px", margin: "2rem auto", padding: "1rem" },
  tabsContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  tabButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "999px",
    border: "none",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  filtersContainer: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  filterColumn: { flex: "1 1 300px", minWidth: "150px" },
  filterTitle: { fontWeight: "bold", marginBottom: "0.5rem", color: "#fbbf24" },
  filterOptions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  filterOption: {
    padding: "0.5rem 1rem",
    borderRadius: "999px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "0.9rem",
  },
  filterSearch: { width: "100%", marginBottom: "1rem" },
  searchInput: {
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: "0.7rem",
    border: "1px solid #facc15",
    outline: "none",
    fontSize: "0.95rem",
    background: "#111827",
    color: "#f9fafb",
  },
  searchButton: {
    padding: "0.7rem 1.5rem",
    background: "#facc15",
    color: "#1f2937",
    fontWeight: "bold",
    border: "none",
    borderRadius: "0.7rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  gridContainer: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  },
  loadingText: {
    textAlign: "center",
    marginTop: "3rem",
    color: "#fbbf24",
    fontWeight: "bold",
  },
  lightbox: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    cursor: "pointer",
  },
  lightboxImage: {
    maxWidth: "90%",
    maxHeight: "90%",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    objectFit: "contain",
  },
  "@media (max-width: 768px)": {
    filtersContainer: { flexDirection: "column" },
    gridContainer: { gridTemplateColumns: "1fr" },
  },
  "@media (min-width: 769px) and (max-width: 1024px)": {
    gridContainer: { gridTemplateColumns: "repeat(2, 1fr)" },
  },
};
