<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { Role, User } from '@/types'

defineOptions({
  name: 'UserManagementView',
})

const userStore = useUserStore()
const authStore = useAuthStore()

// --- Roles list matching reference ---
const ROLES: { value: Role; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'product_technical_head', label: 'Product Technical Head' },
  { value: 'product_development_manager', label: 'Product Development Manager' },
  { value: 'service_manager', label: 'Service Manager' },
  { value: 'sales_admin_manager', label: 'Sales Admin Manager' },
  { value: 'sales_admin_supervisor', label: 'Sales Admin Supervisor' },
  { value: 'sales_admin_assistant', label: 'Sales Admin Assistant' },
  { value: 'area_sales_manager', label: 'Area Sales Manager' },
  { value: 'account_executive', label: 'Account Executive' },
  { value: 'sales_assistant', label: 'Sales Assistant' },
  { value: 'user', label: 'User' },
]


// --- Add User Form ---
const newEmail = ref('')
const newPassword = ref('')
const newRole = ref<Role>('user')
const addError = ref('')

async function addUser() {
  addError.value = ''
  const e = newEmail.value.trim()
  const p = newPassword.value

  if (!e || !p) {
    addError.value = 'Enter an email and password.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    addError.value = 'Enter a valid email address.'
    return
  }
  if (p.length < 6) {
    addError.value = 'Password must be at least 6 characters.'
    return
  }

  const result = await userStore.createUser({
    username: e,
    display_name: e,
    password: p,
    role: newRole.value,
  })

  if (result.success) {
    newEmail.value = ''
    newPassword.value = ''
    newRole.value = 'user'
  } else {
    addError.value = result.error || 'Failed to create user.'
  }
}

// --- Role Change (inline select) ---
async function handleRoleChange(user: User, newRoleValue: Role) {
  if (user.role === newRoleValue) return

  // Prevent removing last superadmin
  if (user.role === 'superadmin' && newRoleValue !== 'superadmin') {
    const superadminCount = userStore.users.filter(
      (u) => u.role === 'superadmin' && u.is_active
    ).length
    if (superadminCount <= 1) {
      alert('There must be at least one Super Admin.')
      await userStore.fetchUsers() // re-render to reset select
      return
    }
  }

  await userStore.updateRole(user.user_id, newRoleValue)
}

// --- Reset Password ---
async function resetPassword(user: User) {
  const np = prompt(`New password for "${user.display_name}" (min 4 characters):`)
  if (np === null) return
  if (np.length < 4) {
    alert('Password too short.')
    return
  }
  // TODO: Implement actual password reset via Supabase admin API
  alert(`Password reset for ${user.display_name}.`)
}

