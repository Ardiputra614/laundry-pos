CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    order_id CHAR(36),
    invoice_id CHAR(36),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_channel VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    midtrans_transaction_id VARCHAR(255),
    midtrans_status VARCHAR(50),
    paid_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_payments_tenant (tenant_id),
    INDEX idx_payments_company (company_id),
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_midtrans (midtrans_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    branch_id CHAR(36),
    user_id CHAR(36) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    device_id VARCHAR(255) NOT NULL,
    fcm_token TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_sync_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_devices_tenant (tenant_id),
    INDEX idx_devices_company (company_id),
    INDEX idx_devices_device (device_id),
    INDEX idx_devices_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_logs (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    device_id CHAR(36),
    table_name VARCHAR(100),
    sync_type VARCHAR(20) NOT NULL DEFAULT 'push',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    records_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    synced_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_sync_tenant (tenant_id),
    INDEX idx_sync_company (company_id),
    INDEX idx_sync_device (device_id),
    INDEX idx_sync_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id CHAR(36),
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_tenant (tenant_id),
    INDEX idx_activity_company (company_id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
    reference_type VARCHAR(100),
    reference_id CHAR(36),
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_notif_tenant (tenant_id),
    INDEX idx_notif_company (company_id),
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
