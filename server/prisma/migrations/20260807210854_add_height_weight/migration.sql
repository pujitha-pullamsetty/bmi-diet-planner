/*
  Warnings:

  - You are about to drop the `user_preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user_preferences`;

-- CreateTable
CREATE TABLE `UserPreference` (
    `user_id` INTEGER NOT NULL,
    `diet_type` VARCHAR(191) NOT NULL,
    `allergy` VARCHAR(191) NOT NULL,
    `preferred_meal` VARCHAR(191) NOT NULL,
    `height_cm` DOUBLE NULL,
    `weight_kg` DOUBLE NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
