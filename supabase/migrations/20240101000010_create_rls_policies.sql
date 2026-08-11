-- Migration: Enable Row Level Security and create RLS policies
-- Implements data isolation: users manage own data, admins manage all

-- ============================================================
-- Helper function to get the authenticated user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid() AND is_active = true
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_info_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_term_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_consumable_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER_PROFILES policies
-- Users can read their own profile; admins can read/write all
-- ============================================================
CREATE POLICY "users_read_own_profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_read_all_profiles" ON user_profiles
    FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "admins_manage_profiles" ON user_profiles
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINES policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_machines" ON machines
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_machines" ON machines
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINE_FEATURES policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_features" ON machine_features
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_features" ON machine_features
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINE_CONSUMABLES policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_consumables" ON machine_consumables
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_consumables" ON machine_consumables
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINE_INCLUSIONS policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_inclusions" ON machine_inclusions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_inclusions" ON machine_inclusions
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINE_EXCLUSIONS policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_exclusions" ON machine_exclusions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_exclusions" ON machine_exclusions
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MACHINE_ADDONS policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_addons" ON machine_addons
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_addons" ON machine_addons
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- PRODUCT_INFO_LINKS policies
-- All authenticated users can read; admins can write
-- ============================================================
CREATE POLICY "authenticated_read_product_info" ON product_info_links
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_manage_product_info" ON product_info_links
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- QUOTES policies
-- Users manage own quotes; admins manage all
-- ============================================================
CREATE POLICY "users_read_own_quotes" ON quotes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_read_all_quotes" ON quotes
    FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "users_insert_own_quotes" ON quotes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_quotes" ON quotes
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_quotes" ON quotes
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "admins_manage_quotes" ON quotes
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- QUOTE_TERM_OPTIONS policies
-- Users manage via parent quote ownership; admins manage all
-- ============================================================
CREATE POLICY "users_manage_own_quote_terms" ON quote_term_options
    FOR ALL USING (
        EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_term_options.quote_id AND quotes.user_id = auth.uid())
    );

CREATE POLICY "admins_manage_quote_terms" ON quote_term_options
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- QUOTE_TRADE_INS policies
-- Users manage via parent quote ownership; admins manage all
-- ============================================================
CREATE POLICY "users_manage_own_quote_trade_ins" ON quote_trade_ins
    FOR ALL USING (
        EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_trade_ins.quote_id AND quotes.user_id = auth.uid())
    );

CREATE POLICY "admins_manage_quote_trade_ins" ON quote_trade_ins
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- QUOTE_CONSUMABLE_PRICES policies
-- Users manage via parent quote ownership; admins manage all
-- ============================================================
CREATE POLICY "users_manage_own_quote_consumable_prices" ON quote_consumable_prices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_consumable_prices.quote_id AND quotes.user_id = auth.uid())
    );

CREATE POLICY "admins_manage_quote_consumable_prices" ON quote_consumable_prices
    FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- MIGRATION_STATUS policies
-- Admin only (read and write)
-- ============================================================
CREATE POLICY "admins_manage_migration" ON migration_status
    FOR ALL USING (public.get_user_role() = 'admin');
