-- Create all PM users and their profiles
-- Run this in Supabase SQL Editor

-- Drop role constraint if exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

DO $$
DECLARE
  new_uid uuid;
  existing_uid uuid;
BEGIN

  -- 1. Vin Christine Jamin - Product Technical Head
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'vin@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'vin@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'vin@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Vin Christine Jamin', 'product_technical_head', true);
  ELSE
    UPDATE user_profiles SET role = 'product_technical_head', display_name = 'Vin Christine Jamin' WHERE user_id = existing_uid;
  END IF;

  -- 2. Ronwaldo Mariano - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'ron@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'ron@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'ron@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ronwaldo Mariano', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Ronwaldo Mariano' WHERE user_id = existing_uid;
  END IF;

  -- 3. Janmark Erfe - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'janmark@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'janmark@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'janmark@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Janmark Erfe', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Janmark Erfe' WHERE user_id = existing_uid;
  END IF;

  -- 4. Jonjon Galido - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'jonjon@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'jonjon@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'jonjon@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Jonjon Galido', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Jonjon Galido' WHERE user_id = existing_uid;
  END IF;

  -- 5. Albert Malalad - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'albert@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'albert@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'albert@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Albert Malalad', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Albert Malalad' WHERE user_id = existing_uid;
  END IF;

  -- 6. Armando Dimailig - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'armando@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'armando@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'armando@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Armando Dimailig', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Armando Dimailig' WHERE user_id = existing_uid;
  END IF;

  -- 7. Arnulfo Alfiscar - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'arnulfo@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'arnulfo@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'arnulfo@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Arnulfo Alfiscar', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Arnulfo Alfiscar' WHERE user_id = existing_uid;
  END IF;

  -- 8. Francis Amit - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'francis@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'francis@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'francis@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Francis Amit', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Francis Amit' WHERE user_id = existing_uid;
  END IF;

  -- 9. Kimpee Llamado - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'kimpee@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'kimpee@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'kimpee@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Kimpee Llamado', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Kimpee Llamado' WHERE user_id = existing_uid;
  END IF;

  -- 10. Mark Anthony Martin - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'mark@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'mark@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'mark@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Mark Anthony Martin', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Mark Anthony Martin' WHERE user_id = existing_uid;
  END IF;

  -- 11. Ron Jerald Masangcay - Product Development Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'rj@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'rj@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'rj@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ron Jerald Masangcay', 'product_development_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'product_development_manager', display_name = 'Ron Jerald Masangcay' WHERE user_id = existing_uid;
  END IF;

  -- 12. Arnold Rioja - Service Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'arnold@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'arnold@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'arnold@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Arnold Rioja', 'service_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Arnold Rioja' WHERE user_id = existing_uid;
  END IF;

  -- 13. Danilo Carangan - Service Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'dan@esprintmedia.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'dan@esprintmedia.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'dan@esprintmedia.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Danilo Carangan', 'service_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Danilo Carangan' WHERE user_id = existing_uid;
  END IF;

  -- 14. Ricky Eina - Service Manager
  existing_uid := NULL;
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'esprintrickyeina@gmail.com';
  IF existing_uid IS NULL THEN
    new_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'esprintrickyeina@gmail.com', crypt('espmi2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid::text, 'email', 'esprintrickyeina@gmail.com'), 'email', new_uid::text, now(), now());
    INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (new_uid, 'Ricky Eina', 'service_manager', true);
  ELSE
    UPDATE user_profiles SET role = 'service_manager', display_name = 'Ricky Eina' WHERE user_id = existing_uid;
  END IF;

END $$;
