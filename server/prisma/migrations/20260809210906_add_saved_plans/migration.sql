-- CreateTable
CREATE TABLE `saved_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `breakfast` VARCHAR(191) NULL,
    `lunch` VARCHAR(191) NULL,
    `snack` VARCHAR(191) NULL,
    `dinner` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_plans_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
