const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const results = [];

fs.createReadStream("../datasets/user_preferences_final.csv")
  .pipe(csv())
  .on("data", (data) => {
    results.push({
      user_id: Number(data.user_id),
      diet_type: data.diet_type.trim(),
      allergy: data.allergy.trim(),
      preferred_meal: data.preferred_meal.trim(),
    });
  })
  .on("end", async () => {
    try {
      await prisma.userPreference.createMany({
        data: results,
        skipDuplicates: true,
      });

      console.log(
        `✅ Imported ${results.length} user preferences.`
      );
    } catch (error) {
      console.error("❌ Import failed:", error);
    } finally {
      await prisma.$disconnect();
    }
  });