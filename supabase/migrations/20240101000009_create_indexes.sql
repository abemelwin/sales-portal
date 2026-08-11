-- Migration: Create performance indexes
-- Description: Indexes for frequently queried columns as defined in design
-- Requirements: 4.5, 5.7, 10.1

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Machines indexes
CREATE INDEX idx_machines_brand_model ON machines(brand, model);
CREATE INDEX idx_machines_is_active ON machines(is_active);

-- Quotes indexes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_machine_id ON quotes(machine_id);

-- Machine consumables index
CREATE INDEX idx_machine_consumables_machine_id ON machine_consumables(machine_id);

-- Product info links index
CREATE INDEX idx_product_info_links_machine_id ON product_info_links(machine_id);
