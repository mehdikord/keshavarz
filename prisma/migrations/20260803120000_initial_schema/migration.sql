-- ============================================================================
-- Keshavarz Platform - Production Database Schema
-- Target DBMS: MySQL 8.0.16+
-- Charset: utf8mb4
-- Storage Engine: InnoDB
--
-- Design conventions
--   1. Every primary key and relational foreign key is BIGINT UNSIGNED.
--   2. Internal IDs are auto-increment integers (Laravel migration style).
--   3. Public-facing records additionally use ULID-compatible CHAR(26) IDs.
--   4. All monetary values are stored as whole Tomans in BIGINT UNSIGNED fields.
--   5. All timestamps are stored in UTC with millisecond precision.
--   6. Users can simultaneously act as Consumer and Provider; there is no
--      mutually-exclusive role column on users. A provider_profiles row enables
--      Provider capabilities, while lands/service_requests enable Consumer use.
--   7. Transactional records are retained. Catalog/profile records use active
--      flags and/or soft deletion where appropriate.
--   8. Password and OTP fields always contain one-way hashes, never plaintext.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Optional database creation (uncomment when provisioning a new database):
-- CREATE DATABASE IF NOT EXISTS keshavarz
--   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE keshavarz;

-- ============================================================================
-- 1. APPLICATION USERS, OTP, AND SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'ULID exposed to clients',
    name VARCHAR(120) NOT NULL DEFAULT 'کاربر کشاورز',
    phone VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Normalized Iranian mobile number: 09XXXXXXXXX',
    image VARCHAR(512) NULL,
    locale VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'fa-IR',
    timezone VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'Asia/Tehran',
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    phone_verified_at DATETIME(3) NULL,
    last_login_at DATETIME(3) NULL,
    last_login_ip VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    remember_token VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_public_id (public_id),
    UNIQUE KEY uq_users_phone (phone),
    KEY idx_users_active_deleted (is_active, deleted_at),
    KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_otp_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    phone VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    purpose ENUM('login', 'phone_verification', 'phone_change') NOT NULL DEFAULT 'login',
    code_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    attempts_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 5,
    requested_ip VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    expires_at DATETIME(3) NOT NULL,
    consumed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_user_otp_lookup (phone, purpose, expires_at, consumed_at),
    KEY idx_user_otp_user (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_user_otp_attempts CHECK (attempts_count <= max_attempts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    device_id VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    device_name VARCHAR(120) NULL,
    platform ENUM('web', 'pwa', 'android', 'ios', 'unknown') NOT NULL DEFAULT 'pwa',
    push_token VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ip_address VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    user_agent VARCHAR(1000) NULL,
    last_activity_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expires_at DATETIME(3) NOT NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_sessions_token (token_hash),
    KEY idx_user_sessions_user_active (user_id, revoked_at, expires_at),
    KEY idx_user_sessions_last_activity (last_activity_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. INTERNAL ADMINISTRATORS AND RBAC
-- ============================================================================

CREATE TABLE IF NOT EXISTS admins (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'ULID exposed to admin clients',
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    email VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    image VARCHAR(512) NULL,
    password VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Argon2id/Bcrypt password hash',
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    is_super_admin TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Emergency full-access bypass; use sparingly',
    phone_verified_at DATETIME(3) NULL,
    password_changed_at DATETIME(3) NULL,
    last_login_at DATETIME(3) NULL,
    last_login_ip VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    failed_login_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME(3) NULL,
    remember_token VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    created_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_public_id (public_id),
    UNIQUE KEY uq_admins_phone (phone),
    UNIQUE KEY uq_admins_email (email),
    KEY idx_admins_active_deleted (is_active, deleted_at),
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    description VARCHAR(500) NULL,
    is_system TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'System roles cannot be deleted from the panel',
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_roles_code (code),
    KEY idx_admin_roles_active (is_active, deleted_at),
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_permissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    module VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'users, providers, requests, subscriptions, ...',
    action VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'view, create, update, delete, export, ...',
    code VARCHAR(170) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Example: requests.cancel',
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_permissions_code (code),
    UNIQUE KEY uq_admin_permissions_module_action (module, action),
    KEY idx_admin_permissions_active_module (is_active, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_by_admin_id BIGINT UNSIGNED NULL,
    expires_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_role_assignment (admin_id, role_id),
    KEY idx_admin_role_assignments_role (role_id, expires_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    granted_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_role_permission (role_id, permission_id),
    KEY idx_admin_role_permissions_permission (permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (granted_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_permission_overrides (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    effect ENUM('allow', 'deny') NOT NULL,
    reason VARCHAR(500) NULL,
    granted_by_admin_id BIGINT UNSIGNED NULL,
    expires_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_permission_override (admin_id, permission_id),
    KEY idx_admin_permission_overrides_effect (effect, expires_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (granted_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    ip_address VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    user_agent VARCHAR(1000) NULL,
    last_activity_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expires_at DATETIME(3) NOT NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_sessions_token (token_hash),
    KEY idx_admin_sessions_admin_active (admin_id, revoked_at, expires_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    requested_ip VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    expires_at DATETIME(3) NOT NULL,
    used_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_password_reset_token (token_hash),
    KEY idx_admin_password_resets_admin (admin_id, expires_at, used_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NULL,
    action VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    module VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    auditable_type VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NULL,
    auditable_id BIGINT UNSIGNED NULL COMMENT 'Polymorphic internal record ID; intentionally no FK',
    route VARCHAR(255) NULL,
    http_method VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ip_address VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
    user_agent VARCHAR(1000) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    metadata JSON NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_admin_audit_actor_time (admin_id, created_at),
    KEY idx_admin_audit_subject (auditable_type, auditable_id, created_at),
    KEY idx_admin_audit_module_action (module, action, created_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommended RBAC permission codes include:
-- dashboard.view
-- users.view, users.update, users.change_status
-- providers.view, providers.update, providers.change_status
-- catalog.view, catalog.manage
-- requests.view, requests.manage, requests.cancel
-- subscriptions.view, subscriptions.manage, subscriptions.grant
-- payments.view, payments.refund, payments.export
-- notifications.view, notifications.send
-- reports.view, reports.export
-- admins.view, admins.manage
-- roles.view, roles.manage
-- audit_logs.view
-- settings.view, settings.manage

-- ============================================================================
-- 3. SERVICE CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    description VARCHAR(1000) NULL,
    image VARCHAR(512) NULL,
    icon VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_by_admin_id BIGINT UNSIGNED NULL,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_service_categories_slug (slug),
    KEY idx_service_categories_listing (is_active, deleted_at, sort_order),
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (updated_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    description VARCHAR(1000) NULL,
    image VARCHAR(512) NULL,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_by_admin_id BIGINT UNSIGNED NULL,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_services_slug (slug),
    UNIQUE KEY uq_services_category_name (service_category_id, name),
    KEY idx_services_catalog (service_category_id, is_active, deleted_at, sort_order),
    FOREIGN KEY (service_category_id) REFERENCES service_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (updated_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PROVIDER PROFILE, WORK AREA, AND OFFERED SERVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    work_latitude DECIMAL(10,7) NULL,
    work_longitude DECIMAL(10,7) NULL,
    work_radius_km SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    bio VARCHAR(1000) NULL,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    is_available TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    approved_at DATETIME(3) NULL,
    approved_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_provider_profiles_user (user_id),
    KEY idx_provider_profiles_search (is_active, is_available, work_radius_km),
    KEY idx_provider_profiles_geo (work_latitude, work_longitude),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_provider_work_radius CHECK (work_radius_km BETWEEN 20 AND 100),
    CONSTRAINT chk_provider_latitude CHECK (work_latitude IS NULL OR work_latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_provider_longitude CHECK (work_longitude IS NULL OR work_longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_provider_work_center CHECK (
        (work_latitude IS NULL AND work_longitude IS NULL)
        OR (work_latitude IS NOT NULL AND work_longitude IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provider_services (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_profile_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    price_toman BIGINT UNSIGNED NOT NULL,
    pricing_unit ENUM('fixed', 'per_hectare', 'per_square_meter', 'per_hour', 'per_day') NOT NULL DEFAULT 'fixed',
    description VARCHAR(1000) NULL,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_provider_services_provider_service (provider_profile_id, service_id),
    KEY idx_provider_services_search (service_id, is_active, price_toman, provider_profile_id),
    KEY idx_provider_services_provider_active (provider_profile_id, is_active),
    FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_provider_service_price CHECK (price_toman >= 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provider_service_price_histories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_service_id BIGINT UNSIGNED NOT NULL,
    old_price_toman BIGINT UNSIGNED NULL,
    new_price_toman BIGINT UNSIGNED NOT NULL,
    changed_by ENUM('provider', 'admin', 'system') NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NULL,
    changed_by_admin_id BIGINT UNSIGNED NULL,
    reason VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_provider_price_history_service (provider_service_id, created_at),
    FOREIGN KEY (provider_service_id) REFERENCES provider_services(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (changed_by_admin_id) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_provider_price_history_actor CHECK (
        (changed_by = 'provider' AND changed_by_user_id IS NOT NULL AND changed_by_admin_id IS NULL)
        OR (changed_by = 'admin' AND changed_by_admin_id IS NOT NULL AND changed_by_user_id IS NULL)
        OR (changed_by = 'system' AND changed_by_user_id IS NULL AND changed_by_admin_id IS NULL)
    ),
    CONSTRAINT chk_provider_price_history_new CHECK (new_price_toman >= 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. CONSUMER LANDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    area_square_meters DECIMAL(14,2) UNSIGNED NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    description VARCHAR(1500) NULL,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_lands_public_id (public_id),
    KEY idx_lands_user_listing (user_id, is_active, deleted_at, created_at),
    KEY idx_lands_geo (latitude, longitude),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_lands_area CHECK (area_square_meters > 0),
    CONSTRAINT chk_lands_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_lands_longitude CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. SUBSCRIPTION PLANS, PROVIDER SUBSCRIPTIONS, AND PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    duration_months SMALLINT UNSIGNED NOT NULL,
    price_toman BIGINT UNSIGNED NOT NULL,
    features JSON NULL,
    is_recommended TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_by_admin_id BIGINT UNSIGNED NULL,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_subscription_plans_code (code),
    KEY idx_subscription_plans_listing (is_active, deleted_at, sort_order),
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (updated_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_subscription_plan_duration CHECK (duration_months > 0),
    CONSTRAINT chk_subscription_plan_price CHECK (price_toman > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provider_subscriptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    provider_profile_id BIGINT UNSIGNED NOT NULL,
    subscription_plan_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
    source ENUM('purchase', 'admin_grant', 'promotion') NOT NULL DEFAULT 'purchase',
    plan_name_snapshot VARCHAR(150) NOT NULL,
    amount_toman BIGINT UNSIGNED NOT NULL,
    starts_at DATETIME(3) NULL,
    ends_at DATETIME(3) NULL,
    activated_at DATETIME(3) NULL,
    cancelled_at DATETIME(3) NULL,
    cancellation_reason VARCHAR(500) NULL,
    granted_by_admin_id BIGINT UNSIGNED NULL,
    active_provider_profile_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN status = 'active' THEN provider_profile_id ELSE NULL END
    ) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_provider_subscriptions_public_id (public_id),
    UNIQUE KEY uq_provider_subscriptions_one_active (active_provider_profile_id),
    KEY idx_provider_subscriptions_lookup (provider_profile_id, status, starts_at, ends_at),
    KEY idx_provider_subscriptions_plan (subscription_plan_id, created_at),
    FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (granted_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_provider_subscription_amount CHECK (amount_toman >= 0),
    CONSTRAINT chk_provider_subscription_dates CHECK (
        starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    provider_subscription_id BIGINT UNSIGNED NULL,
    amount_toman BIGINT UNSIGNED NOT NULL,
    currency CHAR(3) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'TMN',
    gateway VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'mock',
    status ENUM('initiated', 'pending', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded') NOT NULL DEFAULT 'initiated',
    authority VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    transaction_reference VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    failure_code VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    failure_message VARCHAR(1000) NULL,
    gateway_payload JSON NULL,
    initiated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    paid_at DATETIME(3) NULL,
    failed_at DATETIME(3) NULL,
    cancelled_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_subscription_payments_public_id (public_id),
    UNIQUE KEY uq_subscription_payments_authority (gateway, authority),
    UNIQUE KEY uq_subscription_payments_reference (gateway, transaction_reference),
    KEY idx_subscription_payments_user (user_id, status, created_at),
    KEY idx_subscription_payments_subscription (provider_subscription_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (provider_subscription_id) REFERENCES provider_subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_subscription_payment_amount CHECK (amount_toman > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_refunds (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subscription_payment_id BIGINT UNSIGNED NOT NULL,
    requested_by_admin_id BIGINT UNSIGNED NULL,
    amount_toman BIGINT UNSIGNED NOT NULL,
    status ENUM('requested', 'processing', 'succeeded', 'failed', 'cancelled') NOT NULL DEFAULT 'requested',
    reason VARCHAR(1000) NOT NULL,
    gateway_reference VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    gateway_payload JSON NULL,
    processed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_payment_refunds_payment (subscription_payment_id, status, created_at),
    FOREIGN KEY (subscription_payment_id) REFERENCES subscription_payments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (requested_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_payment_refund_amount CHECK (amount_toman > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SERVICE REQUEST LIFECYCLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    consumer_user_id BIGINT UNSIGNED NOT NULL,
    land_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    assigned_provider_profile_id BIGINT UNSIGNED NULL,
    status ENUM('pending_provider', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_provider',
    agreed_price_toman BIGINT UNSIGNED NULL,
    consumer_note VARCHAR(1500) NULL,

    consumer_name_snapshot VARCHAR(120) NOT NULL,
    service_name_snapshot VARCHAR(150) NOT NULL,
    service_category_name_snapshot VARCHAR(150) NOT NULL,
    land_title_snapshot VARCHAR(150) NOT NULL,
    land_area_square_meters_snapshot DECIMAL(14,2) UNSIGNED NOT NULL,
    land_latitude_snapshot DECIMAL(10,7) NOT NULL,
    land_longitude_snapshot DECIMAL(10,7) NOT NULL,
    assigned_provider_name_snapshot VARCHAR(120) NULL,

    cancelled_by ENUM('consumer', 'provider', 'admin') NULL,
    cancelled_by_user_id BIGINT UNSIGNED NULL,
    cancelled_by_admin_id BIGINT UNSIGNED NULL,
    cancel_reason VARCHAR(1500) NULL,
    accepted_at DATETIME(3) NULL,
    completed_at DATETIME(3) NULL,
    cancelled_at DATETIME(3) NULL,
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Optimistic concurrency version',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_service_requests_public_id (public_id),
    KEY idx_service_requests_consumer_status (consumer_user_id, status, created_at),
    KEY idx_service_requests_provider_status (assigned_provider_profile_id, status, created_at),
    KEY idx_service_requests_land_status (land_id, status, created_at),
    KEY idx_service_requests_service_status (service_id, status, created_at),
    KEY idx_service_requests_completed (status, completed_at),
    FOREIGN KEY (consumer_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (land_id) REFERENCES lands(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (assigned_provider_profile_id) REFERENCES provider_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by_admin_id) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_service_request_price CHECK (agreed_price_toman IS NULL OR agreed_price_toman >= 1000),
    CONSTRAINT chk_service_request_land_area CHECK (land_area_square_meters_snapshot > 0),
    CONSTRAINT chk_service_request_land_lat CHECK (land_latitude_snapshot BETWEEN -90 AND 90),
    CONSTRAINT chk_service_request_land_lng CHECK (land_longitude_snapshot BETWEEN -180 AND 180),
    CONSTRAINT chk_service_request_completed CHECK (
        status <> 'completed' OR completed_at IS NOT NULL
    ),
    CONSTRAINT chk_service_request_cancelled CHECK (
        status <> 'cancelled' OR (cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)
    ),
    CONSTRAINT chk_service_request_cancel_actor CHECK (
        cancelled_by IS NULL
        OR (cancelled_by IN ('consumer', 'provider') AND cancelled_by_user_id IS NOT NULL AND cancelled_by_admin_id IS NULL)
        OR (cancelled_by = 'admin' AND cancelled_by_admin_id IS NOT NULL AND cancelled_by_user_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_request_dates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_request_id BIGINT UNSIGNED NOT NULL,
    scheduled_date DATE NOT NULL,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_service_request_date (service_request_id, scheduled_date),
    KEY idx_service_request_dates_calendar (scheduled_date, service_request_id),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_request_providers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_request_id BIGINT UNSIGNED NOT NULL,
    provider_profile_id BIGINT UNSIGNED NOT NULL,
    provider_service_id BIGINT UNSIGNED NOT NULL,
    status ENUM('sent', 'accepted', 'rejected', 'removed') NOT NULL DEFAULT 'sent',
    provider_name_snapshot VARCHAR(120) NOT NULL,
    service_price_snapshot_toman BIGINT UNSIGNED NOT NULL,
    distance_km DECIMAL(8,2) UNSIGNED NOT NULL,
    rejection_reason VARCHAR(1000) NULL,
    removed_reason ENUM('accepted_by_other', 'request_cancelled', 'admin_removed', 'expired') NULL,
    sent_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    viewed_at DATETIME(3) NULL,
    responded_at DATETIME(3) NULL,
    accepted_request_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN status = 'accepted' THEN service_request_id ELSE NULL END
    ) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_service_request_provider (service_request_id, provider_profile_id),
    UNIQUE KEY uq_service_request_single_accepted (accepted_request_id),
    KEY idx_request_providers_provider_inbox (provider_profile_id, status, sent_at),
    KEY idx_request_providers_request_status (service_request_id, status),
    KEY idx_request_providers_search_sort (service_request_id, service_price_snapshot_toman, distance_km),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (provider_service_id) REFERENCES provider_services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_request_provider_price CHECK (service_price_snapshot_toman >= 1000),
    CONSTRAINT chk_request_provider_distance CHECK (distance_km >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_request_status_histories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_request_id BIGINT UNSIGNED NOT NULL,
    from_status ENUM('pending_provider', 'in_progress', 'completed', 'cancelled') NULL,
    to_status ENUM('pending_provider', 'in_progress', 'completed', 'cancelled') NOT NULL,
    actor_type ENUM('consumer', 'provider', 'admin', 'system') NOT NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    actor_admin_id BIGINT UNSIGNED NULL,
    reason VARCHAR(1500) NULL,
    metadata JSON NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_request_status_history (service_request_id, created_at),
    KEY idx_request_status_history_transition (from_status, to_status, created_at),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_request_status_history_actor CHECK (
        (actor_type IN ('consumer', 'provider') AND actor_user_id IS NOT NULL AND actor_admin_id IS NULL)
        OR (actor_type = 'admin' AND actor_admin_id IS NOT NULL AND actor_user_id IS NULL)
        OR (actor_type = 'system' AND actor_user_id IS NULL AND actor_admin_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_request_provider_histories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_request_provider_id BIGINT UNSIGNED NOT NULL,
    from_status ENUM('sent', 'accepted', 'rejected', 'removed') NULL,
    to_status ENUM('sent', 'accepted', 'rejected', 'removed') NOT NULL,
    actor_type ENUM('consumer', 'provider', 'admin', 'system') NOT NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    actor_admin_id BIGINT UNSIGNED NULL,
    reason VARCHAR(1500) NULL,
    metadata JSON NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_request_provider_history (service_request_provider_id, created_at),
    FOREIGN KEY (service_request_provider_id) REFERENCES service_request_providers(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_request_provider_history_actor CHECK (
        (actor_type IN ('consumer', 'provider') AND actor_user_id IS NOT NULL AND actor_admin_id IS NULL)
        OR (actor_type = 'admin' AND actor_admin_id IS NOT NULL AND actor_user_id IS NULL)
        OR (actor_type = 'system' AND actor_user_id IS NULL AND actor_admin_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. NOTIFICATIONS AND DELIVERY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    recipient_type ENUM('user', 'admin') NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    admin_id BIGINT UNSIGNED NULL,
    type VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'request_new, request_accepted, ...',
    title VARCHAR(200) NOT NULL,
    body VARCHAR(1500) NOT NULL,
    data JSON NULL,
    related_service_request_id BIGINT UNSIGNED NULL,
    read_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_notifications_public_id (public_id),
    KEY idx_notifications_user_unread (user_id, read_at, created_at),
    KEY idx_notifications_admin_unread (admin_id, read_at, created_at),
    KEY idx_notifications_type_time (type, created_at),
    KEY idx_notifications_request (related_service_request_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (related_service_request_id) REFERENCES service_requests(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_notification_recipient CHECK (
        (recipient_type = 'user' AND user_id IS NOT NULL AND admin_id IS NULL)
        OR (recipient_type = 'admin' AND admin_id IS NOT NULL AND user_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    notification_id BIGINT UNSIGNED NOT NULL,
    channel ENUM('in_app', 'sms', 'push') NOT NULL DEFAULT 'in_app',
    status ENUM('queued', 'sent', 'delivered', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
    provider VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
    provider_message_id VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
    attempts_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    error_message VARCHAR(1500) NULL,
    queued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    sent_at DATETIME(3) NULL,
    delivered_at DATETIME(3) NULL,
    failed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_notification_delivery_channel (notification_id, channel),
    KEY idx_notification_deliveries_queue (status, channel, queued_at),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. MODERATION AND SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_moderation_actions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    admin_id BIGINT UNSIGNED NOT NULL,
    action ENUM('activate', 'deactivate', 'suspend', 'ban', 'unban', 'warning') NOT NULL,
    reason VARCHAR(1500) NOT NULL,
    starts_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ends_at DATETIME(3) NULL,
    metadata JSON NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_user_moderation_user (user_id, created_at),
    KEY idx_user_moderation_admin (admin_id, created_at),
    KEY idx_user_moderation_active (action, starts_at, ends_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_user_moderation_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    setting_group VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'general',
    setting_key VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    value_type ENUM('string', 'integer', 'boolean', 'json') NOT NULL DEFAULT 'string',
    setting_value JSON NOT NULL,
    description VARCHAR(1000) NULL,
    is_public TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_system_settings_key (setting_group, setting_key),
    KEY idx_system_settings_public (is_public, setting_group),
    FOREIGN KEY (updated_by_admin_id) REFERENCES admins(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. READ-OPTIMIZED VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_searchable_provider_services AS
SELECT
    ps.id AS provider_service_id,
    pp.id AS provider_profile_id,
    pp.user_id AS provider_user_id,
    u.public_id AS provider_public_id,
    u.name AS provider_name,
    pp.work_latitude,
    pp.work_longitude,
    pp.work_radius_km,
    ps.service_id,
    s.name AS service_name,
    s.service_category_id,
    sc.name AS service_category_name,
    ps.price_toman,
    ps.pricing_unit
FROM provider_services ps
INNER JOIN provider_profiles pp ON pp.id = ps.provider_profile_id
INNER JOIN users u ON u.id = pp.user_id
INNER JOIN services s ON s.id = ps.service_id
INNER JOIN service_categories sc ON sc.id = s.service_category_id
WHERE ps.is_active = 1
  AND pp.is_active = 1
  AND pp.is_available = 1
  AND pp.work_latitude IS NOT NULL
  AND pp.work_longitude IS NOT NULL
  AND u.is_active = 1
  AND u.deleted_at IS NULL
  AND s.is_active = 1
  AND s.deleted_at IS NULL
  AND sc.is_active = 1
  AND sc.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM provider_subscriptions sub
      WHERE sub.provider_profile_id = pp.id
        AND sub.status = 'active'
        AND sub.starts_at <= CURRENT_TIMESTAMP(3)
        AND sub.ends_at > CURRENT_TIMESTAMP(3)
  );

CREATE OR REPLACE VIEW v_completed_service_request_financials AS
SELECT
    sr.id AS service_request_id,
    sr.public_id AS request_public_id,
    sr.consumer_user_id,
    sr.assigned_provider_profile_id,
    pp.user_id AS provider_user_id,
    sr.land_id,
    sr.service_id,
    sr.agreed_price_toman,
    sr.completed_at,
    sr.created_at
FROM service_requests sr
INNER JOIN provider_profiles pp ON pp.id = sr.assigned_provider_profile_id
WHERE sr.status = 'completed'
  AND sr.completed_at IS NOT NULL
  AND sr.agreed_price_toman IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- CRITICAL TRANSACTION RULES (IMPLEMENT IN APPLICATION SERVICES)
-- ============================================================================
--
-- A. Search providers
--    Query v_searchable_provider_services by service_id, exclude the current
--    consumer's own provider profile, then calculate Haversine distance using
--    land.latitude/longitude. Return only distance <= work_radius_km.
--
-- B. Create a successful search request
--    1. Insert service_requests with immutable service/land/user snapshots.
--    2. Insert at least one service_request_dates row.
--    3. Insert an initial service_request_status_histories row with
--       from_status = NULL and to_status = pending_provider.
--
-- C. Send to a Provider
--    Insert service_request_providers with price and distance snapshots, then
--    insert its history and enqueue a request_new notification.
--
-- D. Accept a request (must be one database transaction)
--    1. SELECT service_requests ... FOR UPDATE.
--    2. Verify status = pending_provider and the Provider link status = sent.
--    3. Update request: assigned Provider, agreed price, accepted_at,
--       status = in_progress, version = version + 1.
--    4. Mark the accepting link accepted and all other links removed with
--       removed_reason = accepted_by_other.
--    5. Insert both history records and notifications.
--    The generated unique key uq_service_request_single_accepted protects BR-01
--    against concurrent acceptance races.
--
-- E. Reject
--    Change only that Provider link from sent to rejected, set responded_at,
--    write history, and notify the Consumer. The parent request stays pending.
--
-- F. Cancel
--    pending_provider: only the Consumer may cancel; reason is optional.
--    in_progress: Consumer, assigned Provider, or authorized Admin may cancel;
--    a non-empty reason is mandatory. Mark remaining Provider links removed.
--
-- G. Complete
--    Only the owning Consumer may change in_progress to completed. Set
--    completed_at and create the Provider notification in the same transaction.
--
-- H. Subscription activation
--    Mark any previous active subscription expired/cancelled before activating
--    a new one. The generated unique key uq_provider_subscriptions_one_active
--    prevents two active subscription rows for the same Provider.
--
-- I. Contact privacy
--    Phone numbers remain in users, but API serializers may expose the opposite
--    party's phone only when request status is in_progress or completed.
--
-- J. RBAC resolution order
--    1. Inactive/deleted/locked Admin => deny.
--    2. is_super_admin = 1 => allow (and audit).
--    3. Active direct deny override => deny.
--    4. Active direct allow override => allow.
--    5. Otherwise allow only if an unexpired assigned role contains the active
--       permission. Every sensitive mutation must write admin_audit_logs.
-- ============================================================================
