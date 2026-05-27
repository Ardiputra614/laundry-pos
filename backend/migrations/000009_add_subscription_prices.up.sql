ALTER TABLE subscription_plans
  ADD COLUMN price_daily DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER price_yearly,
  ADD COLUMN price_hourly DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER price_daily,
  ADD COLUMN price_per_minute DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER price_hourly;

