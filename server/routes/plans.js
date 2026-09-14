const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");

// =====================================================
// POST /api/plans
// Save a selected diet plan
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      breakfast,
      lunch,
      snack,
      dinner,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required",
      });
    }

    const plan = await prisma.savedPlan.create({
      data: {
        user_id: Number(user_id),
        breakfast: breakfast || null,
        lunch: lunch || null,
        snack: snack || null,
        dinner: dinner || null,
      },
    });

    res.status(201).json({
      message: "Diet plan saved successfully",
      plan,
    });
  } catch (error) {
    console.error("Save plan error:", error);

    res.status(500).json({
      error: "Failed to save diet plan",
      details: error.message,
    });
  }
});


// =====================================================
// GET /api/plans/:userId
// Get all saved plans for a user
// =====================================================

router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const plans = await prisma.savedPlan.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({
      user_id: userId,
      plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);

    res.status(500).json({
      error: "Failed to load saved plans",
      details: error.message,
    });
  }
});

module.exports = router;