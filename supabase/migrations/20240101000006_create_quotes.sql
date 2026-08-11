-- Migration: Create quotes table
-- Description: Sales quotes with all fields from the design (deal type, pricing, signatory, etc.)
-- Requirements: 5.7, 5.14

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    machine_id UUID REFERENCES machines(id),
    client_name TEXT,
    company TEXT,
    address TEXT,
    contact TEXT,
    deal_type TEXT CHECK (deal_type IN ('Standard Cash', 'Standard Terms', 'Trade-In Cash', 'Trade-In Terms')),
    contract_price NUMERIC(12,2),
    vat_inclusive BOOLEAN NOT NULL DEFAULT false,
    under_promo BOOLEAN NOT NULL DEFAULT false,
    promo_validity TEXT,
    availability TEXT CHECK (char_length(availability) <= 200),
    collection_payment TEXT CHECK (char_length(collection_payment) <= 200),
    collection_downpayment TEXT CHECK (char_length(collection_downpayment) <= 200),
    collection_amortization TEXT CHECK (char_length(collection_amortization) <= 200),
    ae_name TEXT CHECK (char_length(ae_name) <= 100),
    client_conforme TEXT CHECK (char_length(client_conforme) <= 100),
    noted_by_name TEXT CHECK (char_length(noted_by_name) <= 100),
    noted_by_role TEXT CHECK (char_length(noted_by_role) <= 100),
    letterhead TEXT DEFAULT 'ES Print Media Inc.',
    freebies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
