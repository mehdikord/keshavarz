-- ============================================================================
-- Admin panel foundation (rebuilt admin console)
--
-- 1. admin_sessions.public_id   — lets an admin list and revoke individual
--                                 sessions without exposing internal IDs.
-- 2. users.idx_users_last_login — the admin users list sorts/filters by last
--                                 login; avoid a filesort over the table.
-- 3. user_admin_notes           — internal notes admins keep on a user
--                                 (never shown to the user).
-- ============================================================================

ALTER TABLE admin_sessions
    ADD COLUMN public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER id,
    ADD UNIQUE KEY uq_admin_sessions_public_id (public_id);

ALTER TABLE users
    ADD KEY idx_users_last_login (last_login_at);

CREATE TABLE user_admin_notes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'ULID exposed to admin clients',
    user_id BIGINT UNSIGNED NOT NULL,
    admin_id BIGINT UNSIGNED NULL,
    body VARCHAR(2000) NOT NULL,
    is_pinned TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_admin_notes_public_id (public_id),
    KEY idx_user_admin_notes_user (user_id, deleted_at, is_pinned, created_at),
    KEY idx_user_admin_notes_admin (admin_id),
    CONSTRAINT user_admin_notes_ibfk_1
        FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT user_admin_notes_ibfk_2
        FOREIGN KEY (admin_id) REFERENCES admins (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
