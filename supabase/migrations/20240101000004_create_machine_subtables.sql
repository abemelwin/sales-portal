-- Migration: Create machine sub-tables
-- Description: Features, consumables, inclusions, exclusions, and addons for machines
-- Requirements: 4.5

CREATE TABLE machine_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE machine_consumables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL CHECK (char_length(item_name) <= 150),
    package_description TEXT CHECK (char_length(package_description) <= 300),
    default_price NUMERIC(12,2) NOT NULL CHECK (default_price BETWEEN 0.01 AND 999999999.99),
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE machine_inclusions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE machine_exclusions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE machine_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);
