import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BMICalculator from "./pages/BMICalculator";
import RuleDiet from "./pages/RuleDiet";
import SmartBuddy from "./pages/SmartBuddy";
import Results from "./pages/Results";

export default function App() {
  return (
    <>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bmi" element={<BMICalculator />} />
        <Route path="/rule-diet" element={<RuleDiet />} />
        <Route path="/smartbuddy" element={<SmartBuddy />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </>
  );
}
