const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");

// Get food recommendations
router.get("/", async (req, res) => {
  try {
    const {
      bmi,
      dietType,
      allergy,
      mealType,
    } = req.query;

    // Validate BMI
    const bmiValue = Number(bmi);

    if (!bmi || isNaN(bmiValue) || bmiValue <= 0) {
      return res.status(400).json({
        error: "Please provide a valid BMI",
      });
    }

    // Find BMI category
    const bmiCategory = await prisma.bmiClassification.findFirst({
      where: {
        bmi_min: {
          lte: bmiValue,
        },
        bmi_max: {
          gte: bmiValue,
        },
      },
    });

    if (!bmiCategory) {
      return res.status(404).json({
        error: "BMI category not found",
      });
    }

    // Find nutrition rule
    const nutritionRule = await prisma.nutritionRule.findUnique({
      where: {
        bmi_category: bmiCategory.bmi_category,
      },
    });

    // Build food filters
    const filters = {};

    if (dietType) {
  filters.diet_type = {
    equals: dietType,
  };
}

if (mealType) {
  filters.meal_type = {
    equals: mealType,
  };
}
    // Get foods
    let foods = await prisma.food.findMany({
      where: filters,
      take: 100,
    });

    // Remove foods containing the allergy
    if (allergy) {
      const allergyWords = allergy
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      foods = foods.filter((food) => {
        const text = `
          ${food.food_name}
          ${food.ingredients}
        `.toLowerCase();

        return !allergyWords.some((allergen) =>
          text.includes(allergen)
        );
      });
    }

    // Basic nutrition filtering
    // Select foods for the recommendation list.
// fiber_min_g is a daily target, so it should not be
// applied as a minimum requirement to every individual food.
foods = foods.slice(0, 20);

    res.json({
      bmi: bmiValue,
      bmi_category: bmiCategory.bmi_category,
      nutrition_rule: nutritionRule,
      recommendations: foods,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate recommendations",
    });
  }
});

module.exports = router;