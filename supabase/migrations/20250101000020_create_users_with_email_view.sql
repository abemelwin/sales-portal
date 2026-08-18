-- Migration: Create a view that joins user_profiles with auth.users email
-- This allows the app to display email in User Management without exposing auth schema directly.

CREATE OR REPLACE VIEW public.user_profiles_with_email AS
SELECT
  p.user_id,
  p.display_name,
  p.role,
  p.is_active,
  p.created_at,
  u.email
FROM public.user_profiles p
JOIN auth.users u ON u.id = p.user_id;

-- Grant read access to authenticated users
GRANT SELECT ON public.user_profiles_with_email TO authenticated;
