import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { Quote, QuotePayload } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useQuoteStore = defineStore('quotes', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const quotes = ref<Quote[]>([])
  const currentQuote = ref<Quote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Realtime ───────────────────────────────────────────────────────────────

  let realtimeChannel: RealtimeChannel | null = null

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all quotes for the current user (or all for admin).
   */
  async function fetchQuotes(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select(`
          *,
          term_options:quote_term_options(*),
          trade_ins:quote_trade_ins(*),
          consumable_prices:quote_consumable_prices(*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      quotes.value = (data as Quote[]) ?? []
    } catch (err) {
      error.value = 'An unexpected error occurred while fetching quotes.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Save a new quote with all sub-records (Requirement 5.15).
   * Persists the full quote payload under the authenticated user's account.
   */
  async function saveQuote(
    payload: QuotePayload
  ): Promise<{ success: boolean; quote?: Quote; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        error.value = 'You must be logged in to save a quote.'
        return { success: false, error: error.value }
      }

      // Extract sub-records from payload
      const { term_options, trade_ins, consumable_prices, ...quoteFields } = payload

      // Insert main quote record
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({ ...quoteFields, user_id: user.id } as never)
        .select()
        .single()

      if (quoteError) {
        error.value = quoteError.message
        return { success: false, error: quoteError.message }
      }

      const quoteId = quoteData.id

      // Insert term options
      if (term_options && term_options.length > 0) {
        const { error: termErr } = await supabase
          .from('quote_term_options')
          .insert(term_options.map((t) => ({ ...t, quote_id: quoteId })))

        if (termErr) {
          error.value = `Failed to save term options: ${termErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Insert trade-ins
      if (trade_ins && trade_ins.length > 0) {
        const { error: tradeErr } = await supabase
          .from('quote_trade_ins')
          .insert(trade_ins.map((t) => ({ ...t, quote_id: quoteId })))

        if (tradeErr) {
          error.value = `Failed to save trade-ins: ${tradeErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Insert consumable prices
      if (consumable_prices && consumable_prices.length > 0) {
        const { error: consErr } = await supabase
          .from('quote_consumable_prices')
          .insert(consumable_prices.map((c) => ({ ...c, quote_id: quoteId })))

        if (consErr) {
          error.value = `Failed to save consumable prices: ${consErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Reload the saved quote with all relations
      const saved = await loadQuote(quoteId)
      if (saved.success && saved.quote) {
        return { success: true, quote: saved.quote }
      }

      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while saving the quote.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load a specific quote by ID with all related records (Requirement 5.17).
   */
  async function loadQuote(
    id: string
  ): Promise<{ success: boolean; quote?: Quote; error?: string }> {
    loading.value = true
    error.value = null

    try {
      const { data, error: loadError } = await supabase
        .from('quotes')
        .select(`
          *,
          term_options:quote_term_options(*),
          trade_ins:quote_trade_ins(*),
          consumable_prices:quote_consumable_prices(*)
        `)
        .eq('id', id)
        .single()

      if (loadError) {
        error.value = loadError.message
        return { success: false, error: loadError.message }
      }

      currentQuote.value = data as Quote
      return { success: true, quote: data as Quote }
    } catch (err) {
      error.value = 'An unexpected error occurred while loading the quote.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing quote with all sub-records (Requirement 5.15, 5.16).
   * Replaces term options, trade-ins, and consumable prices atomically.
   */
  async function updateQuote(
    id: string,
    payload: QuotePayload
  ): Promise<{ success: boolean; quote?: Quote; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        error.value = 'You must be logged in to update a quote.'
        return { success: false, error: error.value }
      }

      // Extract sub-records from payload
      const { term_options, trade_ins, consumable_prices, ...quoteFields } = payload

      // Update main quote record
      const { data: _quoteData, error: quoteError } = await supabase
        .from('quotes')
        .update({ ...quoteFields, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()

      if (quoteError) {
        error.value = quoteError.message
        return { success: false, error: quoteError.message }
      }

      // Replace term options: delete existing, insert new
      const { error: termDeleteErr } = await supabase
        .from('quote_term_options')
        .delete()
        .eq('quote_id', id)

      if (termDeleteErr) {
        error.value = `Failed to update term options: ${termDeleteErr.message}`
        return { success: false, error: error.value }
      }

      if (term_options && term_options.length > 0) {
        const { error: termErr } = await supabase
          .from('quote_term_options')
          .insert(term_options.map((t) => ({ ...t, quote_id: id })))

        if (termErr) {
          error.value = `Failed to save term options: ${termErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Replace trade-ins: delete existing, insert new
      const { error: tradeDeleteErr } = await supabase
        .from('quote_trade_ins')
        .delete()
        .eq('quote_id', id)

      if (tradeDeleteErr) {
        error.value = `Failed to update trade-ins: ${tradeDeleteErr.message}`
        return { success: false, error: error.value }
      }

      if (trade_ins && trade_ins.length > 0) {
        const { error: tradeErr } = await supabase
          .from('quote_trade_ins')
          .insert(trade_ins.map((t) => ({ ...t, quote_id: id })))

        if (tradeErr) {
          error.value = `Failed to save trade-ins: ${tradeErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Replace consumable prices: delete existing, insert new
      const { error: consDeleteErr } = await supabase
        .from('quote_consumable_prices')
        .delete()
        .eq('quote_id', id)

      if (consDeleteErr) {
        error.value = `Failed to update consumable prices: ${consDeleteErr.message}`
        return { success: false, error: error.value }
      }

      if (consumable_prices && consumable_prices.length > 0) {
        const { error: consErr } = await supabase
          .from('quote_consumable_prices')
          .insert(consumable_prices.map((c) => ({ ...c, quote_id: id })))

        if (consErr) {
          error.value = `Failed to save consumable prices: ${consErr.message}`
          return { success: false, error: error.value }
        }
      }

      // Reload the saved quote with all relations
      const saved = await loadQuote(id)
      if (saved.success && saved.quote) {
        return { success: true, quote: saved.quote }
      }

      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while updating the quote.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a quote and its sub-records (cascade handled by DB).
   */
  async function deleteQuote(id: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)

      if (deleteError) {
        error.value = deleteError.message
        return { success: false, error: deleteError.message }
      }

      // Remove from local state
      quotes.value = quotes.value.filter((q) => q.id !== id)

      // Clear currentQuote if it was the deleted one
      if (currentQuote.value?.id === id) {
        currentQuote.value = null
      }

      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while deleting the quote.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Realtime Subscriptions ──────────────────────────────────────────────────

  /**
   * Subscribe to quotes table changes via Supabase Realtime (Requirement 11.1).
   * When any user saves or updates a quote, the quote list is refreshed
   * within 10 seconds for all active sessions (primarily for admin overview).
   */
  function subscribeToRealtime(): void {
    if (realtimeChannel) return // already subscribed

    realtimeChannel = supabase
      .channel('quotes:all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        () => {
          // Refetch quotes list to reflect changes from other users
          fetchQuotes()
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
    quotes,
    currentQuote,
    loading,
    error,

    // Actions
    fetchQuotes,
    saveQuote,
    updateQuote,
    loadQuote,
    deleteQuote,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  }
})
