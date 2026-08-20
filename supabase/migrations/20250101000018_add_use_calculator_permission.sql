-- Migration: Add use_calculator permission column to user_profiles and role_permissions, and update user_profiles_with_email view

-- 1. Add use_calculator column to user_profiles table (defaults to NULL, meaning defer to role)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS use_calculator BOOLEAN;

-- 2. Add use_calculator column to role_permissions table (defaults to true)
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS use_calculator BOOLEAN NOT NULL DEFAULT true;

-- 3. Recreate user_profiles_with_email view with use_calculator column
DROP VIEW IF EXISTS public.user_profiles_with_email CASCADE;

CREATE VIEW public.user_profiles_with_email AS
SELECT
  p.user_id,
  p.display_name,
  p.role,
  p.is_active,
  p.created_at,
  p.create_quotes,
  p.use_calculator,
  p.manage_product_files,
  p.edit_machine_catalog,
  p.upload_machine_catalog,
  p.manage_users,
  p.manage_roles_access,
  u.email
FROM public.user_profiles p
JOIN auth.users u ON u.id = p.user_id;

GRANT SELECT ON public.user_profiles_with_email TO authenticated;
