const fs = require('fs');
const path = require('path');

const basePath = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src';

// ----------------------------------------------------------------------
// 1. Create permissions store
// ----------------------------------------------------------------------

const permissionsStore = `import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

export interface RolePermissions {
  manage_product_files: boolean
  edit_machine_catalog: boolean
  upload_machine_catalog: boolean
  upload_consumables_pricelist: boolean
  manage_users: boolean
  manage_roles_access: boolean
}

const DEFAULT_PERMS: RolePermissions = {
  manage_product_files: false,
  edit_machine_catalog: false,
  upload_machine_catalog: false,
  upload_consumables_pricelist: false,
  manage_users: false,
  manage_roles_access: false,
}

export const usePermissionsStore = defineStore('permissions', () => {
  const permissions = ref<RolePermissions>({ ...DEFAULT_PERMS })
  const loaded = ref(false)

  async function fetchPermissions(role: string): Promise<void> {
    if (!role) return

    // Superadmin always has full access
    if (role === 'superadmin') {
      permissions.value = {
        manage_product_files: true,
        edit_machine_catalog: true,
        upload_machine_catalog: true,
        upload_consumables_pricelist: true,
        manage_users: true,
        manage_roles_access: true,
      }
      loaded.value = true
      return
    }

    const { data, error } = await supabase
      .from('role_permissions' as any)
      .select('*')
      .eq('role', role)
      .single()

    if (error || !data) {
      permissions.value = { ...DEFAULT_PERMS }
    } else {
      permissions.value = {
        manage_product_files: (data as any).manage_product_files ?? false,
        edit_machine_catalog: (data as any).edit_machine_catalog ?? false,
        upload_machine_catalog: (data as any).upload_machine_catalog ?? false,
        upload_consumables_pricelist: (data as any).upload_consumables_pricelist ?? false,
        manage_users: (data as any).manage_users ?? false,
        manage_roles_access: (data as any).manage_roles_access ?? false,
      }
    }
    loaded.value = true
  }

  function reset() {
    permissions.value = { ...DEFAULT_PERMS }
    loaded.value = false
  }

  // Convenience getters
  function can(permission: keyof RolePermissions): boolean {
    return permissions.value[permission] ?? false
  }

  return {
    permissions,
    loaded,
    fetchPermissions,
    reset,
    can,
  }
})
`;

fs.writeFileSync(path.join(basePath, 'stores', 'permissions.ts'), permissionsStore);
console.log('1. Created stores/permissions.ts');

// ----------------------------------------------------------------------
// 2. Update auth store to fetch permissions on login
// ----------------------------------------------------------------------

const authFile = path.join(basePath, 'stores', 'auth.ts');
let auth = fs.readFileSync(authFile, 'utf-8');

// Add permissions fetch after role is set
if (!auth.includes('usePermissionsStore')) {
  auth = auth.replace(
    "import type { User, Role } from '@/types'",
    "import type { User, Role } from '@/types'\nimport { usePermissionsStore } from '@/stores/permissions'"
  );

  // After role is set in fetchUserProfile, fetch permissions
  auth = auth.replace(
    "role.value = (data.role as Role) || 'user'\n\n    return true",
    "role.value = (data.role as Role) || 'user'\n\n    // Fetch role permissions\n    const permStore = usePermissionsStore()\n    await permStore.fetchPermissions(role.value)\n\n    return true"
  );

  fs.writeFileSync(authFile, auth);
  console.log('2. Updated stores/auth.ts - fetches permissions on login');
}

// ----------------------------------------------------------------------
// 3. Update NavBar to use permissions for visibility
// ----------------------------------------------------------------------

const navFile = path.join(basePath, 'components', 'layout', 'NavBar.vue');
let nav = fs.readFileSync(navFile, 'utf-8');

if (!nav.includes('usePermissionsStore')) {
  // Add import
  nav = nav.replace(
    "import { useAuth } from '@/composables/useAuth'",
    "import { useAuth } from '@/composables/useAuth'\nimport { usePermissionsStore } from '@/stores/permissions'"
  );

  // Add store usage and computed permissions
  nav = nav.replace(
    "const { user, role, logout: authLogout } = useAuth()",
    "const { user, role, logout: authLogout } = useAuth()\nconst permStore = usePermissionsStore()\n\n// Permission-based nav visibility\nconst canManageUsers = computed(() => permStore.can('manage_users'))\nconst canManageRoles = computed(() => permStore.can('manage_roles_access'))\nconst canEditCatalog = computed(() => permStore.can('edit_machine_catalog'))"
  );

  // Replace the hardcoded isAdmin with permission-based checks
  // Find where isAdmin is used and the admin nav links
  nav = nav.replace(
    /const isAdmin = computed\(\(\) => .*?\)/,
    "const isAdmin = computed(() => permStore.can('manage_users') || permStore.can('edit_machine_catalog') || permStore.can('manage_roles_access'))"
  );

  fs.writeFileSync(navFile, nav);
  console.log('3. Updated NavBar.vue - uses permissions store');
}

