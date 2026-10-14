-- AlterTable: Add search_public_id to service_requests
ALTER TABLE `service_requests`
  ADD COLUMN `search_public_id` CHAR(26) NULL DEFAULT NULL AFTER `assigned_provider_profile_id`;

CREATE INDEX `idx_service_requests_search_public_id` ON `service_requests` (`search_public_id`);
