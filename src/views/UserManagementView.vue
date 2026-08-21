<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useModal } from '@/composables/useModal'
import type { Role, User } from '@/types'

defineOptions({
  name: 'UserManagementView',
})

const userStore = useUserStore()
const authStore = useAuthStore()
const modal = useModal()

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

// --- Search & Filter State ---
const searchQuery = ref('')
const roleFilter = ref('')

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const r = roleFilter.value

  return userStore.users.filter((user) => {
    if (r && user.role !== r) return false
    if (!q) return true
    const email = (user.email || '').toLowerCase()
    const dispName = (user.display_name || '').toLowerCase()
    const knownName = (getUserDisplayName(user) || '').toLowerCase()
    return email.includes(q) || dispName.includes(q) || knownName.includes(q)
  })
})

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

// --- Edit Access State ---
const editingUserId = ref<string | null>(null)
const userPermsForm = reactive({
  create_quotes: false,
  use_calculator: true,
  manage_product_files: false,
  edit_machine_catalog: false,
  upload_machine_catalog: false,
  manage_users: false,
  manage_roles_access: false,
})
const savePermsMsg = ref('')

function openEditAccess(user: User) {
  editingUserId.value = user.user_id
  savePermsMsg.value = ''

  const role = user.role
  const isSales = ['superadmin', 'sales_admin_manager', 'sales_admin_supervisor', 'sales_admin_assistant', 'area_sales_manager', 'account_executive', 'sales_assistant'].includes(role)
  const isProductTech = ['product_technical_head', 'product_development_manager', 'service_manager'].includes(role)
  const isSalesAdminMgr = ['sales_admin_manager', 'sales_admin_supervisor', 'area_sales_manager'].includes(role)

  userPermsForm.create_quotes = user.create_quotes ?? isSales
  userPermsForm.use_calculator = user.use_calculator ?? true
  userPermsForm.manage_product_files = user.manage_product_files ?? (isSales || isProductTech)
  userPermsForm.edit_machine_catalog = user.edit_machine_catalog ?? (isSales || isProductTech)
  userPermsForm.upload_machine_catalog = user.upload_machine_catalog ?? (isProductTech || isSalesAdminMgr)
  userPermsForm.manage_users = user.manage_users ?? isSalesAdminMgr
  userPermsForm.manage_roles_access = user.manage_roles_access ?? isSalesAdminMgr
}

function closeEditAccess() {
  editingUserId.value = null
  savePermsMsg.value = ''
}

async function saveUserAccess(userId: string) {
  savePermsMsg.value = ''
  const res = await userStore.updateUserPermissions(userId, { ...userPermsForm })
  if (res.success) {
    savePermsMsg.value = 'Access saved successfully!'
    setTimeout(() => {
      editingUserId.value = null
      savePermsMsg.value = ''
    }, 1200)
  } else {
    alert(res.error || 'Failed to save access permissions.')
  }
}

// --- Reset Password ---
const resetTarget = ref<User | null>(null)
const resetNewPassword = ref('')
const resetConfirm = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

function openReset(user: User) {
  resetTarget.value = user
  resetNewPassword.value = ''
  resetConfirm.value = ''
  resetError.value = ''
  resetSuccess.value = ''
}

function closeReset() {
  resetTarget.value = null
}

async function submitReset() {
  resetError.value = ''
  resetSuccess.value = ''
  if (resetNewPassword.value.length < 6) {
    resetError.value = 'Password must be at least 6 characters.'
    return
  }
  if (resetNewPassword.value !== resetConfirm.value) {
    resetError.value = 'Passwords do not match.'
    return
  }
  resetLoading.value = true
  const result = await userStore.resetPassword(resetTarget.value!.user_id, resetNewPassword.value)
  resetLoading.value = false
  if (result.success) {
    resetSuccess.value = 'Password reset successfully.'
    resetNewPassword.value = ''
    resetConfirm.value = ''
  } else {
    resetError.value = result.error || 'Failed to reset password.'
  }
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
  const ok = await modal.confirm({
    title: 'Delete User',
    message: `Are you sure you want to delete user "${user.display_name}"?`,
    confirmText: 'Delete User',
    cancelText: 'Cancel',
    isDanger: true,
  })
  if (!ok) return
  const result = await userStore.deleteUserPermanent(user.user_id)
  if (!result.success) {
    alert(result.error || 'Failed to delete user.')
  }
}

// --- Lifecycle ---
onMounted(() => {
  userStore.fetchUsers()
  userStore.subscribeToRealtime()
})
</script>

