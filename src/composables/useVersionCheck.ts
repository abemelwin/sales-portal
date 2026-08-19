import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const hasUpdate = ref(false)
const currentBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : ''
let checkInterval: ReturnType<typeof setInterval> | null = null

export function useVersionCheck() {
  const router = useRouter()

  async function checkForUpdate(): Promise<boolean> {
    if (import.meta.env.DEV) return false
    try {
      // Fetch version.json bypassing browser cache
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) return false
      const data = await response.json()
      if (data && data.buildTime && currentBuildTime && data.buildTime !== currentBuildTime) {
        hasUpdate.value = true
        return true
      }
    } catch {
      // Ignore network errors during background check
    }
    return false
  }

  function reloadToUpdate() {
    window.location.reload()
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      checkForUpdate()
    }
  }

  onMounted(() => {
    // Initial check
    checkForUpdate()

    // Interval check every 30 seconds
    if (!checkInterval) {
      checkInterval = setInterval(checkForUpdate, 30000)
    }

    // Check when user switches back to this tab
    window.addEventListener('visibilityfocus', checkForUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check when changing routes
    if (router) {
      router.afterEach(() => {
        checkForUpdate()
      })
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    hasUpdate,
    checkForUpdate,
    reloadToUpdate
  }
}
