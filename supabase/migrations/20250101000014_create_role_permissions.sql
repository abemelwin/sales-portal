-- Migration: Create role_permissions table
-- Stores which capabilities each role has (replaces localStorage)

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL UNIQUE,
    manage_product_files BOOLEAN NOT NULL DEFAULT false,
    edit_machine_catalog BOOLEAN NOT NULL DEFAULT false,
    upload_machine_catalog BOOLEAN NOT NULL DEFAULT false,
    upload_consumables_pricelist BOOLEAN NOT NULL DEFAULT false,
    manage_users BOOLEAN NOT NULL DEFAULT false,
    manage_roles_access BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default permissions
INSERT INTO role_permissions (role, manage_product_files, edit_machine_catalog, upload_machine_catalog, upload_consumables_pricelist, manage_users, manage_roles_access) VALUES
  ('superadmin', true, true, true, true, true, true),
  ('product_manager', true, true, false, false, false, false),
  ('sales_admin_manager', false, true, true, true, false, false),
  ('sales_admin_supervisor', false, true, true, true, false, false),
  ('sales_admin_assistant', false, false, false, false, false, false),
  ('area_sales_manager', false, false, false, false, false, false),
  ('account_executive', false, false, false, false, false, false),
  ('sales_assistant', false, false, false, false, false, false),
  ('user', false, false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- RLS: all authenticated can read, only superadmin can write
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_role_permissions" ON role_permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "superadmin_manage_role_permissions" ON role_permissions
    FOR ALL USING (public.get_user_role() = 'superadmin');