<template>
  <div class="um-view">
    <div class="um-content">
      <div class="um-top">
        <h2>User & Access Management</h2>
        <div class="um-note">
          Manage system users and configure custom access permissions per individual user. Click <strong>Edit Access</strong> on any user row to customize capabilities.
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

      <!-- Search & Filter Bar -->
      <div class="um-filter-bar">
        <div class="um-search-box">
          <span class="search-icon">&#128269;</span>
          <input
            v-model="searchQuery"
            type="text"
            class="um-search-input"
            placeholder="Search by name or email..."
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">&times;</button>
        </div>

        <select v-model="roleFilter" class="um-filter-select">
          <option value="">All Roles</option>
          <option v-for="r in ROLES" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>

        <div class="um-count">
          Showing <strong>{{ filteredUsers.length }}</strong> of {{ userStore.users.length }} users
        </div>
      </div>

      <!-- Loading -->
      <div v-if="userStore.loading && !userStore.users.length" class="um-loading">
        Loading users...
      </div>

      <!-- User Table -->
      <div v-else class="um-table-wrap">
        <table class="um-table">
        <thead>
          <tr>
            <th class="col-user">Username</th>
            <th class="col-role">Role</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="user in filteredUsers" :key="user.id">
            <tr>
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
                <button class="um-btn2 um-access" @click="openEditAccess(user)">Edit Access</button>
                <button class="um-btn2" @click="openReset(user)">Reset</button>
                <button class="um-btn2 um-del" @click="deleteUser(user)">Delete</button>
              </td>
            </tr>

            <!-- Expandable Edit Access Panel -->
            <tr v-if="editingUserId === user.user_id" class="access-editor-row">
              <td colspan="3">
                <div class="access-editor-panel">
                  <div class="access-editor-header">
                    <strong>Customize Individual Access Permissions &mdash; {{ getUserDisplayName(user) || user.email }}</strong>
                    <span v-if="savePermsMsg" class="save-perms-success">{{ savePermsMsg }}</span>
                  </div>
                  <div class="access-grid">
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.create_quotes" :disabled="user.role === 'superadmin'" />
                      Create Quotes
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.use_calculator" :disabled="user.role === 'superadmin'" />
                      Financial Calculator
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.manage_product_files" :disabled="user.role === 'superadmin'" />
                      Manage Product Files
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.edit_machine_catalog" :disabled="user.role === 'superadmin'" />
                      Edit Machine Catalog
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.upload_machine_catalog" :disabled="user.role === 'superadmin'" />
                      Upload Machine Catalog
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.manage_users" :disabled="user.role === 'superadmin'" />
                      Manage Users
                    </label>
                    <label class="access-checkbox-label">
                      <input type="checkbox" v-model="userPermsForm.manage_roles_access" :disabled="user.role === 'superadmin'" />
                      Manage Access
                    </label>
                  </div>
                  <div class="access-actions">
                    <button class="um-btn-add" @click="saveUserAccess(user.user_id)">Save Access</button>
                    <button class="um-btn2 um-del" @click="closeEditAccess">Cancel</button>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="3" class="um-empty-row">No users found matching your search.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

  <!-- ─── Reset Password Modal ─── -->
  <div v-if="resetTarget" class="um-modal-overlay" @click.self="closeReset">
    <div class="um-modal">
      <div class="um-modal-head">
        <h3>Reset Password</h3>
        <button class="um-modal-close" @click="closeReset">&times;</button>
      </div>
      <div class="um-modal-body">
        <p class="um-modal-user">
          {{ resetTarget.email || resetTarget.display_name }}
          <span v-if="resetTarget.display_name && resetTarget.display_name !== resetTarget.email" class="um-modal-subname">{{ resetTarget.display_name }}</span>
        </p>

        <div class="um-modal-field">
          <label>New Password</label>
          <input
            v-model="resetNewPassword"
            type="password"
            class="um-input"
            placeholder="Min 6 characters"
            :disabled="resetLoading"
          />
        </div>
        <div class="um-modal-field">
          <label>Confirm Password</label>
          <input
            v-model="resetConfirm"
            type="password"
            class="um-input"
            placeholder="Re-enter password"
            :disabled="resetLoading"
            @keyup.enter="submitReset"
          />
        </div>

        <div v-if="resetError" class="um-modal-error">{{ resetError }}</div>
        <div v-if="resetSuccess" class="um-modal-success">{{ resetSuccess }}</div>
      </div>
      <div class="um-modal-foot">
        <button class="um-btn-cancel" @click="closeReset" :disabled="resetLoading">Cancel</button>
        <button class="um-btn-reset" @click="submitReset" :disabled="resetLoading || !resetNewPassword || !resetConfirm">
          <span v-if="resetLoading" class="um-spinner"></span>
          {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </div>
    </div>
  </div>

  </div>
</template>

<style scoped>
.um-view {
  min-height: calc(100vh - 40px);
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
  max-width: 840px;
  line-height: 1.5;
}

.um-content {
  max-width: 840px;
  margin: 0 auto;
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
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  max-width: 180px;
  width: 100%;
}

.um-select {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  max-width: 180px;
  width: 100%;
}

.um-btn-add {
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-height: 38px;
}

.um-btn-add:hover {
  background: #1b5e20;
}

/* --- Search & Filter Bar --- */
.um-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  background: #fff;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-wrap: wrap;
}

