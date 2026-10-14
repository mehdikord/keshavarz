-- CreateTable
CREATE TABLE `job_runs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_name` VARCHAR(80) NOT NULL,
    `run_id` VARCHAR(64) NOT NULL,
    `lease_owner` VARCHAR(80) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lease_expires_at` DATETIME(3) NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `duration_ms` BIGINT UNSIGNED NULL,
    `error_message` VARCHAR(2000) NULL,

    INDEX `idx_job_runs_lease`(`status`, `lease_expires_at`),
    INDEX `idx_job_runs_started`(`started_at`),
    UNIQUE INDEX `uq_job_runs_name`(`job_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
