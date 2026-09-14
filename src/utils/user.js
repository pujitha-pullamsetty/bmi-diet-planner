const USER_KEYS = ["bmi_user", "nutrition_user_id"];

export function getUserId() {
  try {
    for (const key of USER_KEYS) {
      const value = localStorage.getItem(key);

      if (!value) continue;

      if (key === "bmi_user") {
        const user = JSON.parse(value || "null");
        if (user && user.id) return Number(user.id);
      } else {
        const numericId = Number(value);
        if (Number.isFinite(numericId) && numericId > 0) return numericId;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to get user ID:", error);
    return null;
  }
}