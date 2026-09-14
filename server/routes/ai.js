const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const { askGemma } = require("../services/ollama");

// =====================================================
// POST /api/ai/chat
// Used by SmartBuddy for AI explanations
// =====================================================

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    console.log("🤖 SmartBuddy AI request received");

    const answer = await askGemma(message);

    if (!answer) {
      return res.status(500).json({
        error: "Ollama returned an empty response",
      });
    }

    res.json({
      answer: answer,
    });
  } catch (error) {
    console.error("❌ SmartBuddy AI error:", error);

    res.status(500).json({
      error: "Failed to generate AI response",
      details: error.message,
    });
  }
});


// =====================================================
// POST /api/ai/recommend
// Existing nutrition recommendation API
// =====================================================

router.post("/recommend", async (req, res) => {
  try {
    const {
      bmi,
      dietType,
      allergy,
      mealType,
    } = req.body;

    // -----------------------------
    // 1. Validate BMI
    // -----------------------------

    const bmiValue = Number(bmi);

    if (!bmi || isNaN(bmiValue) || bmiValue <= 0) {
      return res.status(400).json({
        error: "Please provide a valid BMI",
      });
    }


    // -----------------------------
    // 2. Find BMI category
    // -----------------------------

    const bmiCategory =
      await prisma.bmiClassification.findFirst({
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


    // -----------------------------
    // 3. Find nutrition rule
    // -----------------------------

    const nutritionRule =
      await prisma.nutritionRule.findUnique({
        where: {
          bmi_category: bmiCategory.bmi_category,
        },
      });


    // -----------------------------
    // 4. Find suitable foods
    // -----------------------------

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

    let foods = await prisma.food.findMany({
      where: filters,
      take: 50,
    });


    // -----------------------------
    // 5. Remove allergy foods
    // -----------------------------

    if (allergy) {
      const allergyWords = allergy
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      foods = foods.filter((food) => {
        const foodText = `
          ${food.food_name || ""}
          ${food.ingredients || ""}
        `.toLowerCase();

        return !allergyWords.some((allergen) =>
          foodText.includes(allergen)
        );
      });
    }


    // -----------------------------
    // 6. Limit foods sent to Gemma
    // -----------------------------

    foods = foods.slice(0, 15);


    // -----------------------------
    // 7. Build AI prompt
    // -----------------------------

    const foodInformation = foods
      .map(
        (food) => `
Food: ${food.food_name}
Calories: ${food.calories_kcal} kcal
Carbohydrates: ${food.carbohydrates_g} g
Protein: ${food.protein_g} g
Fat: ${food.fat_g} g
Fiber: ${food.fiber_g} g
Ingredients: ${food.ingredients || ""}
`
      )
      .join("\n");

    const prompt = `
You are a nutrition recommendation assistant.

IMPORTANT RULES:

1. Recommend ONLY foods from the DATABASE FOODS below.
2. Never invent a food that is not in the database.
3. Never invent calories, protein, carbohydrates, fat, fiber, vitamins, or minerals.
4. When giving nutrition numbers, use ONLY the values supplied in the database.
5. The fiber_min_g value is a DAILY nutrition target.
6. Respect the user's diet type.
7. Respect the user's allergy.
8. Respect the requested meal type.
9. Use the BMI category and nutrition rule as guidance.
10. If the database does not contain enough information, say so instead of guessing.

USER:

BMI: ${bmiValue}
BMI Category: ${bmiCategory.bmi_category}
Diet Type: ${dietType || "Not specified"}
Allergy: ${allergy || "None"}
Meal Type: ${mealType || "Not specified"}

NUTRITION RULE:

${JSON.stringify(nutritionRule, null, 2)}

DATABASE FOODS:

${foodInformation}

TASK:

Choose the most appropriate food or foods from the DATABASE FOODS.

Return:

1. Recommended food name.
2. Why it is appropriate.
3. Actual nutrition values from the database.
4. How it fits the user's diet and allergy requirements.
5. A short practical serving suggestion.

Do not make up nutrition information.
Do not recommend foods outside the database.
`;

    // -----------------------------
    // 8. Ask Gemma
    // -----------------------------

    const answer = await askGemma(prompt);


    // -----------------------------
    // 9. Return result
    // -----------------------------

    res.json({
      bmi: bmiValue,
      bmi_category: bmiCategory.bmi_category,
      nutrition_rule: nutritionRule,
      foods_used: foods,
      recommendation: answer,
    });

  } catch (error) {
    console.error("AI recommendation error:", error);

    res.status(500).json({
      error: "Failed to generate nutrition recommendation",
      details: error.message,
    });
  }
});


module.exports = router;