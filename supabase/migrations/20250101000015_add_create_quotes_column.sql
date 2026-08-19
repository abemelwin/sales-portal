-- Migration: Add create_quotes column to role_permissions table
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS create_quotes BOOLEAN NOT NULL DEFAULT true;

-- Update technical / non-sales roles to false by default
UPDATE role_permissions SET create_quotes = false WHERE role IN ('product_technical_head', 'product_development_manager', 'service_manager', 'user');
