const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");

// GET foods
// Example: /api/foods
router.get("/", async (req, res) => {
  try {
    const foods = await prisma.food.findMany({
      take: 100,
    });

    res.json(foods);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch foods",
    });
  }
});

// SEARCH foods
// Example: /api/foods/search?name=rice
router.get("/search", async (req, res) => {
  try {
    const name = req.query.name;

    if (!name) {
      return res.status(400).json({
        error: "Please provide a food name",
      });
    }

    const foods = await prisma.food.findMany({
      where: {
        food_name: {
          contains: name,
        },
      },
      take: 50,
    });

    res.json(foods);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to search foods",
    });
  }
});

// GET one food by ID
// Example: /api/foods/1
router.get("/:id", async (req, res) => {
  try {
    const foodId = Number(req.params.id);

    const food = await prisma.food.findUnique({
      where: {
        food_id: foodId,
      },
    });

    if (!food) {
      return res.status(404).json({
        error: "Food not found",
      });
    }

    res.json(food);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch food",
    });
  }
});

module.exports = router;