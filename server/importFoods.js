const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const results = [];

fs.createReadStream("./dataset/foods_dataset_final_plus.csv")
  .pipe(csv())
  .on("data", (data) => {
    results.push({
      food_id: Number(data.food_id),
      food_name: data.food_name,
      meal_type: data.meal_type,
      diet_type: data.diet_type,
      calories_kcal: Number(data.calories_kcal),
      carbohydrates_g: Number(data.carbohydrates_g),
      protein_g: Number(data.protein_g),
      fat_g: Number(data.fat_g),
      fiber_g: Number(data.fiber_g),
      calcium_mg: Number(data.calcium_mg),
      magnesium_mg: Number(data.magnesium_mg),
      iron_mg: Number(data.iron_mg),
      zinc_mg: Number(data.zinc_mg),
      vitamin_A: Number(data.vitamin_A),
      vitamin_B1: Number(data.vitamin_B1),
      vitamin_B2: Number(data.vitamin_B2),
      vitamin_B12: Number(data.vitamin_B12),
      vitamin_C: Number(data.vitamin_C),
      vitamin_D: Number(data.vitamin_D),
      vitamin_E: Number(data.vitamin_E),
      vitamin_K: Number(data.vitamin_K),
      vitamin_H: Number(data.vitamin_H),
      food_category: data.food_category,
      seasonal: data.seasonal,
      season: data.season,
      ingredients: data.ingredients,
      region: data.region,
      state: data.state,
      source: data.source,
    });
  })
  .on("end", async () => {
    try {
      await prisma.food.createMany({
        data: results,
        skipDuplicates: true,
      });

      console.log(`✅ Imported ${results.length} foods successfully.`);
    } catch (err) {
      console.error(err);
    } finally {
      await prisma.$disconnect();
    }
  });