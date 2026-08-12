-- Auto-generated: Seed user accounts from USER-ROLES.xlsx
-- Default password for all: espmi2026 (should be changed on first login)
-- Run AFTER the role expansion migration (20250101000013)

BEGIN;

-- Sales Admin Manager
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'lea@esprintmedia.com', 'sales_admin_manager', true) ON CONFLICT DO NOTHING;

-- Sales Admin Supervisor
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'emma@esprintmedia.com', 'sales_admin_supervisor', true) ON CONFLICT DO NOTHING;

-- Sales Admin Assistants (mapped to sales_admin)
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.ariannesalandanan@gmail.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'liezel@esprintmedia.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'norelyn@esprintmedia.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.ellyn@gmail.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'angel@esprintmedia.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.naryjane@gmail.com', 'sales_admin', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'jane@esprintmedia.com', 'sales_admin', true) ON CONFLICT DO NOTHING;

-- Area Sales Managers
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'angelica@esprintmedia.com', 'area_sales_manager', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'jayson@esprintmedia.com', 'area_sales_manager', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'ness@esprintmedia.com', 'area_sales_manager', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'rona@esprintmedia.com', 'area_sales_manager', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'kim@esprintmedia.com', 'area_sales_manager', true) ON CONFLICT DO NOTHING;

-- Account Executives
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'arlene@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'ronnalyn@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.marvin@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.marielliboon@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.liezel1916@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.rovenie@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'charlene@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'christina@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.rizamaepepito@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'sales05@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.louiesanichole@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.cristene@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.leolopez@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.jennymaebantiwel@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'jomarc@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.kerengracenim@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'quennie@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'marjorie@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.richardtabacon@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.reahglenne@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.angelsastre@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.gretchen@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.rhia@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.miahmae@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.nieljohn@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.joanalayaay@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.sunshine@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.jealssarita@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'eldigrace@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.renvincent@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.elvie@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.lourenzedave@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.maribelnantin@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.rizamei@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.markjed@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'Espii.staniel@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'jocelyn@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'grace@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'nikka@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'rosanna@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'escgi.allen@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.edzlaririt@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.sethgabriel@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.izelvean@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'rubina@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.marygrace@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'christian@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'diannef@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'maryjoy@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.joie@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'escgi.cyrilsalvador@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'jodie@esprintmedia.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.christine@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espmi.allysa@gmail.com', 'account_executive', true) ON CONFLICT DO NOTHING;

-- Sales Assistants
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.sharmaine@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.maricrisloyola@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.roseley@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.lerma@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'espii.kiarakris@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.riccavanessa@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.aprilann@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.christelanne@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'esprint.joralyn@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'aschialexislobos2@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.alonica@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.jane@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;
INSERT INTO user_profiles (user_id, display_name, role, is_active) VALUES (uuid_generate_v4(), 'apsi.stephainejene@gmail.com', 'sales_assistant', true) ON CONFLICT DO NOTHING;

COMMIT;
