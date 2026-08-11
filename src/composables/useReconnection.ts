import { ref, computed, onUnmounted } from 'vue'
import { useRealtimeStore } from '@/stores/realtime'

const RECONNECTION_INTERVAL_MS = 5000 // 5 seconds between attempts (Requirement 11.4)
const MAX_RECONNECTION_ATTEMPTS = 60  // Max 60 attempts before giving up (Requirement 11.6)

export type ReconnectionState = 'idle' | 'disconnected' | 'reconnecting' | 'failed'

/**
 * Manages disconnect detection and reconnection attempts with a fixed 5-second retry interval.
 *
 * Behavior:
 * - On disconnect: displays a non-blocking warning, begins retrying every 5 seconds
 * - On successful reconnection: refreshes store caches, removes warning (Requirement 11.5)
 * - After 60 failed attempts: shows persistent error, ceases retrying (Requirement 11.6)
 *
 * Requirements: 11.4, 11.5, 11.6
 */
export function useReconnection() {
  const realtimeStore = useRealtimeStore()

  const state = ref<ReconnectionState>('idle')
  const attemptCount = ref(0)

  let reconnectionTimer: ReturnType<typeof setInterval> | null = null
  let reconnectFn: (() => Promise<boolean>) | null = null
  let refreshFn: (() => Promise<void>) | null = null

  const isDisconnected = computed(() =>
    state.value === 'disconnected' || state.value === 'reconnecting'
  )
  const isMaxAttemptsReached = computed(() => state.value === 'failed')
  const isReconnecting = computed(() => state.value === 'reconnecting')

  /**
   * Register the reconnect function that will be called on each retry attempt.
   * @param fn - Async function that attempts reconnection. Returns true on success.
   */
  function setReconnectFn(fn: () => Promise<boolean>): void {
    reconnectFn = fn
  }

  /**
   * Register the refresh function called after successful reconnection.
   * Should refresh all store data caches (Requirement 11.5).
   * @param fn - Async function that refreshes all relevant store data.
   */
  function setRefreshFn(fn: () => Promise<void>): void {
    refreshFn = fn
  }

  /**
   * Signal that the realtime connection has been lost.
   * Transitions to 'disconnected' state and begins reconnection attempts.
   * (Requirement 11.4)
   */
  function handleDisconnect(): void {
    // Don't restart if already failed permanently
    if (state.value === 'failed') {
      return
    }

    // Already handling disconnect
    if (state.value === 'disconnected' || state.value === 'reconnecting') {
      return
    }

    state.value = 'disconnected'
    attemptCount.value = 0
    realtimeStore.setStatus('disconnected')

    startReconnection()
  }

  /**
   * Signal that the realtime connection has been re-established externally.
   * Resets all state and refreshes data.
   */
  async function handleReconnected(): Promise<void> {
    stopTimer()
    state.value = 'idle'
    attemptCount.value = 0
    realtimeStore.setStatus('connected')
    realtimeStore.setLastSync(new Date())

    // Refresh data caches within 10 seconds (Requirement 11.5)
    if (refreshFn) {
      try {
        await refreshFn()
        realtimeStore.setLastSync(new Date())
      } catch {
        // Refresh failure is non-critical; connection is back
      }
    }
  }

  /**
   * Begin the reconnection loop.
   * Attempts reconnection every 5 seconds, up to 60 times.
   */
  function startReconnection(): void {
    if (reconnectionTimer) {
      return
    }

    state.value = 'reconnecting'
    realtimeStore.setStatus('reconnecting')

    reconnectionTimer = setInterval(async () => {
      // Check if max attempts reached
      if (attemptCount.value >= MAX_RECONNECTION_ATTEMPTS) {
        handleMaxAttemptsReached()
        return
      }

      attemptCount.value++

      if (!reconnectFn) {
        return
      }

      try {
        const success = await reconnectFn()
        if (success) {
          await handleReconnected()
        }
      } catch {
        // Attempt failed — continue retrying until max reached
      }

      // Re-check after attempt
      if (attemptCount.value >= MAX_RECONNECTION_ATTEMPTS) {
        handleMaxAttemptsReached()
      }
    }, RECONNECTION_INTERVAL_MS)
  }

  /**
   * Max attempts exhausted — show persistent error, cease retrying.
   * (Requirement 11.6)
   */
  function handleMaxAttemptsReached(): void {
    stopTimer()
    state.value = 'failed'
    realtimeStore.setStatus('disconnected')
    realtimeStore.error = 'Real-time connection lost. Please refresh the page to restore live updates.'
  }

  /** Stop the reconnection timer */
  function stopTimer(): void {
    if (reconnectionTimer) {
      clearInterval(reconnectionTimer)
      reconnectionTimer = null
    }
  }

  /**
   * Reset all state. Typically called when user logs out or navigates away.
   */
  function reset(): void {
    stopTimer()
    state.value = 'idle'
    attemptCount.value = 0
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    stopTimer()
  })

  return {
    // State
    state,
    attemptCount,
    isDisconnected,
    isReconnecting,
    isMaxAttemptsReached,

    // Configuration
    setReconnectFn,
    setRefreshFn,

    // Actions
    handleDisconnect,
    handleReconnected,
    reset,
  }
}
