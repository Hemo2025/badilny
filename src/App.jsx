import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Market from "./pages/Market";
import AddItem from "./pages/AddItem";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<Market />} />
        <Route path="/add" element={<AddItem />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
