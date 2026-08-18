-- Create all PM users and their profiles in one go
-- Run this in Supabase SQL Editor (it has admin access to auth schema)

-- First, drop role constraint if exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Helper function to create a user + profile
DO $$
DECLARE
  new_uid uuid;
BEGIN
  -- 1. Vin Christine Jamin - Product Technical Head
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'vin@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'vin@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Vin Christine Jamin', 'product_technical_head', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_technical_head', display_name = 'Vin Christine Jamin';
  ELSE
    UPDATE user_profiles SET role = 'product_technical_head', display_name = 'Vin Christine Jamin'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'vin@esprintmedia.com');
  END IF;

  -- 2. Ronwaldo Mariano - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'ron@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'ron@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ronwaldo Mariano', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Ronwaldo Mariano';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Ronwaldo Mariano'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ron@esprintmedia.com');
  END IF;

  -- 3. Janmark Erfe - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'janmark@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'janmark@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Janmark Erfe', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Janmark Erfe';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Janmark Erfe'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'janmark@esprintmedia.com');
  END IF;

  -- 4. Jonjon Galido - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'jonjon@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'jonjon@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Jonjon Galido', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Jonjon Galido';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Jonjon Galido'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jonjon@esprintmedia.com');
  END IF;

  -- 5. Albert Malalad - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'albert@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'albert@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Albert Malalad', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Albert Malalad';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Albert Malalad'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'albert@esprintmedia.com');
  END IF;

  -- 6. Armando Dimailig - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'armando@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'armando@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Armando Dimailig', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Armando Dimailig';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Armando Dimailig'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'armando@esprintmedia.com');
  END IF;

  -- 7. Arnulfo Alfiscar - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'arnulfo@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'arnulfo@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Arnulfo Alfiscar', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Arnulfo Alfiscar';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Arnulfo Alfiscar'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'arnulfo@esprintmedia.com');
  END IF;

  -- 8. Francis Amit - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'francis@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'francis@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Francis Amit', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Francis Amit';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Francis Amit'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'francis@esprintmedia.com');
  END IF;

  -- 9. Kimpee Llamado - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'kimpee@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'kimpee@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Kimpee Llamado', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Kimpee Llamado';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Kimpee Llamado'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kimpee@esprintmedia.com');
  END IF;

  -- 10. Mark Anthony Martin - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'mark@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'mark@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Mark Anthony Martin', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Mark Anthony Martin';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Mark Anthony Martin'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'mark@esprintmedia.com');
  END IF;

  -- 11. Ron Jerald Masangcay - Product Development Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'rj@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'rj@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ron Jerald Masangcay', 'product_development_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'product_development_manager', display_name = 'Ron Jerald Masangcay';
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Ron Jerald Masangcay'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'rj@esprintmedia.com');
  END IF;

  -- 12. Arnold Rioja - Service Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'arnold@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'arnold@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Arnold Rioja', 'service_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'service_manager', display_name = 'Arnold Rioja';
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Arnold Rioja'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'arnold@esprintmedia.com');
  END IF;

  -- 13. Danilo Carangan - Service Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'dan@esprintmedia.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'dan@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Danilo Carangan', 'service_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'service_manager', display_name = 'Danilo Carangan';
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Danilo Carangan'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dan@esprintmedia.com');
  END IF;

  -- 14. Ricky Eina - Service Manager
  new_uid := NULL;
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'esprintrickyeina@gmail.com', crypt('ESPMi2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO new_uid;
  IF new_uid IS NOT NULL THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'esprintrickyeina@gmail.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ricky Eina', 'service_manager', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'service_manager', display_name = 'Ricky Eina';
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Ricky Eina'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'esprintrickyeina@gmail.com');
  END IF;

END $$;
