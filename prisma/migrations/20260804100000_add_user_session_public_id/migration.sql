ALTER TABLE user_sessions
    ADD COLUMN public_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER id,
    ADD UNIQUE KEY uq_user_sessions_public_id (public_id);
