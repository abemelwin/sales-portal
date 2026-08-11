import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export const useRealtimeStore = defineStore('realtime', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const lastSync = ref<Date | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Derived ────────────────────────────────────────────────────────────────

  /**
   * True when the connection is not in 'connected' state.
   * Used by the ConnectivityBanner to determine if a warning should be shown.
   */
  const isConnectionLost = computed(() => connectionStatus.value !== 'connected')

  /**
   * True when there is a persistent error (max reconnection attempts exhausted).
   * (Requirement 11.6)
   */
  const hasPersistentError = computed(() => error.value !== null)

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Set the current connection status (Requirement 11.4).
   */
  function setStatus(status: ConnectionStatus): void {
    connectionStatus.value = status

    // Clear error when reconnected
    if (status === 'connected') {
      error.value = null
    }
  }

  /**
   * Update the last sync timestamp.
   * Called when data is successfully refreshed after reconnection (Requirement 11.5).
   */
  function setLastSync(date: Date | null): void {
    lastSync.value = date
  }

  /**
   * Clear all state. Used on logout.
   */
  function $reset(): void {
    connectionStatus.value = 'disconnected'
    lastSync.value = null
    loading.value = false
    error.value = null
  }

  // ─── Public Interface ───────────────────────────────────────────────────────

  return {
    // State
    connectionStatus,
    lastSync,
    loading,
    error,

    // Derived
    isConnectionLost,
    hasPersistentError,

    // Actions
    setStatus,
    setLastSync,
    $reset,
  }
})
