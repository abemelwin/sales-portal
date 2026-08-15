-- Migration: Fix quote_consumable_prices foreign key to allow cascade delete
-- When machine consumables are replaced during catalog update, the linked
-- quote_consumable_prices rows should be deleted automatically.

ALTER TABLE quote_consumable_prices
  DROP CONSTRAINT IF EXISTS quote_consumable_prices_consumable_id_fkey;

ALTER TABLE quote_consumable_prices
  ADD CONSTRAINT quote_consumable_prices_consumable_id_fkey
  FOREIGN KEY (consumable_id)
  REFERENCES machine_consumables(id)
  ON DELETE CASCADE;
