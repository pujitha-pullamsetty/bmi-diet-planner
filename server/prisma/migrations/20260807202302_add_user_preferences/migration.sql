-- CreateTable
CREATE TABLE `user_preferences` (
    `user_id` INTEGER NOT NULL,
    `diet_type` VARCHAR(191) NOT NULL,
    `allergy` VARCHAR(191) NOT NULL,
    `preferred_meal` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
