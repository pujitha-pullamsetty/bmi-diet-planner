const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const results = [];

fs.createReadStream("../datasets/nutrition_rules_final.csv")
  .pipe(csv())
  .on("data", (data) => {
    results.push({
      bmi_category: data.bmi_category.trim(),
      recommended_calories: data.recommended_calories.trim(),
      fat_limit_g: data.fat_limit_g.trim(),
      fiber_min_g: Number(data.fiber_min_g),
      protein_focus: data.protein_focus.trim(),
    });
  })
  .on("end", async () => {
    try {
      await prisma.nutritionRule.createMany({
        data: results,
        skipDuplicates: true,
      });

      console.log(
        `✅ Imported ${results.length} nutrition rules.`
      );
    } catch (error) {
      console.error("❌ Import failed:", error);
    } finally {
      await prisma.$disconnect();
    }
  });