<script setup lang="ts">
import { ref, watch, onErrorCaptured, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useReconnection } from '@/composables/useReconnection'
import { useDashboardStore } from '@/stores/dashboard'
import { useCatalogStore } from '@/stores/catalog'
import { useQuoteStore } from '@/stores/quotes'
import { useUserStore } from '@/stores/users'
import { usePermissionsStore } from '@/stores/permissions'
import { useRealtimeStore } from '@/stores/realtime'
import { supabase } from '@/services/supabase'
import NavBar from '@/components/layout/NavBar.vue'
import ConnectivityBanner from '@/components/layout/ConnectivityBanner.vue'
import UpdateBanner from '@/components/layout/UpdateBanner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { useIdleLogout } from '@/composables/useIdleLogout'

useIdleLogout()

const router = useRouter()
const route = useRoute()
const { isAuthenticated, role } = useAuth()

const dashboardStore = useDashboardStore()
const catalogStore = useCatalogStore()
const quoteStore = useQuoteStore()
const userStore = useUserStore()
const permissionsStore = usePermissionsStore()
const realtimeStore = useRealtimeStore()

watch(role, (newRole) => {
  if (isAuthenticated.value && newRole) {
    permissionsStore.fetchPermissions(newRole)
    permissionsStore.subscribeToRealtime(newRole)
  }
}, { immediate: true })

// ─── Reconnection Logic (Requirements 11.4, 11.5, 11.6) ──────────────────────

const {
  handleDisconnect,
  handleReconnected,
  setReconnectFn,
  setRefreshFn,
  reset: resetReconnection,
} = useReconnection()

/**
 * Reconnect function: attempts to re-establish the Supabase realtime connection.
 * Returns true if the connection is successfully restored.
 */
setReconnectFn(async () => {
  try {
    // Attempt to re-subscribe to realtime channels by removing and re-adding them.
    // First, check if we can communicate with Supabase at all.
    const { error } = await supabase.auth.getSession()
    if (error) return false

    // If session is valid, re-establish realtime subscriptions
    dashboardStore.unsubscribeFromRealtime()
    catalogStore.unsubscribeFromRealtime()
    quoteStore.unsubscribeFromRealtime()
    userStore.unsubscribeFromRealtime()

    dashboardStore.subscribeToRealtime()
    catalogStore.subscribeToRealtime()
    quoteStore.subscribeToRealtime()
    userStore.subscribeToRealtime()

    return true
  } catch {
    return false
  }
})

/**
 * Refresh function: called after successful reconnection to refresh data caches.
 * Must complete within 10 seconds (Requirement 11.5).
 */
setRefreshFn(async () => {
  await Promise.allSettled([
    dashboardStore.fetchCounts(),
    catalogStore.fetchMachines(),
    quoteStore.fetchQuotes(),
    userStore.fetchUsers(),
  ])
})

/**
 * Monitor Supabase realtime connection state.
 * Supabase channels emit system-level events we can listen to for disconnect detection.
 */
let heartbeatChannel: ReturnType<typeof supabase.channel> | null = null

function setupRealtimeMonitor() {
  // Create a lightweight heartbeat channel to monitor connection health
  heartbeatChannel = supabase
    .channel('system:heartbeat')
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // If we were disconnected, this means we reconnected
        if (realtimeStore.connectionStatus !== 'connected') {
          handleReconnected()
        }
        realtimeStore.setStatus('connected')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handleDisconnect()
      } else if (status === 'CLOSED') {
        handleDisconnect()
      }
    })
}

function teardownRealtimeMonitor() {
  if (heartbeatChannel) {
    supabase.removeChannel(heartbeatChannel)
    heartbeatChannel = null
  }
}

/**
 * Watch for session expiry mid-use (Requirement 1.4, 1.9).
 * When isAuthenticated transitions from true to false and the user is not
 * already on the login page, redirect to /login preserving the current route
 * as a return URL for post-login navigation.
 */
watch(isAuthenticated, (isAuth, wasAuth) => {
  if (wasAuth && !isAuth && route.name !== 'login') {
    router.replace({
      name: 'login',
      query: { redirect: route.fullPath }
    })
  }
})

/**
 * Activate realtime subscriptions when authenticated (Requirements 11.1, 11.2, 11.3).
 * Deactivate when the user logs out.
 */
watch(isAuthenticated, (isAuth) => {
  if (isAuth) {
    dashboardStore.subscribeToRealtime()
    catalogStore.subscribeToRealtime()
    quoteStore.subscribeToRealtime()
    userStore.subscribeToRealtime()
    if (role.value) {
      permissionsStore.subscribeToRealtime(role.value)
    }
    setupRealtimeMonitor()
    realtimeStore.setStatus('connected')
  } else {
    dashboardStore.unsubscribeFromRealtime()
    catalogStore.unsubscribeFromRealtime()
    quoteStore.unsubscribeFromRealtime()
    userStore.unsubscribeFromRealtime()
    permissionsStore.unsubscribeFromRealtime()
    teardownRealtimeMonitor()
    resetReconnection()
    realtimeStore.$reset()
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  dashboardStore.unsubscribeFromRealtime()
  catalogStore.unsubscribeFromRealtime()
  quoteStore.unsubscribeFromRealtime()
  userStore.unsubscribeFromRealtime()
  permissionsStore.unsubscribeFromRealtime()
  teardownRealtimeMonitor()
  resetReconnection()
})

// ─── Error Boundary (Design: Error Handling) ──────────────────────────────────
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, _instance, info) => {
  console.error('[App Error]', err, info)
  hasError.value = true
  errorMessage.value = 'An unexpected error occurred. Please try again.'
  // Return false to prevent propagation
  return false
})

function dismissError() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div id="app">
    <!-- Auto Update notification banner -->
    <UpdateBanner />

    <!-- NavBar only shown when authenticated (not on login page) -->
    <NavBar v-if="isAuthenticated" />

    <!-- Connectivity banner — non-blocking warning/error (Requirements 11.4, 11.6) -->
    <ConnectivityBanner v-if="isAuthenticated" />

    <!-- Global error banner -->
    <div v-if="hasError" class="app-error-banner" role="alert">
      <p class="app-error-message">{{ errorMessage }}</p>
      <button class="app-error-dismiss" @click="dismissError">
        Dismiss
      </button>
    </div>

    <!-- Main content area -->
    <main class="app-main" :class="{ 'app-main--with-nav': isAuthenticated }">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <!-- Global Modal Dialog -->
    <ModalDialog />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
}

.app-main--with-nav {
  /* No extra padding — views manage their own layout */
}

/* Error banner */
.app-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-error-light);
  border-bottom: 1px solid var(--color-error);
}

.app-error-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-error);
  font-weight: 500;
}

.app-error-dismiss {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
}

.app-error-dismiss:hover {
  color: var(--color-white);
  background-color: var(--color-error);
}
</style>
