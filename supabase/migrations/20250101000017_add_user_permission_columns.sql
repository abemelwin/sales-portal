-- Migration: Add permission columns to user_profiles, fix RLS policy, and update user_profiles_with_email view

-- 1. Add permission columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS create_quotes BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_product_files BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS edit_machine_catalog BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upload_machine_catalog BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_users BOOLEAN;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manage_roles_access BOOLEAN;

-- 2. Fix RLS policy on user_profiles so admins can update user permissions
DROP POLICY IF EXISTS "admins_manage_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_manage_profiles" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_read_all_profiles" ON user_profiles;

CREATE POLICY "authenticated_read_all_profiles" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_manage_profiles" ON user_profiles
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Drop existing view and recreate user_profiles_with_email view with all permission columns
DROP VIEW IF EXISTS public.user_profiles_with_email CASCADE;

CREATE VIEW public.user_profiles_with_email AS
SELECT
  p.user_id,
  p.display_name,
  p.role,
  p.is_active,
  p.created_at,
  p.create_quotes,
  p.manage_product_files,
  p.edit_machine_catalog,
  p.upload_machine_catalog,
  p.manage_users,
  p.manage_roles_access,
  u.email
FROM public.user_profiles p
JOIN auth.users u ON u.id = p.user_id;

GRANT SELECT ON public.user_profiles_with_email TO authenticated;
