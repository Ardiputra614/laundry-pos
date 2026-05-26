ALTER TABLE services ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER base_price;
