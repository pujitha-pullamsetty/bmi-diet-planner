-- CreateTable
CREATE TABLE `nutrition_rules` (
    `bmi_category` VARCHAR(191) NOT NULL,
    `recommended_calories` DOUBLE NOT NULL,
    `fat_limit_g` DOUBLE NOT NULL,
    `fiber_min_g` DOUBLE NOT NULL,
    `protein_focus` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`bmi_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
