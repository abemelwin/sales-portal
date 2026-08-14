-- Migration: Allow superadmin to manage machine catalog tables
-- The existing policies only allow role='admin' but superadmin also needs write access.

-- Machines
DROP POLICY IF EXISTS "admins_manage_machines" ON machines;
CREATE POLICY "admins_manage_machines" ON machines
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));

-- Machine Features
DROP POLICY IF EXISTS "admins_manage_features" ON machine_features;
CREATE POLICY "admins_manage_features" ON machine_features
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));

-- Machine Consumables
DROP POLICY IF EXISTS "admins_manage_consumables" ON machine_consumables;
CREATE POLICY "admins_manage_consumables" ON machine_consumables
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));

-- Machine Inclusions
DROP POLICY IF EXISTS "admins_manage_inclusions" ON machine_inclusions;
CREATE POLICY "admins_manage_inclusions" ON machine_inclusions
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));

-- Machine Exclusions
DROP POLICY IF EXISTS "admins_manage_exclusions" ON machine_exclusions;
CREATE POLICY "admins_manage_exclusions" ON machine_exclusions
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));

-- Machine Addons
DROP POLICY IF EXISTS "admins_manage_addons" ON machine_addons;
CREATE POLICY "admins_manage_addons" ON machine_addons
    FOR ALL USING (public.get_user_role() IN ('admin', 'superadmin'));
