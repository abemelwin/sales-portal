import { ref, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeStatus = 'connected' | 'disconnected' | 'reconnecting'

/**
 * Creates a Supabase Realtime channel subscription for postgres_changes on the given table.
 * 
 * @param tableName - The PostgreSQL table name to subscribe to
 * @param callback - Function called on each change event (INSERT, UPDATE, DELETE)
 * @returns subscribe/unsubscribe functions and reactive connection status
 * 
 * Requirements: 11.4, 11.5, 11.6
 */
export function useRealtime(
  tableName: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) {
  const channel = ref<RealtimeChannel | null>(null)
  const status = ref<RealtimeStatus>('disconnected')

  function subscribe() {
    // Avoid duplicate subscriptions
    if (channel.value) {
      return
    }

    channel.value = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') {
          status.value = 'connected'
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          status.value = 'disconnected'
        } else {
          status.value = 'reconnecting'
        }
      })
  }

  function unsubscribe() {
    if (channel.value) {
      supabase.removeChannel(channel.value as RealtimeChannel)
      channel.value = null
      status.value = 'disconnected'
    }
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    subscribe,
    unsubscribe,
    status,
  }
}