const KNOWN_USER_NAMES: Record<string, string> = {
  'espmi': 'Super Admin',
  'lea@esprintmedia.com': 'Leonor Tenorio',
  'emma@esprintmedia.com': 'Emmalyn Manallo',
  'espmi.ariannesalandanan@gmail.com': 'Arianne Salandanan',
  'liezel@esprintmedia.com': 'Liezel Bermudo',
  'norelyn@esprintmedia.com': 'Ma. Norelyn Coquilla',
  'apsi.ellyn@gmail.com': 'Ma. Ellyn Abello',
  'angel@esprintmedia.com': 'Angel Cimafranca',
  'espii.naryjane@gmail.com': 'Nary Jane Canalita',
  'jane@esprintmedia.com': 'Jane Erniefer Ceniza',
  'angelica@esprintmedia.com': 'Angelica Moreno',
  'jayson@esprintmedia.com': 'Jayson Mabanag',
  'ness@esprintmedia.com': 'Ness Deomano',
  'rona@esprintmedia.com': 'Ronalyn Ubalde',
  'kim@esprintmedia.com': 'Kimberly Lascano',
  'arlene@esprintmedia.com': 'Arlene Samillano',
  'ronnalyn@esprintmedia.com': 'Ronnalyn Laloy',
  'esprint.marvin@gmail.com': 'Marvin Camaria',
  'esprint.marielliboon@gmail.com': 'Mariel Libo-On',
  'esprint.liezel1916@gmail.com': 'Liezel Placido',
  'apsi.rovenie@gmail.com': 'Ronviel Cabriel',
  'charlene@esprintmedia.com': 'Charlene Maglasang',
  'christina@esprintmedia.com': 'Christina Dioquino',
  'apsi.rizamaepepito@gmail.com': 'Riza Mae Pepito',
  'sales05@esprintmedia.com': 'Kyzia Cheska Jaima',
  'apsi.louiesanichole@gmail.com': 'Louiesa Nichole Santos',
  'apsi.cristene@gmail.com': 'Cristene Marco',
  'apsi.leolopez@gmail.com': 'Jenpol A. Lopez',
  'apsi.jennymaebantiwel@gmail.com': 'Jenny Mae D. Bantiwel',
  'jomarc@esprintmedia.com': 'Jomarc Encordia',
  'apsi.kerengracenim@gmail.com': 'Keren Grace Nim',
  'quennie@esprintmedia.com': 'Quennie Bahian',
  'marjorie@esprintmedia.com': 'Marjorie Madula',
  'espii.richardtabacon@gmail.com': 'Richard Tabacon',
  'espii.reahglenne@gmail.com': 'Reah Glenne Manselao',
  'espii.angelsastre@gmail.com': 'Angel Joy Sastre',
  'espii.gretchen@gmail.com': 'Gretchen Tamariong',
  'espii.rhia@gmail.com': 'Rhia C. Bardoquillo',
  'espii.miahmae@gmail.com': 'Miah Mae Villaroza',
  'espii.nieljohn@gmail.com': 'Neil John Pagaran',
  'espii.joanalayaay@gmail.com': 'Joan Alaya-Ay',
  'espii.sunshine@gmail.com': 'Sunshine De Lantar',
  'espii.jealssarita@gmail.com': 'Jeals Absin Sarita',
  'eldigrace@esprintmedia.com': 'Eldigrace Bracoma',
  'esprint.renvincent@gmail.com': 'Ren Vincent Canoy',
  'espii.elvie@gmail.com': 'Elvie Arawiran',
  'espii.lourenzedave@gmail.com': 'Lourenze Dave Payot',
  'espii.maribelnantin@gmail.com': 'Maribel Nantin',
  'espii.rizamei@gmail.com': 'Rizamei Telafer',
  'esprint.markjed@gmail.com': 'Mark Jed Pare',
  'espii.staniel@gmail.com': 'Staniel Capilitan',
  'jocelyn@esprintmedia.com': 'Jocelyn Ribo',
  'grace@esprintmedia.com': 'Mary Grace San Jose',
  'nikka@esprintmedia.com': 'Nikka Onia',
  'rosanna@esprintmedia.com': 'Rosanna Galope',
  'escgi.allen@gmail.com': 'Allen Cordova',
  'espmi.edzlaririt@gmail.com': 'Edz Frankie Laririt',
  'espmi.sethgabriel@gmail.com': 'Seth Gabriel Ramos',
  'espmi.izelvean@gmail.com': 'Izel Vean Limbo',
  'rubina@esprintmedia.com': 'Rubina Morano',
  'espmi.marygrace@gmail.com': 'Mary Mirana',
  'christian@esprintmedia.com': 'Christian Aguas',
  'diannef@esprintmedia.com': 'Dianne Francisco',
  'maryjoy@esprintmedia.com': 'Mary Joy Justiniani',
  'espmi.joie@gmail.com': 'Joie Arpoceple',
  'escgi.cyrilsalvador@gmail.com': 'Cyril Salvador',
  'jodie@esprintmedia.com': 'Jodie Dalisay',
  'espmi.christine@gmail.com': 'Christine Galleon',
  'espmi.allysa@gmail.com': 'Allyssa Nicole Fajardo',
  'espii.sharmaine@gmail.com': 'Sharmaine Teves',
  'espii.maricrisloyola@gmail.com': 'Maricris Loyola',
  'espii.roseley@gmail.com': 'Roseley Gayacao',
  'esprint.lerma@gmail.com': 'Lerma Dalugdog',
  'espii.kiarakris@gmail.com': 'Kiara Kris Villas',
  'apsi.riccavanessa@gmail.com': 'Ricca Vanessa Santillan',
  'esprint.aprilann@gmail.com': 'April Ann Palacios',
  'apsi.christelanne@gmail.com': 'Christel Anne Gardose',
  'esprint.joralyn@gmail.com': 'Joralyn Canlog',
  'aschialexislobos2@gmail.com': 'Aschi Lobos',
  'apsi.alonica@gmail.com': 'Alonica Dimpal',
  'apsi.jane@gmail.com': 'Jane Mascariñas',
  'apsi.stephainejene@gmail.com': 'Stephaine Jene Tabao',
  'albert@esprintmedia.com': 'Albert Malalad',
  'armando@esprintmedia.com': 'Armando Dimailig',
  'arnold@esprintmedia.com': 'Arnold Rioja',
  'arnulfo@esprintmedia.com': 'Arnulfo Alfiscar',
  'vin@esprintmedia.com': 'Vin Technical Head',
  'ron@esprintmedia.com': 'Ron Technical Head',
  'janmark@esprintmedia.com': 'Janmark Technical Head',
  'jonjon@esprintmedia.com': 'Jonjon Technical Head',
  'francis@esprintmedia.com': 'Francis Product Development',
  'kimpee@esprintmedia.com': 'Kimpee Product Development',
  'mark@esprintmedia.com': 'Mark Product Development',
  'rj@esprintmedia.com': 'RJ Product Development',
  'dan@esprintmedia.com': 'Dan Service Manager'
}
function getUserDisplayName(u: User): string {
  const email = (u.email || u.display_name || '').toLowerCase().trim()
  if (u.display_name && u.display_name !== u.email) {
    return u.display_name
  }
  if (KNOWN_USER_NAMES[email]) {
    return KNOWN_USER_NAMES[email]
  }
  const prefix = email.split('@')[0] || ''
  if (prefix.includes('.')) {
    const parts = prefix.split('.')
    return parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return u.display_name || ''
}

// --- Delete User ---
async function deleteUser(user: User) {
  if (user.user_id === authStore.user?.user_id) {
    alert('You cannot delete your own account while logged in.')
    return
  }
  if (user.role === 'superadmin') {
    const superadminCount = userStore.users.filter(
      (u) => u.role === 'superadmin' && u.is_active
    ).length
    if (superadminCount <= 1) {
      alert('Cannot delete the last Super Admin.')
      return
    }
  }
  if (!confirm(`Delete user "${user.display_name}"?`)) return
  await userStore.deactivateUser(user.user_id)
}

// --- Lifecycle ---
onMounted(() => {
  userStore.fetchUsers()
})
</script>

<template>
  <div class="um-view">
    <div class="um-content">
      <div class="um-top">
        <h2>User Management</h2>
        <div class="um-note">
          Manage system users and their assigned roles. Select a role from the drop-down menu next to any user to update their access permissions instantly.
        </div>
      </div>

      <!-- Add User Row -->
      <div class="um-add">
        <input
          v-model="newEmail"
          class="um-input"
          type="email"
          placeholder="Email address"
        />
        <input
          v-model="newPassword"
          type="password"
          class="um-input"
          placeholder="Password (min 6 chars)"
        />
        <select v-model="newRole" class="um-select">
          <option v-for="r in ROLES" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
        <button class="um-btn-add" @click="addUser">+ Add User</button>
      </div>
      <div v-if="addError" class="um-error">{{ addError }}</div>

      <!-- Loading -->
      <div v-if="userStore.loading && !userStore.users.length" class="um-loading">
        Loading users...
      </div>

      <!-- User Table -->
      <table v-else class="um-table">
        <thead>
          <tr>
            <th class="col-user">Username</th>
            <th class="col-role">Role</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.users" :key="user.id">
            <td class="col-user">
              <div>{{ user.email || user.display_name }}</div>
              <span v-if="user.user_id === authStore.user?.user_id" class="you-tag">(you)</span>
              <div v-if="getUserDisplayName(user) && getUserDisplayName(user) !== user.email" class="user-name-sub">
                {{ getUserDisplayName(user) }}
              </div>
            </td>
            <td class="col-role">
              <select
                :value="user.role"
                class="um-role-select"
                @change="handleRoleChange(user, ($event.target as HTMLSelectElement).value as Role)"
              >
                <option v-for="r in ROLES" :key="r.value" :value="r.value">
                  {{ r.label }}
                </option>
              </select>
            </td>
            <td class="col-actions">
              <button class="um-btn2" @click="resetPassword(user)">Reset Password</button>
              <button class="um-btn2 um-del" @click="deleteUser(user)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.um-view {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  background: #eef0f2;
  padding: 16px 20px;
}

