import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RolePermissions {
  create_quotes: boolean
  use_calculator: boolean
  manage_product_files: boolean
  edit_machine_catalog: boolean
  upload_machine_catalog: boolean
  manage_users: boolean
  manage_roles_access: boolean
}

const DEFAULT_PERMS: RolePermissions = {
  create_quotes: true,
  use_calculator: true,
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

    // Check user_profiles for individual user permissions override first
    let userProfilePerms: Partial<RolePermissions> | null = null
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (profile) {
        userProfilePerms = profile as any
      }
    }

    // Fetch default role_permissions
    const { data: roleData } = await supabase
      .from('role_permissions' as any)
      .select('*')
      .eq('role', role)
      .maybeSingle()

    const isSalesRole = ['superadmin', 'sales_admin_manager', 'sales_admin_supervisor', 'sales_admin_assistant', 'area_sales_manager', 'account_executive', 'sales_assistant'].includes(role)
    const isProductTechRole = ['product_technical_head', 'product_development_manager', 'service_manager'].includes(role)
    const isSalesAdminRole = ['sales_admin_manager', 'sales_admin_supervisor', 'area_sales_manager'].includes(role)

    permissions.value = {
      create_quotes: userProfilePerms?.create_quotes ?? (roleData as any)?.create_quotes ?? (isSalesRole || role === 'superadmin'),
      use_calculator: userProfilePerms?.use_calculator ?? (roleData as any)?.use_calculator ?? true,
      manage_product_files: userProfilePerms?.manage_product_files ?? (roleData as any)?.manage_product_files ?? (isSalesRole || isProductTechRole || role === 'superadmin'),
      edit_machine_catalog: userProfilePerms?.edit_machine_catalog ?? (roleData as any)?.edit_machine_catalog ?? (isSalesRole || isProductTechRole || role === 'superadmin'),
      upload_machine_catalog: userProfilePerms?.upload_machine_catalog ?? (roleData as any)?.upload_machine_catalog ?? (isProductTechRole || isSalesAdminRole || role === 'superadmin'),
      manage_users: userProfilePerms?.manage_users ?? (roleData as any)?.manage_users ?? (isSalesAdminRole || role === 'superadmin'),
      manage_roles_access: userProfilePerms?.manage_roles_access ?? (roleData as any)?.manage_roles_access ?? (isSalesAdminRole || role === 'superadmin'),
    }
    loaded.value = true
  }

  function subscribeToRealtime(roleToSubscribe: string): void {
    if (realtimeChannel || !roleToSubscribe) return

    realtimeChannel = supabase
      .channel('permissions:live_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          if (currentRole.value) {
            fetchPermissions(currentRole.value)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        () => {
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
