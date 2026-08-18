<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

interface RolePermission {
  role: string
  manage_product_files: boolean
  edit_machine_catalog: boolean
  upload_machine_catalog: boolean
  manage_users: boolean
  manage_roles_access: boolean
  isLocked?: boolean
}

const roles = reactive<RolePermission[]>([])
const saving = ref(false)
const saved = ref(false)
const loading = ref(true)
const error = ref('')

const ROLE_ORDER = [
  'superadmin', 'product_technical_head', 'product_development_manager', 'service_manager',
  'sales_admin_manager', 'sales_admin_supervisor',
  'sales_admin_assistant', 'area_sales_manager', 'account_executive', 'sales_assistant', 'user'
]

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  product_technical_head: 'Product Technical Head',
  product_development_manager: 'Product Development Manager',
  service_manager: 'Service Manager',
  sales_admin_manager: 'Sales Admin Manager',
  sales_admin_supervisor: 'Sales Admin Supervisor',
  sales_admin_assistant: 'Sales Admin Assistant',
  area_sales_manager: 'Area Sales Manager',
  account_executive: 'Account Executive',
  sales_assistant: 'Sales Assistant',
  user: 'User',
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const { data: rawData, error: fetchErr } = await supabase
      .from('role_permissions' as any)
      .select('*')
      .order('role')
    const data = rawData as any[]

    if (fetchErr) {
      error.value = fetchErr.message
      return
    }

    // Sort by defined order
    const sorted = ROLE_ORDER.map(r => {
      const found = (data || []).find((d: any) => d.role === r) as any
      return found || {
        role: r,
        manage_product_files: false,
        edit_machine_catalog: false,
        upload_machine_catalog: false,
        manage_users: false,
        manage_roles_access: false,
      }
    }).map(r => ({
      ...r,
      isLocked: r.role === 'superadmin',
    }))

    roles.splice(0, roles.length, ...sorted)
  } catch (e: any) {
    error.value = e.message || 'Failed to load permissions'
  } finally {
    loading.value = false
  }
})

async function saveAccess() {
  saving.value = true
  saved.value = false
  error.value = ''

  try {
    for (const r of roles) {
      if (r.isLocked) continue
      const { error: updateErr } = await supabase
        .from('role_permissions' as any)
        .update({
          manage_product_files: r.manage_product_files,
          edit_machine_catalog: r.edit_machine_catalog,
          upload_machine_catalog: r.upload_machine_catalog,
          manage_users: r.manage_users,
          manage_roles_access: r.manage_roles_access,
          updated_at: new Date().toISOString(),
        })
        .eq('role', r.role)

      if (updateErr) {
        error.value = `Failed to save ${ROLE_LABELS[r.role]}: ${updateErr.message}`
        return
      }
    }
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e: any) {
    error.value = e.message || 'Save failed'
  } finally {
    saving.value = false
  }
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
      <button class="save-btn" :disabled="saving" @click="saveAccess">
        <span v-if="saved">✓ Saved!</span>
        <span v-else-if="saving">Saving...</span>
        <span v-else>💾 Save Access</span>
      </button>
    </div>

    <div v-if="error" class="roles-error">{{ error }}</div>
    <div v-if="loading" class="roles-loading">Loading permissions...</div>

    <div v-else class="table-wrap">
      <table class="roles-table" aria-label="Roles and permissions">
        <thead>
          <tr>
            <th class="col-role">Role</th>
            <th>Manage Product Files</th>
            <th>Edit Machine Catalog</th>
            <th>Upload Machine Catalog</th>
            <th>Manage Users</th>
            <th>Manage Roles &amp; Access</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(r, idx) in roles"
            :key="r.role"
            :class="{ 'row-band': idx % 2 === 0 }"
          >
            <td class="col-role">
              <span :class="{ 'role-super': r.isLocked }">{{ ROLE_LABELS[r.role] || r.role }}</span>
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manage_product_files" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.edit_machine_catalog" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.upload_machine_catalog" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manage_users" :disabled="r.isLocked" />
            </td>
            <td class="col-check">
              <input type="checkbox" v-model="r.manage_roles_access" :disabled="r.isLocked" />
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

.save-btn:hover:not(:disabled) {
  background: #a93226;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.roles-error {
  color: #c62828;
  font-size: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 4px;
}

.roles-loading {
  text-align: center;
  padding: 40px;
  color: #999;
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
