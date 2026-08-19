-- Migration: Fix RLS policies on product_info_links, catalog tables, and role_permissions for RBAC
-- Allows authenticated users to write data when authorized by RBAC application logic.

-- 1. product_info_links
DROP POLICY IF EXISTS "admins_manage_product_info" ON product_info_links;
DROP POLICY IF EXISTS "authenticated_manage_product_info" ON product_info_links;
CREATE POLICY "authenticated_manage_product_info" ON product_info_links
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. machines
DROP POLICY IF EXISTS "admins_manage_machines" ON machines;
DROP POLICY IF EXISTS "authenticated_manage_machines" ON machines;
CREATE POLICY "authenticated_manage_machines" ON machines
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. machine_features
DROP POLICY IF EXISTS "admins_manage_features" ON machine_features;
DROP POLICY IF EXISTS "authenticated_manage_features" ON machine_features;
CREATE POLICY "authenticated_manage_features" ON machine_features
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. machine_consumables
DROP POLICY IF EXISTS "admins_manage_consumables" ON machine_consumables;
DROP POLICY IF EXISTS "authenticated_manage_consumables" ON machine_consumables;
CREATE POLICY "authenticated_manage_consumables" ON machine_consumables
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. machine_inclusions
DROP POLICY IF EXISTS "admins_manage_inclusions" ON machine_inclusions;
DROP POLICY IF EXISTS "authenticated_manage_inclusions" ON machine_inclusions;
CREATE POLICY "authenticated_manage_inclusions" ON machine_inclusions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. machine_exclusions
DROP POLICY IF EXISTS "admins_manage_exclusions" ON machine_exclusions;
DROP POLICY IF EXISTS "authenticated_manage_exclusions" ON machine_exclusions;
CREATE POLICY "authenticated_manage_exclusions" ON machine_exclusions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. machine_addons
DROP POLICY IF EXISTS "admins_manage_addons" ON machine_addons;
DROP POLICY IF EXISTS "authenticated_manage_addons" ON machine_addons;
CREATE POLICY "authenticated_manage_addons" ON machine_addons
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. role_permissions
DROP POLICY IF EXISTS "superadmin_manage_role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "authenticated_manage_role_permissions" ON role_permissions;
CREATE POLICY "authenticated_manage_role_permissions" ON role_permissions
    FOR ALL USING (auth.uid() IS NOT NULL);
