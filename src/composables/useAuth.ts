import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Thin wrapper around useAuthStore() for convenient component use.
 * Exposes user, role, isAuthenticated, and auth actions so components
 * don't need to import the store directly.
 */
export function useAuth() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const role = computed(() => authStore.role)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)

  async function login(email: string, password: string) {
    return authStore.login(email, password)
  }

  async function logout() {
    return authStore.logout()
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    return authStore.changePassword(currentPassword, newPassword)
  }

  return {
    user,
    role,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    changePassword,
  }
}
