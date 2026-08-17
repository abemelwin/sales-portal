import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

export interface RolePermissions {
  manage_product_files: boolean
  edit_machine_catalog: boolean
  upload_machine_catalog: boolean
  manage_users: boolean
  manage_roles_access: boolean
}

const DEFAULT_PERMS: RolePermissions = {
  manage_product_files: false,
  edit_machine_catalog: false,
  upload_machine_catalog: false,
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
