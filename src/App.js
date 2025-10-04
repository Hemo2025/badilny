import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Capacitor } from "@capacitor/core";

import Home from "./pages/Home";
import Market from "./pages/Market";
import AddItem from "./pages/AddItem";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import TradeRequests from "./pages/TradeRequests";
import ChatsList from "./pages/ChatsList";
import Chat from "./pages/Chat";
import ResetPassword from "./pages/ResetPassword";
import DetailItem from "./pages/DetailItem";

import UpdateScreen from "./components/UpdateScreen";

export default function App() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  const isMobileApp =
    Capacitor.getPlatform() === "android" || Capacitor.getPlatform() === "ios";

  useEffect(() => {
    // تحقق من الملف version.json في مجلد public
    const checkVersion = async () => {
      if (!isMobileApp) return; // فقط للجوال

      try {
        const response = await fetch("/version.json"); // public/version.json
        const data = await response.json();
        const latestVersion = data.latestVersion;
        setUpdateUrl(data.updateUrl);

        // الإصدار الحالي للتطبيق
        const currentVersion = Capacitor.getAppInfo
          ? (await Capacitor.getAppInfo()).version
          : "1.0.0";

        // للمحاكاة: تظهر الشاشة إذا currentVersion < latestVersion
        if (currentVersion < latestVersion) {
          setShowUpdate(true);
        }
      } catch (err) {
        console.log("خطأ في التحقق من الإصدار:", err);
      }
    };

    checkVersion();
  }, [isMobileApp]);

  if (showUpdate && isMobileApp) {
    return (
      <UpdateScreen
        updateUrl={updateUrl}
        onClose={() => setShowUpdate(false)}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/item/:itemId" element={<DetailItem />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/traderequests" element={<TradeRequests />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/chatslist" element={<ChatsList />} />
          <Route path="/chat/:chatId" element={<Chat />} />
        </Routes>
      </Router>
    </AnimatePresence>
  );
}
