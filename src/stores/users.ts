import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { User, CreateUserInput, Role } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useUserStore = defineStore('users', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Realtime ───────────────────────────────────────────────────────────────

  let realtimeChannel: RealtimeChannel | null = null

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all users from user_profiles (Requirement 10.4).
   */
  async function fetchUsers(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('display_name')

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      users.value = (data as User[]) ?? []
    } catch (err) {
      error.value = 'An unexpected error occurred while fetching users.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new user account (Requirement 10.1).
   * Creates auth user then inserts a user_profile record.
   */
  async function createUser(
    input: CreateUserInput
  ): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Validate inputs (Requirement 10.7)
      if (input.username.length < 3 || input.username.length > 64) {
        error.value = 'Username must be between 3 and 64 characters.'
        return { success: false, error: error.value }
      }

      if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
        error.value = 'Username must contain only alphanumeric characters and underscores.'
        return { success: false, error: error.value }
      }

      if (input.display_name.length < 1 || input.display_name.length > 128) {
        error.value = 'Display name must be between 1 and 128 characters.'
        return { success: false, error: error.value }
      }

      if (input.password.length < 8 || input.password.length > 128) {
        error.value = 'Password must be between 8 and 128 characters.'
        return { success: false, error: error.value }
      }

      // Create the auth user via Supabase admin function
      // Note: In production, user creation would typically go through an Edge Function
      // or use supabase.auth.admin. Here we use the standard signUp pattern
      // and expect the server-side to handle the profile creation via trigger or RPC.
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${input.username}@espmi.local`,
        password: input.password,
        email_confirm: true,
      })

      if (authError) {
        error.value = authError.message
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        error.value = 'Failed to create user account.'
        return { success: false, error: error.value }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          display_name: input.display_name,
          role: input.role,
          is_active: true,
        })

      if (profileError) {
        error.value = profileError.message
        return { success: false, error: profileError.message }
      }

      // Refresh users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while creating the user.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a user's role (Requirement 10.2).
   */
  async function updateRole(
    userId: string,
    role: Role
  ): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role, updated_at: new Date().toISOString() } as never)
        .eq('user_id', userId)

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      // Refresh users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while updating user role.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Deactivate a user account (Requirement 10.3).
   * Invalidates sessions and prevents new logins.
   * Enforces at least one active admin must remain (Requirement 10.6).
   */
  async function deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Check if deactivating this user would leave zero active admins
      const targetUser = users.value.find((u) => u.user_id === userId)
      if (!targetUser) {
        error.value = 'User not found.'
        return { success: false, error: error.value }
      }

      if (targetUser.role === 'superadmin') {
        const activeAdmins = users.value.filter(
          (u) => u.role === 'superadmin' && u.is_active && u.user_id !== userId
        )
        if (activeAdmins.length === 0) {
          error.value = 'Cannot deactivate the last active admin user.'
          return { success: false, error: error.value }
        }
      }

      // Mark as inactive in user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      // Ban the auth user to invalidate sessions and prevent new logins (Requirement 10.3)
      const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h', // ~100 years effectively permanent ban
      })

      if (banError) {
        // Rollback profile change if auth ban fails
        await supabase
          .from('user_profiles')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        error.value = banError.message
        return { success: false, error: banError.message }
      }

      // Refresh users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while deactivating the user.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reactivate a previously deactivated user account (Requirement 10.8).
   * Restores the user's prior role and allows new sessions to be established.
   */
  async function reactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Mark as active in user_profiles (role is preserved from before deactivation)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      // Unban the auth user to allow new sessions (Requirement 10.8)
      const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      })

      if (unbanError) {
        // Rollback profile change if auth unban fails
        await supabase
          .from('user_profiles')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        error.value = unbanError.message
        return { success: false, error: unbanError.message }
      }

      // Refresh users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while reactivating the user.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Computed Helpers ──────────────────────────────────────────────────────

  /**
   * Count of active admin users. Used to enforce the minimum admin invariant.
   */
  function getActiveAdminCount(): number {
    return users.value.filter((u) => u.role === 'superadmin' && u.is_active).length
  }

  /**
   * Check if a user is the last active admin (Requirement 10.6).
   */
  function isLastActiveAdmin(userId: string): boolean {
    const targetUser = users.value.find((u) => u.user_id === userId)
    if (!targetUser || targetUser.role !== 'superadmin' || !targetUser.is_active) {
      return false
    }
    return getActiveAdminCount() <= 1
  }

  // ─── Realtime Subscriptions ──────────────────────────────────────────────────

  /**
   * Subscribe to user_profiles table changes via Supabase Realtime (Requirement 11.1).
   * When user profiles are updated (role change, activation/deactivation),
   * the user list is refreshed for admins.
   */
  function subscribeToRealtime(): void {
    if (realtimeChannel) return // already subscribed

    realtimeChannel = supabase
      .channel('users:user_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          // Refetch user list to reflect changes from other admins
          fetchUsers()
        }
      )
      .subscribe()
  }

  /**
   * Unsubscribe from realtime updates.
   */
  function unsubscribeFromRealtime(): void {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // ─── Public Interface ───────────────────────────────────────────────────────

  return {
    // State
    users,
    loading,
    error,

    // Actions
    fetchUsers,
    createUser,
    updateRole,
    deactivateUser,
    reactivateUser,
    subscribeToRealtime,
    unsubscribeFromRealtime,

    // Helpers
    getActiveAdminCount,
    isLastActiveAdmin,
  }
})
