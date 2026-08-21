-- Migration: Fix user_profiles_with_email view security issues
-- Resolves Supabase Security Advisor warnings:
-- 1. Exposed Auth Users (CRITICAL): View joining auth.users in public schema exposed to API roles
-- 2. Security Definer View (CRITICAL): View running without security_invoker bypassing RLS

-- 1. Add email column directly to user_profiles table if it does not exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email column from auth.users for existing records
UPDATE public.user_profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email <> u.email);

-- 3. Create trigger function to automatically sync email when user profile is created or updated
CREATE OR REPLACE FUNCTION public.sync_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_profile_email ON public.user_profiles;
CREATE TRIGGER tr_sync_user_profile_email
BEFORE INSERT OR UPDATE OF user_id ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_email();

-- 4. Create trigger on auth.users so email changes in auth schema sync to user_profiles
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auth_user_email_update ON auth.users;
CREATE TRIGGER tr_auth_user_email_update
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_email_update();

-- 5. Recreate user_profiles_with_email view with security_invoker enabled querying user_profiles directly
DROP VIEW IF EXISTS public.user_profiles_with_email CASCADE;

CREATE VIEW public.user_profiles_with_email WITH (security_invoker = true) AS
SELECT
  p.id,
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
  p.email
FROM public.user_profiles p;

-- 6. Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.user_profiles_with_email TO authenticated;
