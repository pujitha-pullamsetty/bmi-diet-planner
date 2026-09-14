/*
  Warnings:

  - You are about to alter the column `recommended_calories` on the `nutrition_rules` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - You are about to alter the column `fat_limit_g` on the `nutrition_rules` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `nutrition_rules` MODIFY `recommended_calories` VARCHAR(191) NOT NULL,
    MODIFY `fat_limit_g` VARCHAR(191) NOT NULL;
