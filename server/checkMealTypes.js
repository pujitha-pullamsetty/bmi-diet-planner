const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const mealTypes = await prisma.food.groupBy({
    by: ["meal_type"],
    _count: {
      food_id: true,
    },
  });

  console.log("Meal types:");
  console.log(mealTypes);

  const dietMealTypes = await prisma.food.groupBy({
    by: ["diet_type", "meal_type"],
    _count: {
      food_id: true,
    },
  });

  console.log("\nDiet + meal types:");
  console.log(dietMealTypes);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });