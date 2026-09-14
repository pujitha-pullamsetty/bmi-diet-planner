-- CreateTable
CREATE TABLE `bmi_classification` (
    `bmi_category` VARCHAR(191) NOT NULL,
    `bmi_min` DOUBLE NOT NULL,
    `bmi_max` DOUBLE NOT NULL,

    PRIMARY KEY (`bmi_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
