-- V2__create_staff_table.sql
-- Week 1 · B2: Auth module
-- Creates the STAFF profile table matching the Staff entity

CREATE TABLE IF NOT EXISTS staff (
    staff_id    BIGSERIAL    PRIMARY KEY,
    account_id  BIGINT       NOT NULL UNIQUE REFERENCES accounts(account_id),
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    email       VARCHAR(100) UNIQUE,
    phone       VARCHAR(15),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_account ON staff(account_id);

-- Default admin account for first-time setup.
-- Password: Admin@1234  ← CHANGE THIS immediately after first login!
INSERT INTO accounts (username, password, role, is_active, created_at)
VALUES (
    'admin',
    '$2a$12$tFzPNgF7y3X6FI3cLY7TgOmMv2CbPl3H7Kn6sKm9sBzRzaVHnMiWK',
    'ADMIN',
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO staff (account_id, first_name, last_name, created_at)
VALUES (
    (SELECT account_id FROM accounts WHERE username = 'admin'),
    'System',
    'Admin',
    CURRENT_TIMESTAMP
)
ON CONFLICT (account_id) DO NOTHING;