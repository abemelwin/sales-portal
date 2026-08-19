import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RolePermissions {
  create_quotes: boolean
  manage_product_files: boolean
  edit_machine_catalog: boolean
  upload_machine_catalog: boolean
  manage_users: boolean
  manage_roles_access: boolean
}

const DEFAULT_PERMS: RolePermissions = {
  create_quotes: true,
  manage_product_files: false,
  edit_machine_catalog: false,
  upload_machine_catalog: false,
  manage_users: false,
  manage_roles_access: false,
}

export const usePermissionsStore = defineStore('permissions', () => {
  const permissions = ref<RolePermissions>({ ...DEFAULT_PERMS })
  const loaded = ref(false)
  const currentRole = ref<string>('')
  let realtimeChannel: RealtimeChannel | null = null

  async function fetchPermissions(role: string): Promise<void> {
    if (!role) return
    currentRole.value = role

    // Superadmin always has full access
    if (role === 'superadmin') {
      permissions.value = {
        create_quotes: true,
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
      .maybeSingle()

    const isSalesRole = ['superadmin', 'sales_admin_manager', 'sales_admin_supervisor', 'sales_admin_assistant', 'area_sales_manager', 'account_executive', 'sales_assistant'].includes(role)

    if (error || !data) {
      permissions.value = {
        ...DEFAULT_PERMS,
        create_quotes: isSalesRole,
      }
    } else {
      permissions.value = {
        create_quotes: (data as any).create_quotes ?? isSalesRole,
        manage_product_files: (data as any).manage_product_files ?? false,
        edit_machine_catalog: (data as any).edit_machine_catalog ?? false,
        upload_machine_catalog: (data as any).upload_machine_catalog ?? false,
        manage_users: (data as any).manage_users ?? false,
        manage_roles_access: (data as any).manage_roles_access ?? false,
      }
    }
    loaded.value = true
  }

  function subscribeToRealtime(roleToSubscribe: string): void {
    if (realtimeChannel || !roleToSubscribe) return

    realtimeChannel = supabase
      .channel('permissions:role_permissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        () => {
          // Refetch permissions dynamically whenever an admin edits roles matrix
          if (currentRole.value) {
            fetchPermissions(currentRole.value)
          }
        }
      )
      .subscribe()
  }

  function unsubscribeFromRealtime(): void {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  function reset() {
    unsubscribeFromRealtime()
    permissions.value = { ...DEFAULT_PERMS }
    loaded.value = false
    currentRole.value = ''
  }

  // Convenience getters
  function can(permission: keyof RolePermissions): boolean {
    return permissions.value[permission] ?? false
  }

  return {
    permissions,
    loaded,
    currentRole,
    fetchPermissions,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    reset,
    can,
  }
})
