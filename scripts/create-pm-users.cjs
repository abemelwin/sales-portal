/**
 * Create Product Manager users from PM USER-ROLES.xlsx
 */
const SUPABASE_URL = "https://njdufjzzjfbbvmsrjgwj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZHVmanp6amZiYnZtc3JqZ3dqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQxMjI5OSwiZXhwIjoyMTAxOTg4Mjk5fQ.SawOLVlu6b3PZ1BVl7-4qGOOkE7BOWWYK-_dBsC2zB4";
const DEFAULT_PASSWORD = 'espmi2026';

const USERS = [
  { email: 'vin@esprintmedia.com', role: 'product_manager' },
  { email: 'ron@esprintmedia.com', role: 'product_manager' },
  { email: 'janmark@esprintmedia.com', role: 'product_manager' },
  { email: 'jonjon@esprintmedia.com', role: 'product_manager' },
  { email: 'albert@esprintmedia.com', role: 'product_manager' },
  { email: 'armando@esprintmedia.com', role: 'product_manager' },
  { email: 'arnulfo@esprintmedia.com', role: 'product_manager' },
  { email: 'francis@esprintmedia.com', role: 'product_manager' },
  { email: 'kimpee@esprintmedia.com', role: 'product_manager' },
  { email: 'mark@esprintmedia.com', role: 'product_manager' },
  { email: 'rj@esprintmedia.com', role: 'product_manager' },
  { email: 'arnold@esprintmedia.com', role: 'product_manager' },
  { email: 'dan@esprintmedia.com', role: 'product_manager' },
  { email: 'esprintrickyeina@gmail.com', role: 'product_manager' },
];

async function createUser(email, role) {
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
  console.log(`Creating ${USERS.length} Product Manager users...\n`);
  let created = 0, failed = 0;

  for (const u of USERS) {
    const uid = await createUser(u.email, u.role);
    if (uid) {
      await createProfile(uid, u.email, u.role);
      created++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone! Created: ${created}, Failed/Skipped: ${failed}`);
  console.log(`Default password for all: ${DEFAULT_PASSWORD}`);
}

main().catch(console.error);
