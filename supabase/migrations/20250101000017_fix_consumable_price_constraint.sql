-- Migration: Fix machine_consumables default_price constraint
-- Allow 0 price (free items / price TBD)

ALTER TABLE machine_consumables
  DROP CONSTRAINT IF EXISTS machine_consumables_default_price_check;

ALTER TABLE machine_consumables
  ADD CONSTRAINT machine_consumables_default_price_check
  CHECK (default_price >= 0 AND default_price <= 999999999.99);