.um-search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 13px;
  color: #888;
}

.um-search-input {
  width: 100%;
  padding: 6px 28px 6px 28px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}

.clear-search-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
}

.clear-search-btn:hover {
  color: #333;
}

.um-filter-select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  min-width: 160px;
}

.um-count {
  font-size: 11px;
  color: #666;
  margin-left: auto;
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
.um-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.um-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 540px;
}

.um-table thead {
  background: #8b1a1a;
  color: #fff;
}

.um-table th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
}

.um-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.um-table tbody tr:hover {
  background: #f5f5f5;
}

.um-empty-row {
  text-align: center;
  color: #888;
  padding: 20px !important;
  font-style: italic;
}

.col-user {
  width: 32%;
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
  width: 28%;
}

.col-actions {
  width: 40%;
  white-space: nowrap;
}

/* --- Role dropdown in table --- */
.um-role-select {
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  min-width: 140px;
  background: #fff;
}

/* --- Action Buttons --- */
.um-btn2 {
  padding: 5px 10px;
  border: 1px solid #777;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 11px;
  cursor: pointer;
  margin-right: 5px;
  min-height: 32px;
}

.um-btn2:hover {
  background: #f0f0f0;
}

.um-access {
  border-color: #8b1a1a;
  color: #8b1a1a;
  font-weight: 600;
}

.um-access:hover {
  background: #fbe9e7;
}

.um-del {
  border-color: #d32f2f;
  color: #d32f2f;
}

.um-del:hover {
  background: #ffebee;
}

/* --- Access Editor Panel --- */
.access-editor-row td {
  background: #fff8f8;
  padding: 12px 16px;
  border-bottom: 2px solid #8b1a1a;
}

.access-editor-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.access-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8b1a1a;
  flex-wrap: wrap;
  gap: 6px;
}

.save-perms-success {
  color: #2e7d32;
  font-weight: 600;
  font-size: 12px;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
  background: #fff;
  padding: 10px 14px;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
}

.access-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  user-select: none;
  min-height: 36px;
}

.access-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #8b1a1a;
}

.access-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* Mobile Responsive */
@media screen and (max-width: 768px) {
  .um-view {
    padding: 12px;
  }

  .um-add {
    flex-direction: column;
    align-items: stretch;
  }

  .um-input,
  .um-select {
    max-width: 100%;
    font-size: 16px;
    padding: 8px;
  }

  .um-btn-add {
    width: 100%;
  }

  .um-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .um-search-box {
    min-width: 100%;
  }

  .um-search-input {
    font-size: 16px;
    padding: 8px 30px;
  }

  .um-filter-select {
    width: 100%;
    font-size: 16px;
    padding: 8px;
  }

  .um-count {
    margin-left: 0;
    text-align: right;
  }

  .access-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Reset Password Modal ─── */
.um-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.um-modal {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.um-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.um-modal-head h3 {
  margin: 0;
  font-size: 16px;
  color: #c0392b;
  font-weight: 700;
}

.um-modal-close {
  background: none;
  border: none;
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.um-modal-close:hover { color: #333; }

.um-modal-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.um-modal-user {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111;
}

.um-modal-subname {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: #999;
  margin-top: 2px;
}

.um-modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.um-modal-field label {
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.um-modal-error {
  font-size: 12px;
  color: #c0392b;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 5px;
  padding: 8px 10px;
}

.um-modal-success {
  font-size: 12px;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 5px;
  padding: 8px 10px;
}

.um-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #eee;
}

.um-btn-cancel {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.um-btn-cancel:hover { background: #eee; }

.um-btn-reset {
  padding: 8px 18px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.um-btn-reset:hover:not(:disabled) { background: #a93226; }
.um-btn-reset:disabled { opacity: 0.6; cursor: not-allowed; }

.um-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin-reset 0.6s linear infinite;
}

@keyframes spin-reset {
  to { transform: rotate(360deg); }
}
</style>
