-- ============================================================================
-- Search creates a persistent request
--
-- Before: a search was a 30-minute context (service_search_contexts) and a
-- service_request was created only when the consumer sent the first provider.
-- Nothing about the matched providers was stored, so a request could not be
-- reopened after the context expired.
--
-- After: a search that finds at least one provider immediately creates a
-- service_request in the new `awaiting_send` status and stores every matched
-- provider in service_request_candidates. The first send moves the request to
-- `pending_provider`. The ephemeral search-context table is no longer used.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. New request status: awaiting_send (found providers, nothing sent yet).
ALTER TABLE `service_requests`
  MODIFY COLUMN `status` ENUM('awaiting_send', 'pending_provider', 'in_progress', 'completed', 'cancelled')
    NOT NULL DEFAULT 'awaiting_send';

ALTER TABLE `service_request_status_histories`
  MODIFY COLUMN `from_status` ENUM('awaiting_send', 'pending_provider', 'in_progress', 'completed', 'cancelled') NULL,
  MODIFY COLUMN `to_status` ENUM('awaiting_send', 'pending_provider', 'in_progress', 'completed', 'cancelled') NOT NULL;

-- Lookup of open requests for the same land + service (duplicate warning).
CREATE INDEX `idx_service_requests_consumer_open`
  ON `service_requests` (`consumer_user_id`, `land_id`, `service_id`, `status`);

-- 2. Providers found for a request.
CREATE TABLE IF NOT EXISTS `service_request_candidates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `service_request_id` BIGINT UNSIGNED NOT NULL,
  `provider_profile_id` BIGINT UNSIGNED NOT NULL,
  `provider_service_id` BIGINT UNSIGNED NOT NULL,
  `provider_name_snapshot` VARCHAR(120) NOT NULL,
  `service_price_snapshot_toman` BIGINT UNSIGNED NOT NULL,
  `pricing_unit_snapshot` ENUM('fixed', 'per_hectare', 'per_square_meter', 'per_hour', 'per_day') NOT NULL,
  `distance_km` DECIMAL(8,2) NOT NULL,
  `found_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_request_candidate` (`service_request_id`, `provider_profile_id`),
  KEY `idx_service_request_candidates_provider` (`provider_profile_id`),
  KEY `idx_service_request_candidates_provider_service` (`provider_service_id`),
  CONSTRAINT `service_request_candidates_ibfk_1`
    FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `service_request_candidates_ibfk_2`
    FOREIGN KEY (`provider_profile_id`) REFERENCES `provider_profiles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `service_request_candidates_ibfk_3`
    FOREIGN KEY (`provider_service_id`) REFERENCES `provider_services` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_request_candidate_distance` CHECK (`distance_km` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Backfill candidates for existing open requests from the providers they
--    were already sent to, so reopened old requests keep their list.
INSERT IGNORE INTO `service_request_candidates` (
  `service_request_id`,
  `provider_profile_id`,
  `provider_service_id`,
  `provider_name_snapshot`,
  `service_price_snapshot_toman`,
  `pricing_unit_snapshot`,
  `distance_km`,
  `found_at`
)
SELECT
  srp.service_request_id,
  srp.provider_profile_id,
  srp.provider_service_id,
  srp.provider_name_snapshot,
  srp.service_price_snapshot_toman,
  ps.pricing_unit,
  srp.distance_km,
  srp.sent_at
FROM `service_request_providers` srp
INNER JOIN `provider_services` ps ON ps.id = srp.provider_service_id;

-- 4. The 30-minute search context store is replaced by the request itself.
DROP TABLE IF EXISTS `service_search_contexts`;
