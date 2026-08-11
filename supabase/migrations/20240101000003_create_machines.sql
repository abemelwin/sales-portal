-- Migration: Create machines table
-- Description: Machine catalog with brand/model uniqueness constraint and condition/letterhead checks
-- Requirements: 4.5, 4.7

CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL CHECK (char_length(brand) <= 100),
    model TEXT NOT NULL CHECK (char_length(model) <= 100),
    sub_model TEXT CHECK (char_length(sub_model) <= 100),
    unit_condition TEXT NOT NULL CHECK (unit_condition IN ('Brand New', 'Re-certified', 'Demo Unit')),
    letterhead TEXT NOT NULL DEFAULT 'ES Print Media Inc.' CHECK (letterhead IN ('ES Print Media Inc.', 'ACS / Alternative')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(brand, model, COALESCE(sub_model, ''))
);
