import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes

/**
 * Auto-logout after 60 minutes of inactivity.
 * Tracks mouse, keyboard, scroll, and touch events.
 * Call this once in App.vue.
 */
export function useIdleLogout() {
  const authStore = useAuthStore()
  const router = useRouter()
  const lastActivity = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  function resetTimer() {
    lastActivity.value = Date.now()
  }

  function checkIdle() {
    if (!authStore.isAuthenticated) return
    const elapsed = Date.now() - lastActivity.value
    if (elapsed >= IDLE_TIMEOUT_MS) {
      // Auto-logout
      authStore.logout()
      router.push({ name: 'login', query: { reason: 'idle' } })
    }
  }

  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

  onMounted(() => {
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    // Check every 30 seconds
    timer = setInterval(checkIdle, 30000)
  })

  onUnmounted(() => {
    events.forEach(e => window.removeEventListener(e, resetTimer))
    if (timer) clearInterval(timer)
  })

  return { lastActivity }
}
