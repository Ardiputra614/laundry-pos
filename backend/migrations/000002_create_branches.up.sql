CREATE TABLE IF NOT EXISTS branches (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    INDEX idx_branches_tenant (tenant_id),
    INDEX idx_branches_company (company_id),
    INDEX idx_branches_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS outlets (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    branch_id CHAR(36),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    INDEX idx_outlets_tenant (tenant_id),
    INDEX idx_outlets_company (company_id),
    INDEX idx_outlets_branch (branch_id),
    INDEX idx_outlets_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