// ----------------------------------------------------------------------
// 4. Update router to use permissions
// ----------------------------------------------------------------------

const routerFile = path.join(basePath, 'router', 'index.ts');
let router = fs.readFileSync(routerFile, 'utf-8');

// Replace the hardcoded adminRoles check with permissions-based check
router = router.replace(
  /\/\/ Admin routes: elevated roles get access\s*\n\s*const adminRoles = \[.*?\]\s*\n\s*if \(to\.meta\.requiresAdmin && !adminRoles\.includes\(authStore\.role \|\| ''\)\) \{\s*\n\s*return \{ name: 'dashboard' \}\s*\n\s*\}/,
  `// Admin routes: check permissions from database
  if (to.meta.requiresAdmin) {
    const { usePermissionsStore } = await import('@/stores/permissions')
    const permStore = usePermissionsStore()
    
    // Wait for permissions to load if not yet
    if (!permStore.loaded && authStore.role) {
      await permStore.fetchPermissions(authStore.role)
    }
    
    // Check specific page permissions
    const hasAccess = 
      (to.name === 'users' && permStore.can('manage_users')) ||
      (to.name === 'roles' && permStore.can('manage_roles_access')) ||
      (to.name === 'catalog' && permStore.can('edit_machine_catalog')) ||
      (to.name === 'migrate' && authStore.role === 'superadmin')
    
    if (!hasAccess) {
      return { name: 'dashboard' }
    }
  }`
);

fs.writeFileSync(routerFile, router);
console.log('4. Updated router - checks permissions per page');

// ----------------------------------------------------------------------
// 5. Update UserManagementView - restrict superadmin role assignment
// ----------------------------------------------------------------------

const userMgmtFile = path.join(basePath, 'views', 'UserManagementView.vue');
let userMgmt = fs.readFileSync(userMgmtFile, 'utf-8');

// Add import for auth store if not present
if (!userMgmt.includes("useAuthStore")) {
  // Already imported
}

// Fix handleRoleChange to prevent non-superadmin from assigning superadmin
userMgmt = userMgmt.replace(
  "async function handleRoleChange(user: User, newRoleValue: Role) {\n  if (user.role === newRoleValue) return",
  `async function handleRoleChange(user: User, newRoleValue: Role) {
  if (user.role === newRoleValue) return

  // Only superadmin can assign superadmin role
  if (newRoleValue === 'superadmin' && authStore.user?.role !== 'superadmin') {
    alert('Only Super Admin can assign the Super Admin role.')
    await userStore.fetchUsers() // reset dropdown
    return
  }`
);

// Also filter out superadmin from dropdown for non-superadmins
// Add a computed for available roles
if (!userMgmt.includes('availableRoles')) {
  userMgmt = userMgmt.replace(
    "function getRoleLabel(role: string)",
    `// Filter roles - non-superadmin cannot see/select superadmin role
const availableRoles = computed(() => {
  if (authStore.user?.role === 'superadmin') return ROLES
  return ROLES.filter(r => r.value !== 'superadmin')
})

function getRoleLabel(role: string)`
  );

  // Update template to use availableRoles instead of ROLES in dropdown
  userMgmt = userMgmt.replace(
    'v-for="r in ROLES" :key="r.value" :value="r.value">\n                  {{ r.label }}\n                </option>\n              </select>\n            </td>',
    'v-for="r in availableRoles" :key="r.value" :value="r.value">\n                  {{ r.label }}\n                </option>\n              </select>\n            </td>'
  );

  // Also update the Add User dropdown
  userMgmt = userMgmt.replace(
    '<select v-model="newRole" class="um-select">\n          <option v-for="r in ROLES" :key="r.value" :value="r.value">',
    '<select v-model="newRole" class="um-select">\n          <option v-for="r in availableRoles" :key="r.value" :value="r.value">'
  );

  // Need computed import
  if (!userMgmt.includes('computed')) {
    userMgmt = userMgmt.replace(
      "import { ref, computed, onMounted }",
      "import { ref, computed, onMounted }"
    );
  }
}

fs.writeFileSync(userMgmtFile, userMgmt);
console.log('5. Updated UserManagementView - restricts superadmin role assignment');

console.log('\n--- All RBAC changes implemented ---');
console.log('- Permissions store created');
console.log('- Auth store fetches permissions on login');
console.log('- NavBar uses permissions for visibility');
console.log('- Router checks permissions per page');
console.log('- Only superadmin can assign superadmin role');
