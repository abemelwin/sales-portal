-- Seed: Update/create user profiles for PM users from the ESPMI roles document
-- Run AFTER creating the auth users in Supabase Dashboard (Authentication > Users > Add User)
-- Each user needs to be created first with their email and a temp password.

-- First, expand the role CHECK constraint to allow new roles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Update existing users' roles, or insert new profiles
-- NOTE: You must create the auth users FIRST in Supabase Dashboard, then get their user_id (UUID)
-- Then run these updates matching on display_name or manually set the user_id.

-- Vin Christine Jamin - Product Technical Head
UPDATE user_profiles SET role = 'product_technical_head', display_name = 'Vin Christine Jamin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'vin@esprintmedia.com');

-- Ronwaldo Mariano - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Ronwaldo Mariano'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'ron@esprintmedia.com');

-- Janmark Erfe - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Janmark Erfe'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'janmark@esprintmedia.com');

-- Jonjon Galido - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Jonjon Galido'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jonjon@esprintmedia.com');

-- Albert Malalad - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Albert Malalad'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'albert@esprintmedia.com');

-- Armando Dimailig - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Armando Dimailig'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'armando@esprintmedia.com');

-- Arnulfo Alfiscar - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Arnulfo Alfiscar'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'arnulfo@esprintmedia.com');

-- Francis Amit - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Francis Amit'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'francis@esprintmedia.com');

-- Kimpee Llamado - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Kimpee Llamado'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'kimpee@esprintmedia.com');

-- Mark Anthony Martin - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Mark Anthony Martin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'mark@esprintmedia.com');

-- Ron Jerald Masangcay - Product Development Manager
UPDATE user_profiles SET role = 'product_manager', display_name = 'Ron Jerald Masangcay'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'rj@esprintmedia.com');

-- Arnold Rioja - Service Manager
UPDATE user_profiles SET role = 'service_manager', display_name = 'Arnold Rioja'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'arnold@esprintmedia.com');

-- Danilo Carangan - Service Manager
UPDATE user_profiles SET role = 'service_manager', display_name = 'Danilo Carangan'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'dan@esprintmedia.com');

-- Ricky Eina - Service Manager
UPDATE user_profiles SET role = 'service_manager', display_name = 'Ricky Eina'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'esprintrickyeina@gmail.com');
