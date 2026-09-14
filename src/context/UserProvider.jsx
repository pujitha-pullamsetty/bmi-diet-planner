import { useState } from "react";
import { UserContext } from "./userContextValue";

function getStoredUserId() {
  const storedUser = localStorage.getItem("bmi_user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.id) {
        return Number(parsed.id);
      }
    } catch {
      // fall through to legacy value check below
    }
  }

  const legacyStored = localStorage.getItem("nutrition_user_id");
  if (legacyStored) {
    const numericId = Number(legacyStored);
    if (Number.isFinite(numericId) && numericId > 0) {
      return numericId;
    }
  }

  const newId = Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("nutrition_user_id", String(newId));
  return newId;
}

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    userId: getStoredUserId(),
    height: "",
    heightCm: "",
    weight: "",
    weightKg: "",
    age: "",
    gender: "",
    bmi: "",
    category: "",
    dietType: "Veg",
    allergy: "None",
    preferredMeal: "Breakfast",
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
