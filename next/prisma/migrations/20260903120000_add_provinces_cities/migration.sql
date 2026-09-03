-- ============================================================================
-- Add provinces, cities and link users to province/city
-- Target DBMS: MySQL 8.0.16+
--
-- provinces: Iranian provinces (reference data)
-- cities:    Iranian cities, each linked to a province via province_id FK
-- users:     new nullable province_id / city_id foreign keys
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- provinces
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provinces (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(225) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    KEY idx_provinces_name (name),
    KEY idx_provinces_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- cities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    province_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(225) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    KEY idx_cities_province_name (province_id, name),
    KEY idx_cities_deleted (deleted_at),
    CONSTRAINT cities_province_id_foreign FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- users: province_id / city_id
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN province_id BIGINT UNSIGNED NULL AFTER timezone,
    ADD COLUMN city_id BIGINT UNSIGNED NULL AFTER province_id,
    ADD KEY idx_users_province (province_id),
    ADD KEY idx_users_city (city_id),
    ADD CONSTRAINT users_province_id_foreign FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT users_city_id_foreign FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
