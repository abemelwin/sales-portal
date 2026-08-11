import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { User, Role } from '@/types'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const role = ref<Role | null>(null)
  const failedAttempts = ref(0)
  const isLocked = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Computed ───────────────────────────────────────────────────────────────

  const isAuthenticated = computed(() => !!session.value && !!user.value)

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  /**
   * Fetch the user profile from the user_profiles table.
   * Sets the user and role state based on the result.
   */
  async function fetchUserProfile(userId: string): Promise<boolean> {
    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (profileError || !data) {
      return false
    }

    user.value = data as User
    // If role is unrecognized or missing, default to salesperson (Requirement 2.2)
    const resolvedRole = data.role === 'admin' ? 'admin' : 'salesperson'
    role.value = resolvedRole

    return true
  }

  /** Clear all auth-related state */
  function clearState() {
    user.value = null
    session.value = null
    role.value = null
    failedAttempts.value = 0
    isLocked.value = false
    error.value = null
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Login with email/password credentials.
   * Implements account lockout after 5 consecutive failed attempts (Requirement 1.3).
   */
  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Check if already locked out
    if (isLocked.value) {
      const errorMsg = 'Account is locked due to too many failed login attempts. Please contact an administrator.'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !data.session) {
        // Increment failed attempts counter
        failedAttempts.value++

        // Lock account at 5 failed attempts (Requirement 1.3)
        if (failedAttempts.value >= 5) {
          isLocked.value = true
          const errorMsg = 'Account is locked due to too many failed login attempts. Please contact an administrator.'
          error.value = errorMsg
          return { success: false, error: errorMsg }
        }

        const errorMsg = authError?.message || 'Authentication failed. Please check your credentials.'
        error.value = errorMsg
        return { success: false, error: errorMsg }
      }

      // Successful login - set session
      session.value = data.session

      // Fetch user profile to get role
      const profileFound = await fetchUserProfile(data.session.user.id)
      if (!profileFound) {
        // User has no active profile - sign them out
        await supabase.auth.signOut()
        clearState()
        const errorMsg = 'User profile not found or account is deactivated.'
        error.value = errorMsg
        return { success: false, error: errorMsg }
      }

      // Reset failed attempts on successful login
      failedAttempts.value = 0
      isLocked.value = false

      return { success: true }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred during login.'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout - invalidate the current session (Requirement 1.5).
   */
  async function logout(): Promise<void> {
    loading.value = true
    try {
      await supabase.auth.signOut()
    } finally {
      clearState()
      loading.value = false
    }
  }

  /**
   * Refresh the current session (Requirement 1.4).
   */
  async function refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !data.session) {
        clearState()
        const errorMsg = refreshError?.message || 'Session refresh failed.'
        error.value = errorMsg
        return { success: false, error: errorMsg }
      }

      session.value = data.session
      return { success: true }
    } catch {
      clearState()
      return { success: false, error: 'An unexpected error occurred while refreshing session.' }
    }
  }

  /**
   * Change the user's password (Requirement 1.8).
   * Validates new password is 8-128 characters and calls Supabase updateUser.
   */
  async function changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validate new password length (Requirement 1.8)
    if (newPassword.length < 8 || newPassword.length > 128) {
      const errorMsg = 'New password must be between 8 and 128 characters.'
      return { success: false, error: errorMsg }
    }

    if (!user.value || !session.value) {
      return { success: false, error: 'You must be logged in to change your password.' }
    }

    loading.value = true
    try {
      // Re-authenticate with current password to verify identity
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: session.value.user.email!,
        password: currentPassword,
      })

      if (reAuthError) {
        return { success: false, error: 'Current password is incorrect.' }
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        return { success: false, error: updateError.message || 'Failed to update password.' }
      }

      return { success: true }
    } catch {
      return { success: false, error: 'An unexpected error occurred while changing password.' }
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize the auth store - set up onAuthStateChange listener.
   * Should be called once when the app starts.
   */
  function initialize() {
    supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        switch (event) {
          case 'TOKEN_REFRESHED':
            // Update session on token refresh
            session.value = newSession
            break

          case 'SIGNED_OUT':
            // Clear all state when signed out
            clearState()
            break

          case 'INITIAL_SESSION':
            // Hydrate state from existing session on app load
            if (newSession) {
              session.value = newSession
              await fetchUserProfile(newSession.user.id)
            }
            break

          case 'SIGNED_IN':
            // Session established (handled by login action, but also covers OAuth/magic link)
            if (newSession) {
              session.value = newSession
              if (!user.value) {
                await fetchUserProfile(newSession.user.id)
              }
            }
            break

          case 'USER_UPDATED':
            // User data was updated (e.g., password change)
            if (newSession) {
              session.value = newSession
            }
            break
        }
      }
    )
  }

  // ─── Public Interface ───────────────────────────────────────────────────────

  return {
    // State
    user,
    session,
    role,
    failedAttempts,
    isLocked,
    loading,
    error,

    // Computed
    isAuthenticated,

    // Actions
    login,
    logout,
    refreshSession,
    changePassword,
    initialize,
  }
})
