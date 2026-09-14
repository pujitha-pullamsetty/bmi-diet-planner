import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContextValue";
export default function BMICalculator() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  /* ---------- AGE ---------- */
  const [age, setAge] = useState("");

  /* ---------- WEIGHT ---------- */
  const [weightType, setWeightType] = useState("kg");
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");

  const getWeightInKg = () => {
    if (weightType === "kg") return parseFloat(weightKg) || 0;
    if (weightType === "lb") return (parseFloat(weightLb) || 0) * 0.453592;
    return 0;
  };

  /* ---------- HEIGHT ---------- */
  const [heightType, setHeightType] = useState("ft");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightM, setHeightM] = useState("");

  const getHeightInMeters = () => {
    if (heightType === "ft") {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      return ft * 0.3048 + inch * 0.0254;
    }
    if (heightType === "cm") return (parseFloat(heightCm) || 0) / 100;
    if (heightType === "m") return parseFloat(heightM) || 0;
    return 0;
  };

  /* ---------- GENDER ---------- */
  const [gender, setGender] = useState("");

  /* ---------- BMI RESULT ---------- */
  const [bmi, setBmi] = useState(null);

  const calculateBMI = () => {
    const weight = getWeightInKg();
    const height = getHeightInMeters();

    if (!age || !gender || weight <= 0 || height <= 0) {
      alert("Please enter all valid details");
      return;
    }

    const bmiValue = weight / (height * height);
    setBmi(bmiValue.toFixed(2));
  };

  const getBMICategory = () => {
    if (!bmi) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25.0) return "Normal weight";
    if (bmi < 29.9) return "Overweight";
    return "Obese";
  };

  /* ---------- POPUP + NAVIGATION ---------- */
 const goToDietGeneration = () => {
  if (!bmi) {
    alert("Please calculate your BMI first");
    return;
  }

  const weight = getWeightInKg();
  const heightMeters = getHeightInMeters();
  const heightCmValue = heightMeters * 100;

  const raw = getBMICategory();

  const normalized =
    raw === "Normal weight" ? "Normal" : raw;

  // Save the BMI/profile information into global context
  setUser((prev) => ({
    ...prev,

    height: heightCmValue,
    heightCm: heightCmValue,

    weight: weight,
    weightKg: weight,

    age: Number(age),
    gender,

    bmi: Number(bmi),
    category: normalized,
  }));

  navigate("/rule-diet", {
    state: {
      bmiCategory: normalized,
      bmiValue: Number(bmi),

      heightCm: heightCmValue,
      weightKg: weight,

      age: Number(age),
      gender,
    },
  });
};
  return (
    <div className="bmi-page">
      <div className="bmi-card">
        <h2>BMI Input Form</h2>

        {/* AGE */}
        <div className="field-age">
          <label>Age</label>
          <input
            type="number"
            className="input"
            placeholder="Enter age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

  {/* WEIGHT */}
<div className="field">
  <label>Weight</label>

  <div className="row">
    <input
      type="number"
      className="input1"
      placeholder="Enter weight"
      value={weightType === "kg" ? weightKg : weightLb}
      onChange={(e) =>
        weightType === "kg"
          ? setWeightKg(e.target.value)
          : setWeightLb(e.target.value)
      }
    />

    <select
      className="select unit"
      value={weightType}
      onChange={(e) => setWeightType(e.target.value)}
    >
      <option value="kg">Kg</option>
      <option value="lb">Pounds</option>
    </select>
  </div>
</div>

{/* HEIGHT */}
<div className="field">
  <label>Height</label>

  {/* INPUTS */}
  {heightType === "ft" && (
    <div className="row">
      <input
        type="number"
        className="input"
        placeholder="Feet"
        value={heightFt}
        onChange={(e) => setHeightFt(e.target.value)}
      />
      <input
        type="number"
        className="input"
        placeholder="Inches"
        value={heightIn}
        onChange={(e) => setHeightIn(e.target.value)}
      />
    </div>
  )}

  {heightType === "cm" && (
    <input
      type="number"
      className="input"
      placeholder="Height"
      value={heightCm}
      onChange={(e) => setHeightCm(e.target.value)}
    />
  )}

  {heightType === "m" && (
    <input
      type="number"
      className="input"
      placeholder="Height"
      value={heightM}
      onChange={(e) => setHeightM(e.target.value)}
    />
  )}

  {/* UNIT BELOW */}
  <select
    className="select"
    value={heightType}
    onChange={(e) => setHeightType(e.target.value)}
  >
    <option value="ft">Feet & Inches</option>
    <option value="cm">Centimeters</option>
    <option value="m">Meters</option>
  </select>
</div>


        {/* GENDER */}
        <div className="gender">
          <label>Gender</label>
          <div className="gender-options">
            <label>
              <input
                type="radio"
                value="male"
                checked={gender === "male"}
                onChange={(e) => setGender(e.target.value)}
              />
              Male
            </label>

            <label>
              <input
                type="radio"
                value="female"
                checked={gender === "female"}
                onChange={(e) => setGender(e.target.value)}
              />
              Female
            </label>
          </div>
        </div>

        {/* CALCULATE BUTTON */}
        <button className="bmi-btn" onClick={calculateBMI}>
          Calculate BMI
        </button>

        {/* RESULT + NEXT BUTTON */}
        {bmi && (
          <div className="result">
            <h3>Your BMI: {bmi}</h3>
            <p>Category: {getBMICategory()}</p>

            <button
              type="button"
              className="bmi-btn"
              onClick={goToDietGeneration}
            >
              Go to Diet Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
