import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

export default function DetailItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [sendingTrade, setSendingTrade] = useState(false);

  const [items, setItems] = useState([]); // جميع العناصر لتقليبها
  const [currentIndex, setCurrentIndex] = useState(0);
  const [item, setItem] = useState(null);
  const [prevItem, setPrevItem] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("none");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [showTradeList, setShowTradeList] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showToastSuccess, setShowToastSuccess] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);

  // ===== جلب جميع العناصر =====
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snapshot = await getDocs(collection(db, "items"));
        const allItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(allItems);

        // تحديد العنصر الحالي حسب itemId
        const index = allItems.findIndex((i) => i.id === itemId);
        if (index !== -1) {
          setCurrentIndex(index);
          setItem(allItems[index]);
        } else {
          setItem(allItems[0] || null);
        }
      } catch (err) {
        console.error(err);
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [itemId, navigate]);

  // ===== Auth والعناصر الخاصة بالمستخدم =====
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const q = query(collection(db, "items"), where("userId", "==", u.uid));
        const snapshot = await getDocs(q);
        setMyItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  // ===== تحديد موقع المستخدم =====
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // ===== حساب المسافة =====
  useEffect(() => {
    if (
      userLocation &&
      item?.location?.lat !== undefined &&
      item?.location?.lng !== undefined
    ) {
      const dist = getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        item.location.lat,
        item.location.lng
      ).toFixed(1);
      setDistanceKm(dist);
    }
  }, [userLocation, item]);

  // ===== Toast =====
  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setShowToastSuccess(true);
    setTimeout(() => setShowToastSuccess(false), 3000);
  };

  // ===== إرسال المقايضة =====
  const handleSendTrade = async () => {
    if (!selectedItem) return showToastMsg("اختر غرضك أولاً!");
    try {
      setSendingTrade(true);
      await addDoc(collection(db, "trades"), {
        requesterId: user.uid,
        requesterName: user.displayName || "مستخدم",
        ownerId: item.userId,
        ownerName: item.userName || "مستخدم",
        requestedItem: item,
        offeredItem: myItems.find((i) => i.id === selectedItem),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      showSuccessToast("تم إرسال الطلب ✅");
      setShowTradeList(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      showToastMsg("حدث خطأ أثناء إرسال الطلب!");
    } finally {
      setSendingTrade(false);
    }
  };

  // ===== التنقل بين الكروت =====
  const handleNext = () => {
    if (currentIndex < items.length - 1 && !animating) {
      setAnimating(true);
      setSlideDirection("left");
      setPrevItem(item);
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setItem(items[nextIndex]);
        setSlideDirection("none");
        setPrevItem(null);
        setAnimating(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !animating) {
      setAnimating(true);
      setSlideDirection("right");
      setPrevItem(item);
      setTimeout(() => {
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setItem(items[prevIndex]);
        setSlideDirection("none");
        setPrevItem(null);
        setAnimating(false);
      }, 300);
    }
  };

  if (loading) return <p style={styles.loading}>جاري التحميل...</p>;
  if (!item) return <p style={styles.loading}>لا يوجد عنصر</p>;

  return (
    <div style={styles.container}>
      {showToast && <div style={styles.toast}>{toastMessage}</div>}
      {showToastSuccess && (
        <div
          style={{ ...styles.toastSuccess, opacity: showToastSuccess ? 1 : 0 }}
        >
          {toastMessage}
        </div>
      )}

      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← العودة
      </button>

      <div style={styles.cardWrapper}>
        {prevItem && (
          <div
            style={{
              ...styles.card,
              position: "absolute",
              width: "100%",
              transform:
                slideDirection === "left"
                  ? "translateX(-100%)"
                  : "translateX(100%)",
              opacity: 0,
              transition: "all 0.3s ease",
            }}
          >
            <CardContent item={prevItem} user={user} myItems={myItems} />
          </div>
        )}

        {item && (
          <div
            style={{
              ...styles.card,
              transform:
                slideDirection === "left"
                  ? "translateX(100%)"
                  : slideDirection === "right"
                  ? "translateX(-100%)"
                  : "translateX(0)",
              opacity: slideDirection === "none" ? 1 : 0,
              transition: "all 0.3s ease",
            }}
          >
            <CardContent
              item={item}
              user={user}
              myItems={myItems}
              showTradeList={showTradeList}
              setShowTradeList={setShowTradeList}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              sendingTrade={sendingTrade}
              handleSendTrade={handleSendTrade}
              distanceKm={distanceKm}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
        }}
      >
        <button
          style={styles.navButton}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ← السابق
        </button>
        <button
          style={styles.navButton}
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
        >
          التالي →
        </button>
      </div>
    </div>
  );
}

// ===== محتوى الكارت كـ كومبوننت منفصل =====
function CardContent({
  item,
  user,
  myItems,
  showTradeList,
  setShowTradeList,
  selectedItem,
  setSelectedItem,
  sendingTrade,
  handleSendTrade,
  distanceKm,
}) {
  return (
    <>
      <div>
        <img src={item.image} alt={item.name} style={styles.image} />
        <h2 style={styles.title}>{item.name}</h2>
      </div>
      <div style={styles.details}>
        <p style={{ padding: 0, margin: 0 }}>الوصف:</p>
        <p style={styles.desc}>{item.desc}</p>
        {item.category && <p style={styles.info}>التصنيف: {item.category}</p>}
        {item.region && <p style={styles.info}>📍 {item.region}</p>}
        {item.addressDesc && (
          <p style={styles.info}>الحي: {item.addressDesc}</p>
        )}
        {distanceKm && <p style={styles.info}>المسافة منك: {distanceKm} كم</p>}
        {item.userName && <p style={styles.info}>بواسطة: {item.userName}</p>}

        {user && item.userId !== user.uid && (
          <>
            <button
              style={{
                ...styles.tradeButton,
                background: showTradeList ? "#00ABE4" : "snow",
                color: showTradeList ? "snow" : "#00ABE4",
                transition: "all 0.3s ease",
              }}
              onClick={() => setShowTradeList((prev) => !prev)}
            >
              أرغب بالمقايضة
            </button>

            <div
              style={{
                ...styles.tradeList,
                maxHeight: showTradeList ? "500px" : "0",
                opacity: showTradeList ? 1 : 0,
                overflow: "hidden",
                transition: "all 0.4s ease",
              }}
            >
              {myItems.map((myItem) => (
                <div
                  key={myItem.id}
                  onClick={() => setSelectedItem(myItem.id)}
                  style={{
                    ...styles.myItem,
                    border:
                      selectedItem === myItem.id
                        ? "2px solid #00ABE4"
                        : "2px solid transparent",
                  }}
                >
                  <img
                    src={myItem.image}
                    alt={myItem.name}
                    style={styles.myItemImg}
                  />
                  <p>{myItem.name}</p>
                </div>
              ))}
              <button
                onClick={handleSendTrade}
                style={styles.sendButton}
                disabled={sendingTrade}
              >
                {sendingTrade ? (
                  <div style={styles.spinnerContainer}>
                    <div style={styles.spinner}></div>
                    جاري الإرسال...
                  </div>
                ) : (
                  "إرسال الطلب"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ===== Helpers =====
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ===== Styles =====
const styles = {
  container: {
    padding: "1rem",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  loading: { textAlign: "center", marginTop: "3rem", color: "snow" },
  toast: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#00ABE4",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    zIndex: 1000,
    color: "snow",
    fontWeight: "bold",
  },
  toastSuccess: {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "0.7rem 1.2rem",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    opacity: 0,
    transition: "opacity 0.5s ease",
    fontWeight: "bold",
    zIndex: 9999,
  },
  backButton: {
    marginBottom: "1rem",
    background: "#00ABE4",
    color: "snow",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  navButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#00ABE4",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  cardWrapper: { position: "relative", minHeight: "300px" },
  card: {
    display: "flex",
    flexDirection: "row",
    gap: "1rem",
    background:
      "linear-gradient(4434deg, rgb(4 122 255 / 89%), rgb(255 222 0)) no-repeat fixed",
    borderRadius: "0.75rem",
    padding: "1rem",
    color: "snow",
    alignItems: "center",
    flexWrap: "wrap",
  },
  details: { display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem" },
  title: { fontSize: "1.5rem", margin: 0 },
  desc: {
    fontSize: "1rem",
    color: "#00ABE4",
    background: "snow",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    marginTop: "0.2rem",
  },
  info: { fontSize: "0.9rem" },
  tradeButton: {
    marginTop: "0.5rem",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    background: "snow",
    color: "#00ABE4",
    fontWeight: "bold",
    cursor: "pointer",
  },
  tradeList: {
    marginTop: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  myItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.3rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    background: "rgba(255,255,255,0.15)",
  },
  myItemImg: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "0.3rem",
  },
  sendButton: {
    padding: "0.5rem",
    borderRadius: "0.5rem",
    background: "green",
    color: "snow",
    fontWeight: "bold",
    cursor: "pointer",
  },
  image: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "0.5rem",
  },
  spinner: {
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    animation: "spin 1s linear infinite",
    marginRight: "0.5rem",
  },
  spinnerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
};
