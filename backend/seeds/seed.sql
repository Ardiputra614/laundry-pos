-- ============================================================
-- Superadmin Account
-- Email:    superadmin@laundry.app
-- Password: superadmin123
-- ============================================================

INSERT INTO companies (id, tenant_id, name, slug, email, phone, is_active, is_suspended, plan, sub_status, max_users, max_branches, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Superadmin Corp', 'superadmin', 'superadmin@laundry.app', '08123456789', 1, 0, 'enterprise', 'active', 999, 999, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW(3);

INSERT INTO users (id, tenant_id, company_id, email, password, full_name, phone, role, is_active, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'superadmin@laundry.app', '$2a$10$OtO3xUTpWJ4gB2iNCY7qa.AN82lt1QCI5ztwG.ibM69x28R5RaF3q', 'Super Admin', '08123456789', 'superadmin', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = NOW(3);

-- ============================================================
-- Subscription Plans
-- ============================================================

INSERT INTO subscription_plans (id, name, code, description, price_monthly, price_yearly, max_users, max_branches, max_outlets, features, is_active, sort_order, created_at, updated_at)
VALUES
('00000000-0000-0000-0000-000000000003', 'Basic', 'basic', 'Perfect for small laundry startups', 199000, 1990000, 5, 1, 1, '{"max_branches":1,"max_outlets":1,"max_users":5,"max_customers":200,"max_orders_monthly":300,"advanced_report":false,"api_enabled":false,"priority_support":false}', 1, 1, NOW(3), NOW(3)),
('00000000-0000-0000-0000-000000000004', 'Professional', 'professional', 'For growing laundry businesses', 499000, 4990000, 15, 3, 5, '{"max_branches":3,"max_outlets":5,"max_users":15,"max_customers":1000,"max_orders_monthly":2000,"advanced_report":true,"api_enabled":false,"priority_support":false}', 1, 2, NOW(3), NOW(3)),
('00000000-0000-0000-0000-000000000005', 'Enterprise', 'enterprise', 'For large laundry chains and franchises', 999000, 9990000, 999, 999, 999, '{"max_branches":999,"max_outlets":999,"max_users":999,"max_customers":99999,"max_orders_monthly":99999,"advanced_report":true,"api_enabled":true,"priority_support":true}', 1, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW(3);

-- ============================================================
-- Subscription for Superadmin Company
-- ============================================================

INSERT INTO subscriptions (id, tenant_id, company_id, plan_id, status, billing_cycle, amount, started_at, current_period_start, current_period_end, auto_renew, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'active', 'yearly', 9990000, NOW(3), NOW(3), DATE_ADD(NOW(3), INTERVAL 1 YEAR), 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW(3);
