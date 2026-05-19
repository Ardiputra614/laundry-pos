CREATE TABLE IF NOT EXISTS service_categories (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    INDEX idx_svc_cat_tenant (tenant_id),
    INDEX idx_svc_cat_company (company_id),
    INDEX idx_svc_cat_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    category_id CHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_type VARCHAR(20) NOT NULL DEFAULT 'weight',
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    base_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    estimated_hours INT NOT NULL DEFAULT 24,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    INDEX idx_services_tenant (tenant_id),
    INDEX idx_services_company (company_id),
    INDEX idx_services_category (category_id),
    INDEX idx_services_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_pricings (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    service_id CHAR(36) NOT NULL,
    outlet_id CHAR(36),
    min_weight DECIMAL(10,2),
    max_weight DECIMAL(10,2),
    price DECIMAL(15,2) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    INDEX idx_pricing_tenant (tenant_id),
    INDEX idx_pricing_company (company_id),
    INDEX idx_pricing_service (service_id),
    INDEX idx_pricing_outlet (outlet_id),
    INDEX idx_pricing_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
