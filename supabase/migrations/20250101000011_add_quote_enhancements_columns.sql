-- Migration: Add quote enhancement columns to quotes table
-- Description: Adds new nullable columns to support quote generator enhancements including
--              client email, quote date, salutation, opening line, unit condition override,
--              delivery/computer set toggles, toggleable inclusions/exclusions/add-ons, and
--              warranty fields. All columns are nullable for backward compatibility with
--              existing quote rows.
-- Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 7.3, 8.3, 9.1, 10.1, 11.1, 12.2

-- Client info additions (Requirements 1–4)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_date DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS salutation TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS opening_line TEXT;

-- Machine section (Requirement 5)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS unit_condition_override TEXT;

-- Delivery and computer set toggles (Requirements 7–8)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS include_delivery BOOLEAN DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS include_computer_set BOOLEAN DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS computer_set_spec TEXT;

-- Toggleable package items — JSONB arrays of ToggleableItem (Requirements 9–11)
-- Each item: { id: string, description: string, enabled: boolean, isCustom: boolean, sortOrder: number }
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS inclusion_toggles JSONB;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS exclusion_toggles JSONB;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS addon_toggles JSONB;

-- Warranty fields (Requirement 12)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS warranty_company TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS warranty_supplier TEXT;
