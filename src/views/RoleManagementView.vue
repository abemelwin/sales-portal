<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

interface RolePermission {
  role: string
  manageProductFiles: boolean
  editMachineCatalog: boolean
  uploadMachineCatalog: boolean
  uploadConsumablesPricelist: boolean
  manageUsers: boolean
  manageRolesAccess: boolean
  isLocked?: boolean
  highlight?: boolean
}

const STORAGE_KEY = 'espmi_roles_access'

const defaultRoles: RolePermission[] = [
  { role: 'Super Admin', manageProductFiles: true, editMachineCatalog: true, uploadMachineCatalog: true, uploadConsumablesPricelist: true, manageUsers: true, manageRolesAccess: true, isLocked: true },
  { role: 'Product Manager', manageProductFiles: true, editMachineCatalog: true, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
  { role: 'Sales Admin Manager', manageProductFiles: false, editMachineCatalog: true, uploadMachineCatalog: true, uploadConsumablesPricelist: true, manageUsers: false, manageRolesAccess: false, highlight: true },
  { role: 'Sales Admin Supervisor', manageProductFiles: false, editMachineCatalog: true, uploadMachineCatalog: true, uploadConsumablesPricelist: true, manageUsers: false, manageRolesAccess: false },
  { role: 'Sales Admin Assistant', manageProductFiles: false, editMachineCatalog: false, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
  { role: 'Area Sales Manager', manageProductFiles: false, editMachineCatalog: false, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
  { role: 'Account Executive', manageProductFiles: false, editMachineCatalog: false, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
  { role: 'Sales Assistant', manageProductFiles: false, editMachineCatalog: false, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
  { role: 'User', manageProductFiles: false, editMachineCatalog: false, uploadMachineCatalog: false, uploadConsumablesPricelist: false, manageUsers: false, manageRolesAccess: false },
]

const roles = reactive<RolePermission[]>(JSON.parse(JSON.stringify(defaultRoles)))
const saved = ref(false)

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: RolePermission[] = JSON.parse(stored)
      // Merge stored values back, preserving isLocked and highlight flags from defaults
      parsed.forEach((storedRole) => {
        const idx = roles.findIndex(r => r.role === storedRole.role)
        if (idx !== -1 && !roles[idx]!.isLocked) {
          roles[idx]!.manageProductFiles = storedRole.manageProductFiles
          roles[idx]!.editMachineCatalog = storedRole.editMachineCatalog
          roles[idx]!.uploadMachineCatalog = storedRole.uploadMachineCatalog
          roles[idx]!.uploadConsumablesPricelist = storedRole.uploadConsumablesPricelist
          roles[idx]!.manageUsers = storedRole.manageUsers
          roles[idx]!.manageRolesAccess = storedRole.manageRolesAccess
        }
      })
    }
  } catch { /* ignore parse errors */ }
})

function saveAccess() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<template>
  <div class="roles-view">
    <div class="roles-header">
      <div>
        <h1>Roles &amp; Access</h1>
        <p class="roles-note">
          Tick which capabilities each role can use.
          <strong>Super Admin</strong> always has full access and can't be changed.
          Changes save in this browser and apply immediately.
        </p>
      </div>
      <button class="save-btn" @click="saveAccess">
        <span v-if="saved">✓ Saved!</span>
        <span v-else>💾 Save Access</span>
      </button>
    </div>

    <div class="table-wrap">
      <table class="roles-table" aria-label="Roles and permissions">
        <thead>
          <tr>
            <th class="col-role">Role</th>
            <th>Manage Product Files</th>
            <th>Edit Machine Catalog</th>
            <th>Upload Machine Catalog</th>
            <th>Upload Consumables Pricelist</th>
            <th>Manage Users</th>
            <th>Manage Roles &amp; Access</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(r, idx) in roles"
            :key="r.role"
            :class="{ 'row-band': idx % 2 === 0, 'row-highlight': r.highlight }"
          >
            <td class="col-role">
              <span :class="{ 'role-super': r.isLocked }">{{ r.role }}</span>
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manageProductFiles" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.editMachineCatalog" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.uploadMachineCatalog" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.uploadConsumablesPricelist" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manageUsers" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manageRolesAccess" :disabled="r.isLocked" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.roles-view {
  padding: 16px 20px;
  background: #eef0f2;
  min-height: calc(100vh - var(--nav-height));
}

.roles-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

h1 {
  font-size: 18px;
  color: #c0392b;
  margin: 0 0 4px;
  font-weight: 700;
}

.roles-note {
  font-size: 11px;
  color: #666;
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

.save-btn {
  padding: 9px 18px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
}

.save-btn:hover {
  background: #a93226;
}

.table-wrap {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0,0,0,.12);
  overflow: hidden;
}

.roles-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
}

.roles-table thead th {
  background: #c0392b;
  color: #fff;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 9px 10px;
  text-align: left;
  font-weight: 700;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.col-role {
  min-width: 160px;
}

.col-check {
  text-align: center;
  width: 130px;
}

.roles-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.row-band td {
  background: #fbeeec;
}

.row-highlight td {
  background: #fffbe6 !important;
}

.role-super {
  color: #c0392b;
  font-weight: 700;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #c0392b;
  cursor: pointer;
}

input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media screen and (max-width: 768px) {
  .roles-view {
    padding: 12px;
  }
  .table-wrap {
    overflow-x: auto;
  }
}
</style>
