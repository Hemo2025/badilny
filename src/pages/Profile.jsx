import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import PageWrapper from "../components/PageWrapper";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loadingUser || !user) return;

    const fetchUserItems = async () => {
      try {
        const q = query(
          collection(db, "items"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list = list.sort((a, b) =>
          a.featured === b.featured ? 0 : a.featured ? -1 : 1
        );
        setItems(list);
      } catch (error) {
        console.error("خطأ أثناء جلب بيانات المستخدم:", error);
      }
    };

    fetchUserItems();
  }, [loadingUser, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/Auth");
    } catch (error) {
      console.error("خطأ أثناء تسجيل الخروج:", error);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الغرض؟")) return;
    try {
      await deleteDoc(doc(db, "items", itemId));
      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("خطأ أثناء حذف الغرض:", error);
    }
  };

  const handleEdit = async (item) => {
    const newName = prompt("أدخل الاسم الجديد:", item.name);
    if (!newName) return;
    const newDesc = prompt("أدخل الوصف الجديد:", item.desc);
    if (newDesc === null) return;

    try {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, { name: newName, desc: newDesc });
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, name: newName, desc: newDesc } : i
        )
      );
    } catch (error) {
      console.error("خطأ أثناء تعديل الغرض:", error);
    }
  };

  if (loadingUser) return <p>جاري التحميل...</p>;

  if (!user) return navigate("/Auth");

  return (
    <PageWrapper>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "1rem" }}>
        <h2 style={{ color: "snow" }}>
          أهلاً، {user.displayName || user.email}
        </h2>
        <button
          onClick={handleLogout}
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: "#00ABE4",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          تسجيل الخروج
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {items.map((item) => (
            <div key={item.id}>
              <ItemCard item={item} />
              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
              >
                <button
                  onClick={() => handleEdit(item)}
                  style={editButtonStyle}
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={deleteButtonStyle}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

const editButtonStyle = {
  padding: "0.3rem 0.6rem",
  background: "rgb(50 160 73)",
  color: "#fff",
  borderRadius: "0.4rem",
  border: "none",
  cursor: "pointer",
};
const deleteButtonStyle = {
  padding: "0.3rem 0.6rem",
  background: "#ef4444",
  color: "#fff",
  borderRadius: "0.4rem",
  border: "none",
  cursor: "pointer",
};
