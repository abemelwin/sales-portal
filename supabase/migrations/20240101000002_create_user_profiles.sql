-- Migration: Create user_profiles table
-- Description: Extends Supabase auth.users with display name, role, and active status
-- Requirements: 2.1, 10.1

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 128),
    role TEXT NOT NULL DEFAULT 'salesperson' CHECK (role IN ('admin', 'salesperson')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);
