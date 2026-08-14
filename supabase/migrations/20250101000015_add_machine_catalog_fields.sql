-- Migration: Add missing machine catalog fields
-- Description: Adds has_trade_in, has_printhead, service_fee, default_months, availability
-- to the machines table for full Catalog Editor support.

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS has_trade_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_printhead BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_fee NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_months INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS availability TEXT CHECK (char_length(availability) <= 200);
