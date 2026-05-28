CREATE TABLE IF NOT EXISTS app_config (
    id CHAR(36) PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL DEFAULT 'Laundry POS',
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    logo_url VARCHAR(500),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_config (id, app_name, description, version)
VALUES (UUID(), 'Laundry POS', 'Aplikasi manajemen laundry profesional. Kelola pesanan, layanan, dan bisnis laundry Anda dalam satu platform.', '1.0.0');
