import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useDashboardStore = defineStore('dashboard', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const monthlyQuoteCount = ref(0)
  const activeUserCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Realtime ───────────────────────────────────────────────────────────────

  let realtimeChannel: RealtimeChannel | null = null

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch dashboard counts (Requirement 3.2, 3.3).
   * - monthlyQuoteCount: quotes created in the current calendar month by the authenticated user
   * - activeUserCount: total count of active (non-deactivated) users
   */
  async function fetchCounts(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        error.value = 'You must be logged in to view dashboard data.'
        return
      }

      // Calculate start of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Fetch monthly quote count for current user (Requirement 3.2)
      const { count: quoteCount, error: quoteError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)

      if (quoteError) {
        error.value = quoteError.message
        return
      }

      monthlyQuoteCount.value = quoteCount ?? 0

      // Fetch active user count (Requirement 3.3)
      const { count: userCount, error: userError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (userError) {
        error.value = userError.message
        return
      }

      activeUserCount.value = userCount ?? 0
    } catch (err) {
      error.value = 'An unexpected error occurred while fetching dashboard data.'
    } finally {
      loading.value = false
    }
  }

  // ─── Realtime Subscriptions ──────────────────────────────────────────────────

  /**
   * Subscribe to quotes table changes via Supabase Realtime (Requirement 11.1).
   * When any user saves or updates a quote, the monthly count is recalculated
   * and reflected within 10 seconds.
   */
  function subscribeToRealtime(): void {
    if (realtimeChannel) return // already subscribed

    realtimeChannel = supabase
      .channel('dashboard:quotes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        () => {
          // Recalculate monthly quote count on any change to quotes table
          fetchCounts()
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
    monthlyQuoteCount,
    activeUserCount,
    loading,
    error,

    // Actions
    fetchCounts,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  }
})
