-- ============================================================================
-- Service intro page + featured services
--
-- 1. services.details    — rich-text body of the service's public intro page,
--                          stored as a sanitized Tiptap (ProseMirror) JSON doc.
-- 2. services.is_special — featured service; the app home shows three random
--                          active special services ("آیا این ادوات را می‌شناسید؟").
-- ============================================================================

ALTER TABLE services
    ADD COLUMN details MEDIUMTEXT NULL AFTER image,
    ADD COLUMN is_special TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
    ADD KEY idx_services_special (is_special, is_active, deleted_at);
