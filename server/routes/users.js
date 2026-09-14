const express = require("express");

const router = express.Router();

const prisma = require("../prismaClient");


// POST /api/users
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      height_cm,
      weight_kg,
      diet_type,
      allergy,
      preferred_meal,
    } = req.body;


    // -----------------------------
    // Validate height and weight
    // -----------------------------

    const height = Number(height_cm);
    const weight = Number(weight_kg);

    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required",
      });
    }

    if (!height || height <= 0) {
      return res.status(400).json({
        error: "Valid height_cm is required",
      });
    }

    if (!weight || weight <= 0) {
      return res.status(400).json({
        error: "Valid weight_kg is required",
      });
    }


    // -----------------------------
    // Calculate BMI
    // -----------------------------

    const heightMeters = height / 100;

    const bmi =
      weight / (heightMeters * heightMeters);

    const roundedBMI =
      Number(bmi.toFixed(2));


    // -----------------------------
    // Save user profile
    // -----------------------------

    const user = await prisma.userPreference.upsert({
      where: {
        user_id: Number(user_id),
      },

      update: {
        height_cm: height,
        weight_kg: weight,
        diet_type: diet_type || "Veg",
        allergy: allergy || "None",
        preferred_meal: preferred_meal || "Breakfast",
      },

      create: {
        user_id: Number(user_id),
        height_cm: height,
        weight_kg: weight,
        diet_type: diet_type || "Veg",
        allergy: allergy || "None",
        preferred_meal: preferred_meal || "Breakfast",
      },
    });


    // -----------------------------
    // Return result
    // -----------------------------

    res.json({
      message: "User profile saved successfully",

      user: user,

      bmi: roundedBMI,
    });

  } catch (error) {

    console.error("User profile error:", error);

    res.status(500).json({
      error: "Failed to save user profile",
    });
  }
});
// GET /api/users/:id/recommend
router.get("/:id/recommend", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    // 1. Get user profile from MySQL
    const user = await prisma.userPreference.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // 2. Check height and weight
    if (!user.height_cm || !user.weight_kg) {
      return res.status(400).json({
        error: "User height and weight are required",
      });
    }

    // 3. Calculate BMI
    const heightMeters = user.height_cm / 100;

    const bmi =
      user.weight_kg /
      (heightMeters * heightMeters);

    const roundedBMI = Number(bmi.toFixed(2));

    // 4. Find BMI category
    const bmiCategory =
      await prisma.bmiClassification.findFirst({
        where: {
          bmi_min: {
            lte: roundedBMI,
          },
          bmi_max: {
            gte: roundedBMI,
          },
        },
      });

    if (!bmiCategory) {
      return res.status(404).json({
        error: "BMI category not found",
      });
    }

    // 5. Forward the information to your AI endpoint
    const axios = require("axios");

    const aiResponse = await axios.post(
      "http://localhost:5000/api/ai/recommend",
      {
        bmi: roundedBMI,
        dietType: user.diet_type,
        allergy: user.allergy,
        mealType: user.preferred_meal,
      }
    );

    // 6. Return everything
    res.json({
      user_id: user.user_id,

      profile: {
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        diet_type: user.diet_type,
        allergy: user.allergy,
        preferred_meal: user.preferred_meal,
      },

      bmi: roundedBMI,

      bmi_category:
        bmiCategory.bmi_category,

      recommendation:
        aiResponse.data.recommendation,

      foods_used:
        aiResponse.data.foods_used,
    });

  } catch (error) {
    console.error(
      "User recommendation error:",
      error
    );

    res.status(500).json({
      error: "Failed to generate user recommendation",
    });
  }
});

module.exports = router;