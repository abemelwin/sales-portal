-- Migration: Relax unit_condition CHECK constraint on machines table
-- Description: Allow free-text category values (e.g. "Laser", "Inkjet") 
-- instead of limiting to Brand New / Re-certified / Demo Unit only.

ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_unit_condition_check;
