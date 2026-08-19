-- Migration: Add user-level permission override columns to user_profiles table

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS create_quotes BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_product_files BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS edit_machine_catalog BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upload_machine_catalog BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_users BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_roles_access BOOLEAN;
