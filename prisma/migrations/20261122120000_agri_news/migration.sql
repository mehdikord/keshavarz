-- ============================================================================
-- Agriculture news («اخبار کشاورزی»)
--
-- 1. news_items — links to stories on other sites. The story text is never
--                 stored; only headline, picture/logo, link and importance.
-- 2. news.view / news.manage — admin permissions, granted to the built-in
--                 platform_admin role (which holds every permission).
-- ============================================================================

CREATE TABLE news_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'ULID; also the newest-first sort key',
    title VARCHAR(255) NOT NULL,
    search_title VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Normalized title for search',
    link VARCHAR(4096) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    link_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'SHA-256 of link; blocks duplicates',
    image VARCHAR(4096) NOT NULL COMMENT 'Uploaded file URL or direct external image URL',
    image_key VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'Storage key; only set for files we own',
    is_important TINYINT(1) NOT NULL DEFAULT 0,
    created_by_admin_id BIGINT UNSIGNED NULL,
    updated_by_admin_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_news_items_public_id (public_id),
    UNIQUE KEY uq_news_items_link_hash (link_hash),
    KEY idx_news_items_important (is_important, public_id),
    KEY idx_news_items_creator (created_by_admin_id),
    KEY idx_news_items_updater (updated_by_admin_id),
    CONSTRAINT news_items_ibfk_1
        FOREIGN KEY (created_by_admin_id) REFERENCES admins (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT news_items_ibfk_2
        FOREIGN KEY (updated_by_admin_id) REFERENCES admins (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO admin_permissions (module, action, code, name)
VALUES ('news', 'view', 'news.view', 'news.view'),
       ('news', 'manage', 'news.manage', 'news.manage');

-- On a fresh database the role does not exist yet; prisma/seed.ts grants it there.
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
JOIN admin_permissions p ON p.code IN ('news.view', 'news.manage')
WHERE r.code = 'platform_admin';
