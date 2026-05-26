CREATE TABLE IF NOT EXISTS company_settings (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL UNIQUE,
    company_id CHAR(36) NOT NULL,
    tax_enabled TINYINT(1) NOT NULL DEFAULT 0,
    default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_enabled TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_settings_tenant (tenant_id),
    INDEX idx_settings_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
