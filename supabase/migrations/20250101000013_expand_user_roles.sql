-- Migration: Expand user roles from 2 to 9 roles
-- Description: Updates user_profiles role CHECK constraint to support all ESPMI roles

-- Drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new constraint with expanded roles
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor', 'sales_admin', 'area_sales_manager', 'account_executive', 'sales_assistant', 'user'));

-- Migrate existing data: admin -> superadmin, salesperson -> account_executive
UPDATE user_profiles SET role = 'superadmin' WHERE role = 'admin';
UPDATE user_profiles SET role = 'account_executive' WHERE role = 'salesperson';

-- Update default
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'user';
