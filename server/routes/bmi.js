const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");

// GET BMI category and nutrition rule
// Example: /api/bmi/24.5
router.get("/:bmi", async (req, res) => {
  try {
    const bmi = Number(req.params.bmi);

    if (isNaN(bmi) || bmi <= 0) {
      return res.status(400).json({
        error: "Please provide a valid BMI",
      });
    }

    // Find the BMI category
    const category = await prisma.bmiClassification.findFirst({
      where: {
        bmi_min: {
          lte: bmi,
        },
        bmi_max: {
          gte: bmi,
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: "BMI category not found",
      });
    }

    // Find nutrition rule for that category
    const nutritionRule = await prisma.nutritionRule.findUnique({
      where: {
        bmi_category: category.bmi_category,
      },
    });

    res.json({
      bmi: bmi,
      category: category.bmi_category,
      bmi_range: {
        min: category.bmi_min,
        max: category.bmi_max,
      },
      nutrition_rule: nutritionRule,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to calculate BMI information",
    });
  }
});

module.exports = router;