-- Migration: Create product_info_links table
-- Description: Reference documents (brochures, datasheets) linked to machines
-- Requirements: 9.5

CREATE TABLE product_info_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 150),
    url TEXT NOT NULL CHECK (char_length(url) <= 2048),
    document_type TEXT NOT NULL DEFAULT 'other',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
