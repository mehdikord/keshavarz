-- ============================================================================
-- Add service_search_contexts (persistent search context store)
--
-- Previously the service-search criteria were held in an in-memory Map inside
-- the Node process. In production (multiple instances / serverless) that store
-- is not shared between the POST that creates the search and the GET that
-- resolves providers, which caused "search not found" / "no results" errors.
--
-- This table persists the search criteria (with TTL) so any instance can
-- resolve a searchId. Rows expire and are lazily pruned on read/write.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS service_search_contexts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    land_id BIGINT UNSIGNED NOT NULL,
    land_public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    land_latitude DECIMAL(10,7) NOT NULL,
    land_longitude DECIMAL(10,7) NOT NULL,
    land_title VARCHAR(150) NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    service_slug VARCHAR(170) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    category_slug VARCHAR(170) NOT NULL,
    category_name VARCHAR(150) NOT NULL,
    dates JSON NOT NULL,
    consumer_note VARCHAR(1500) NULL,
    criteria_signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expires_at DATETIME(3) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_service_search_contexts_public_id (public_id),
    KEY idx_service_search_contexts_user (user_id),
    KEY idx_service_search_contexts_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;