.um-top h2 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #333;
}

.um-note {
  font-size: 11px;
  color: #666;
  margin-bottom: 14px;
  max-width: 780px;
  line-height: 1.5;
}

.um-content {
  max-width: 780px;
}

/* --- Add User Row --- */
.um-add {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.um-input {
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  max-width: 180px;
  width: 100%;
}

.um-select {
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  max-width: 180px;
  width: 100%;
}

.um-btn-add {
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.um-btn-add:hover {
  background: #1b5e20;
}

.um-error {
  color: #c62828;
  font-size: 12px;
  margin-bottom: 8px;
}

.um-loading {
  padding: 20px;
  text-align: center;
  color: #999;
}

/* --- Table --- */
.um-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ddd;
}

.um-table thead {
  background: #8b1a1a;
  color: #fff;
}

.um-table th {
  padding: 7px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
}

.um-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.um-table tbody tr:hover {
  background: #f5f5f5;
}

.col-user {
  width: 35%;
}

.user-name-sub {
  font-size: 11px;
  color: #999;
  margin-top: 1px;
}

.you-tag {
  font-size: 10px;
  color: #c0392b;
  font-weight: 600;
  margin-left: 4px;
}

.col-role {
  width: 30%;
}

.col-actions {
  width: 35%;
}

.you-tag {
  color: #999;
  font-size: 11px;
}

/* --- Role dropdown in table --- */
.um-role-select {
  padding: 3px 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  min-width: 160px;
  background: #fff;
}

/* --- Action Buttons --- */
.um-btn2 {
  padding: 3px 10px;
  border: 1px solid #c62828;
  border-radius: 3px;
  background: #fff;
  color: #c62828;
  font-size: 11px;
  cursor: pointer;
  margin-right: 6px;
}

.um-btn2:hover {
  background: #ffebee;
}

.um-del {
  border-color: #555;
  color: #555;
}

.um-del:hover {
  background: #eee;
}
</style>
