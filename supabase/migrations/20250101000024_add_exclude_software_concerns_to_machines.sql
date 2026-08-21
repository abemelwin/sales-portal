-- Migration: Add exclude_software_concerns column to machines table
-- Stores whether "excluding software related concerns" clause is included in warranty for each machine

ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS exclude_software_concerns BOOLEAN DEFAULT true;
