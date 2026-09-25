const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const results = [];

fs.createReadStream("./dataset/bmi_classification_final.csv")
  .pipe(csv())
  .on("data", (data) => {
    results.push({
      bmi_category: data.bmi_category.trim(),
      bmi_min: Number(data.bmi_min),
      bmi_max: Number(data.bmi_max),
    });
  })
  .on("end", async () => {
    try {
      await prisma.bmiClassification.createMany({
        data: results,
        skipDuplicates: true,
      });

      console.log(`Imported ${results.length} BMI classifications.`);
    } catch (error) {
      console.error("BMI import failed:", error);
    } finally {
      await prisma.$disconnect();
    }
  });