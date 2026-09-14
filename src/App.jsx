import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import BMICalculator from "./pages/BMICalculator";
import RuleDiet from "./pages/RuleDiet";
import SmartBuddy from "./pages/SmartBuddy";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bmi" element={<BMICalculator />} />
        <Route path="/rule-diet" element={<RuleDiet />} />
        <Route path="/smartbuddy" element={<SmartBuddy />} />
        <Route path="/results" element={<Results />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}