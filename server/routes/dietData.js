const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function normalizeMealType(value) {
  const meal = String(value || "").trim().toLowerCase();

  if (meal === "breakfast") return "Breakfast";
  if (meal === "lunch") return "Lunch";
  if (meal === "snack" || meal === "snacks") return "Snack";
  if (meal === "dinner") return "Dinner";

  return String(value || "").trim();
}

router.get("/", async (req, res) => {
  try {
    const [foods, rules] = await Promise.all([
      prisma.food.findMany({
        orderBy: {
          food_id: "asc",
        },
      }),
      prisma.nutritionRule.findMany(),
    ]);

    const normalizedFoods = foods.map((food) => ({
      ...food,
      meal_type: normalizeMealType(food.meal_type),
    }));

    console.log("🔥 MYSQL DIET DATA REQUESTED");
    console.log(`Foods loaded: ${normalizedFoods.length}`);
    console.log(`Rules loaded: ${rules.length}`);

    console.log(
      "Meal counts:",
      normalizedFoods.reduce((counts, food) => {
        counts[food.meal_type] =
          (counts[food.meal_type] || 0) + 1;
        return counts;
      }, {})
    );

    res.json({
      success: true,
      foods: normalizedFoods,
      rules,
    });
  } catch (error) {
    console.error("❌ Diet data error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load diet data",
      error: error.message,
    });
  }
});

module.exports = router;