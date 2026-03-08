import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import "./styles/global.css";

import Home from "./pages/Home";
import BMICalculator from "./pages/BMICalculator";
import RuleDiet from "./pages/RuleDiet";
import Results from "./pages/Results";
import SmartBuddy from "./pages/SmartBuddy";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bmi" element={<BMICalculator />} />
          <Route path="/rule-diet" element={<RuleDiet />} />
          <Route path="/results" element={<Results />} />
          <Route path="/smartbuddy" element={<SmartBuddy />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </React.StrictMode>
);
