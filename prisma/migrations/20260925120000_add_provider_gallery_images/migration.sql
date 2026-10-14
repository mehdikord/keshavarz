-- CreateTable: provider gallery images for public provider profiles
CREATE TABLE `provider_gallery_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_id` CHAR(26) NOT NULL,
  `provider_profile_id` BIGINT UNSIGNED NOT NULL,
  `url` VARCHAR(512) NOT NULL,
  `caption` VARCHAR(200) NULL,
  `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_provider_gallery_images_public_id` (`public_id`),
  INDEX `idx_provider_gallery_listing` (`provider_profile_id`, `sort_order`, `id`),
  CONSTRAINT `provider_gallery_images_ibfk_1`
    FOREIGN KEY (`provider_profile_id`) REFERENCES `provider_profiles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
