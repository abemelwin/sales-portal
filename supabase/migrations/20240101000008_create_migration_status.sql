-- Migration: Create migration_status table
-- Description: Tracks one-time localStorage-to-Supabase data migration progress
-- Requirements: 12.1

CREATE TABLE migration_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migrated_by UUID NOT NULL REFERENCES auth.users(id),
    records_found INT NOT NULL DEFAULT 0,
    records_migrated INT NOT NULL DEFAULT 0,
    records_skipped INT NOT NULL DEFAULT 0,
    skipped_details JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
