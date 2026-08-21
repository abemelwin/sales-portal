-- Migration: Add must_change_password column to user_profiles table
-- Description: Enforces one-time password change on initial login or admin reset

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Drop existing view to prevent PostgreSQL 42P16 column position error
DROP VIEW IF EXISTS public.user_profiles_with_email CASCADE;

-- Create view user_profiles_with_email with all permission columns & must_change_password
CREATE VIEW public.user_profiles_with_email AS
SELECT
  p.user_id,
  p.display_name,
  p.role,
  p.is_active,
  p.must_change_password,
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

-- Grant read access to authenticated users
GRANT SELECT ON public.user_profiles_with_email TO authenticated;
