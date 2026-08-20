/**
 * Bulk create users via Supabase Admin API
 * 
 * Usage: 
 *   Set env vars then run:
 *   SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_KEY=your-service-role-key node scripts/create-users-api.cjs
 */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  console.error('Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/create-users-api.cjs');
  process.exit(1);
}

const DEFAULT_PASSWORD = 'espmi2026';

const USERS = [
  { email: 'emma@esprintmedia.com', role: 'sales_admin_supervisor' },
  { email: 'espmi.ariannesalandanan@gmail.com', role: 'sales_admin_assistant' },
  { email: 'liezel@esprintmedia.com', role: 'sales_admin_assistant' },
  { email: 'norelyn@esprintmedia.com', role: 'sales_admin_assistant' },
  { email: 'apsi.ellyn@gmail.com', role: 'sales_admin_assistant' },
  { email: 'angel@esprintmedia.com', role: 'sales_admin_assistant' },
  { email: 'espii.naryjane@gmail.com', role: 'sales_admin_assistant' },
  { email: 'jane@esprintmedia.com', role: 'sales_admin_assistant' },
  { email: 'angelica@esprintmedia.com', role: 'area_sales_manager' },
  { email: 'jayson@esprintmedia.com', role: 'area_sales_manager' },
  { email: 'ness@esprintmedia.com', role: 'area_sales_manager' },
  { email: 'rona@esprintmedia.com', role: 'area_sales_manager' },
  { email: 'kim@esprintmedia.com', role: 'area_sales_manager' },
  { email: 'arlene@esprintmedia.com', role: 'account_executive' },
  { email: 'ronnalyn@esprintmedia.com', role: 'account_executive' },
  { email: 'esprint.marvin@gmail.com', role: 'account_executive' },
  { email: 'esprint.marielliboon@gmail.com', role: 'account_executive' },
  { email: 'esprint.liezel1916@gmail.com', role: 'account_executive' },
  { email: 'apsi.rovenie@gmail.com', role: 'account_executive' },
  { email: 'charlene@esprintmedia.com', role: 'account_executive' },
  { email: 'christina@esprintmedia.com', role: 'account_executive' },
  { email: 'apsi.rizamaepepito@gmail.com', role: 'account_executive' },
  { email: 'sales05@esprintmedia.com', role: 'account_executive' },
  { email: 'apsi.louiesanichole@gmail.com', role: 'account_executive' },
  { email: 'apsi.cristene@gmail.com', role: 'account_executive' },
  { email: 'apsi.leolopez@gmail.com', role: 'account_executive' },
  { email: 'apsi.jennymaebantiwel@gmail.com', role: 'account_executive' },
  { email: 'jomarc@esprintmedia.com', role: 'account_executive' },
  { email: 'apsi.kerengracenim@gmail.com', role: 'account_executive' },
  { email: 'quennie@esprintmedia.com', role: 'account_executive' },
  { email: 'marjorie@esprintmedia.com', role: 'account_executive' },
  { email: 'espii.richardtabacon@gmail.com', role: 'account_executive' },
  { email: 'espii.reahglenne@gmail.com', role: 'account_executive' },
  { email: 'espii.angelsastre@gmail.com', role: 'account_executive' },
  { email: 'espii.gretchen@gmail.com', role: 'account_executive' },
  { email: 'espii.rhia@gmail.com', role: 'account_executive' },
  { email: 'espii.miahmae@gmail.com', role: 'account_executive' },
  { email: 'espii.nieljohn@gmail.com', role: 'account_executive' },
  { email: 'espii.joanalayaay@gmail.com', role: 'account_executive' },
  { email: 'espii.sunshine@gmail.com', role: 'account_executive' },
  { email: 'espii.jealssarita@gmail.com', role: 'account_executive' },
  { email: 'eldigrace@esprintmedia.com', role: 'account_executive' },
  { email: 'esprint.renvincent@gmail.com', role: 'account_executive' },
  { email: 'espii.elvie@gmail.com', role: 'account_executive' },
  { email: 'espii.lourenzedave@gmail.com', role: 'account_executive' },
  { email: 'espii.maribelnantin@gmail.com', role: 'account_executive' },
  { email: 'espii.rizamei@gmail.com', role: 'account_executive' },
  { email: 'esprint.markjed@gmail.com', role: 'account_executive' },
  { email: 'Espii.staniel@gmail.com', role: 'account_executive' },
  { email: 'jocelyn@esprintmedia.com', role: 'account_executive' },
  { email: 'grace@esprintmedia.com', role: 'account_executive' },
  { email: 'nikka@esprintmedia.com', role: 'account_executive' },
  { email: 'rosanna@esprintmedia.com', role: 'account_executive' },
  { email: 'escgi.allen@gmail.com', role: 'account_executive' },
  { email: 'espmi.edzlaririt@gmail.com', role: 'account_executive' },
  { email: 'espmi.sethgabriel@gmail.com', role: 'account_executive' },
  { email: 'espmi.izelvean@gmail.com', role: 'account_executive' },
  { email: 'rubina@esprintmedia.com', role: 'account_executive' },
  { email: 'espmi.marygrace@gmail.com', role: 'account_executive' },
  { email: 'christian@esprintmedia.com', role: 'account_executive' },
  { email: 'diannef@esprintmedia.com', role: 'account_executive' },
  { email: 'maryjoy@esprintmedia.com', role: 'account_executive' },
  { email: 'espmi.joie@gmail.com', role: 'account_executive' },
  { email: 'escgi.cyrilsalvador@gmail.com', role: 'account_executive' },
  { email: 'jodie@esprintmedia.com', role: 'account_executive' },
  { email: 'espmi.christine@gmail.com', role: 'account_executive' },
  { email: 'espmi.allysa@gmail.com', role: 'account_executive' },
  { email: 'espii.sharmaine@gmail.com', role: 'sales_assistant' },
  { email: 'espii.maricrisloyola@gmail.com', role: 'sales_assistant' },
  { email: 'espii.roseley@gmail.com', role: 'sales_assistant' },
  { email: 'esprint.lerma@gmail.com', role: 'sales_assistant' },
  { email: 'espii.kiarakris@gmail.com', role: 'sales_assistant' },
  { email: 'apsi.riccavanessa@gmail.com', role: 'sales_assistant' },
  { email: 'esprint.aprilann@gmail.com', role: 'sales_assistant' },
  { email: 'apsi.christelanne@gmail.com', role: 'sales_assistant' },
  { email: 'esprint.joralyn@gmail.com', role: 'sales_assistant' },
  { email: 'aschialexislobos2@gmail.com', role: 'sales_assistant' },
  { email: 'apsi.alonica@gmail.com', role: 'sales_assistant' },
  { email: 'apsi.jane@gmail.com', role: 'sales_assistant' },
  { email: 'apsi.stephainejene@gmail.com', role: 'sales_assistant' },
];

async function createUser(email, role) {
  // 1. Create auth user via Admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.msg && data.msg.includes('already been registered')) {
      console.log(`  SKIP (exists): ${email}`);
      // Get existing user ID
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
      });
      const listData = await listRes.json();
      const user = (listData.users || []).find(u => u.email === email);
      if (user) return user.id;
      return null;
    }
    console.error(`  FAIL: ${email} - ${JSON.stringify(data)}`);
    return null;
  }

  console.log(`  OK: ${email} (${data.id})`);
  return data.id;
}

async function createProfile(userId, email, role) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      display_name: email,
      role,
      is_active: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  PROFILE FAIL: ${email} - ${err}`);
  }
}

async function main() {
  console.log(`Creating ${USERS.length} users...\n`);
  let created = 0, skipped = 0, failed = 0;

  for (const u of USERS) {
    const uid = await createUser(u.email, u.role);
    if (uid) {
      await createProfile(uid, u.email, u.role);
      created++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone! Created: ${created}, Failed: ${failed}`);
  console.log(`Default password for all: ${DEFAULT_PASSWORD}`);
}

main().catch(console.error);
