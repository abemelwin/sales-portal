-- Migration: Add pricing and warranty columns to machines table
-- Description: Adds SRP, LBP, cash_price, machine_warranty_months, printhead_warranty fields
-- to support the Machine Price List view matching the reference portal.

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS srp NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lbp NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_price NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS machine_warranty_months INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS printhead_warranty TEXT DEFAULT '0 mo.';
