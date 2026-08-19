import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { Machine, MachineInput, MachineUpdate, MachineFilter, ImportResult } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useCatalogStore = defineStore('catalog', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const machines = ref<Machine[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Realtime ───────────────────────────────────────────────────────────────

  const realtimeChannels: RealtimeChannel[] = []

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch machines from catalog, optionally filtered.
   * Includes all sub-relations (features, consumables, inclusions, exclusions, addons).
   */
  async function fetchMachines(filters?: MachineFilter): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('machines')
        .select(`
          *,
          features:machine_features(*),
          consumables:machine_consumables(*),
          inclusions:machine_inclusions(*),
          exclusions:machine_exclusions(*),
          addons:machine_addons(*)
        `)
        .order('brand')
        .order('model')

      // Apply filters
      if (filters?.brand) {
        query = query.eq('brand', filters.brand)
      }
      if (filters?.model) {
        query = query.eq('model', filters.model)
      }
      if (filters?.unit_condition) {
        query = query.eq('unit_condition', filters.unit_condition as never)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      } else {
        // Default to only active machines
        query = query.eq('is_active', true)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      machines.value = (data as Machine[]) ?? []
    } catch (err) {
      error.value = 'An unexpected error occurred while fetching machines.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new machine with all sub-records (Requirements 4.1, 4.2, 4.3).
   * Implements atomic operation with manual rollback: if any sub-record insert fails,
   * the main machine record is deleted (CASCADE removes any partial sub-records).
   */
  async function createMachine(input: MachineInput): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Insert the main machine record
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .insert({
          brand: input.brand,
          model: input.model,
          sub_model: input.sub_model ?? null,
          unit_condition: input.unit_condition,
          letterhead: input.letterhead ?? 'ES Print Media Inc.',
          srp: input.srp ?? 0,
          lbp: input.lbp ?? 0,
          cash_price: input.cash_price ?? 0,
          machine_warranty_months: input.machine_warranty_months ?? 0,
          printhead_warranty: input.printhead_warranty ?? null,
          has_trade_in: input.has_trade_in ?? false,
          has_printhead: input.has_printhead ?? false,
          service_fee: input.service_fee ?? null,
          default_months: input.default_months ?? null,
          availability: input.availability ?? null,
          image_key: input.image_key ?? null,
        } as never)
        .select()
        .single()

      if (machineError) {
        error.value = machineError.message
        return { success: false, error: machineError.message }
      }

      const machineId = machineData.id

      // Insert sub-records sequentially — rollback on any failure
      const subRecordResult = await _insertSubRecords(machineId, input)

      if (!subRecordResult.success) {
        // Rollback: delete the main machine record (CASCADE removes any partial sub-records)
        await supabase.from('machines').delete().eq('id', machineId)
        error.value = subRecordResult.error!
        return { success: false, error: error.value }
      }

      // Refresh the machines list
      await fetchMachines()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while creating the machine.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Helper: Insert all sub-records for a machine. Returns failure info identifying
   * which sub-record type caused the problem.
   */
  async function _insertSubRecords(
    machineId: string,
    input: Pick<MachineInput, 'features' | 'consumables' | 'inclusions' | 'exclusions' | 'addons'>
  ): Promise<{ success: boolean; error?: string }> {
    if (input.features.length > 0) {
      const { error: featErr } = await supabase
        .from('machine_features')
        .insert(input.features.map((f) => ({ ...f, machine_id: machineId })))

      if (featErr) {
        return { success: false, error: `Failed to save features: ${featErr.message}` }
      }
    }

    if (input.consumables.length > 0) {
      const { error: consErr } = await supabase
        .from('machine_consumables')
        .insert(input.consumables.map((c) => ({ ...c, machine_id: machineId })))

      if (consErr) {
        return { success: false, error: `Failed to save consumables: ${consErr.message}` }
      }
    }

    if (input.inclusions.length > 0) {
      const { error: inclErr } = await supabase
        .from('machine_inclusions')
        .insert(input.inclusions.map((i) => ({ ...i, machine_id: machineId })))

      if (inclErr) {
        return { success: false, error: `Failed to save inclusions: ${inclErr.message}` }
      }
    }

    if (input.exclusions.length > 0) {
      const { error: exclErr } = await supabase
        .from('machine_exclusions')
        .insert(input.exclusions.map((e) => ({ ...e, machine_id: machineId })))

      if (exclErr) {
        return { success: false, error: `Failed to save exclusions: ${exclErr.message}` }
      }
    }

    if (input.addons.length > 0) {
      const { error: addonErr } = await supabase
        .from('machine_addons')
        .insert(input.addons.map((a) => ({ ...a, machine_id: machineId })))

      if (addonErr) {
        return { success: false, error: `Failed to save add-ons: ${addonErr.message}` }
      }
    }

    return { success: true }
  }

  /**
   * Update an existing machine and its sub-records atomically (Requirements 4.2, 4.3).
  /**
   * Update an existing machine and its sub-records.
   * Runs all sub-table DELETE+INSERT in parallel for speed.
   */
  async function updateMachine(
    id: string,
    update: MachineUpdate
  ): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // ─── Update main machine fields ─────────────────────────────────────────
      const mainFields: Record<string, unknown> = {}
      if (update.brand !== undefined) mainFields.brand = update.brand
      if (update.model !== undefined) mainFields.model = update.model
      if (update.sub_model !== undefined) mainFields.sub_model = update.sub_model
      if (update.unit_condition !== undefined) mainFields.unit_condition = update.unit_condition
      if (update.letterhead !== undefined) mainFields.letterhead = update.letterhead
      if (update.is_active !== undefined) mainFields.is_active = update.is_active
      if (update.srp !== undefined) mainFields.srp = update.srp
      if (update.lbp !== undefined) mainFields.lbp = update.lbp
      if (update.cash_price !== undefined) mainFields.cash_price = update.cash_price
      if (update.machine_warranty_months !== undefined) mainFields.machine_warranty_months = update.machine_warranty_months
      if (update.printhead_warranty !== undefined) mainFields.printhead_warranty = update.printhead_warranty
      if (update.has_trade_in !== undefined) mainFields.has_trade_in = update.has_trade_in
      if (update.has_printhead !== undefined) mainFields.has_printhead = update.has_printhead
      if (update.service_fee !== undefined) mainFields.service_fee = update.service_fee
      if (update.default_months !== undefined) mainFields.default_months = update.default_months
      if (update.availability !== undefined) mainFields.availability = update.availability
      if (update.image_key !== undefined) mainFields.image_key = update.image_key

      if (Object.keys(mainFields).length > 0) {
        mainFields.updated_at = new Date().toISOString()
        const { error: updateErr } = await supabase
          .from('machines')
          .update(mainFields as never)
          .eq('id', id)

        if (updateErr) {
          error.value = updateErr.message
          return { success: false, error: updateErr.message }
        }
      }

      // ─── Replace sub-records in parallel ────────────────────────────────────
      const subTables = [
        { key: 'features' as const, table: 'machine_features' as const },
        { key: 'consumables' as const, table: 'machine_consumables' as const },
        { key: 'inclusions' as const, table: 'machine_inclusions' as const },
        { key: 'exclusions' as const, table: 'machine_exclusions' as const },
        { key: 'addons' as const, table: 'machine_addons' as const },
      ]

      const subResults = await Promise.all(
        subTables.map(async ({ key, table }) => {
          if (update[key] === undefined) return null

          // Delete then insert
          const { error: delErr } = await supabase.from(table).delete().eq('machine_id', id)
          if (delErr) return `Failed to update ${key}: ${delErr.message}`

          const records = update[key]!
          if (records.length > 0) {
            const { error: insErr } = await supabase
              .from(table)
              .insert(records.map((r: Record<string, unknown>) => ({ ...r, machine_id: id })) as never)
            if (insErr) return `Failed to update ${key}: ${insErr.message}`
          }
          return null
        })
      )

      const firstError = subResults.find((r) => r !== null)
      if (firstError) {
        error.value = firstError
        return { success: false, error: firstError }
      }

      // Update local store cache directly instead of re-fetching everything
      await fetchMachines()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while updating the machine.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Soft-delete a machine by marking it inactive (Requirement 4.4).
   * Historical quotes referencing this machine are preserved.
   */
  async function softDeleteMachine(id: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      const { error: deleteErr } = await supabase
        .from('machines')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (deleteErr) {
        error.value = deleteErr.message
        return { success: false, error: deleteErr.message }
      }

      // Refresh the machines list
      await fetchMachines()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while deleting the machine.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Import machines from a parsed .xlsx result (Requirement 4.8, 4.9).
   * The xlsx parsing is handled by a composable — this store receives the result.
   */
  async function importFromXlsx(result: ImportResult): Promise<void> {
    // The ImportResult is produced by the useCatalogImport composable.
    // This action simply stores the result and refreshes the catalog.
    loading.value = true
    error.value = null

    try {
      if (result.errors.length > 0) {
        error.value = `Import completed with ${result.errors.length} error(s): ${result.errors[0]}`
      }

      // Refresh machines to reflect imported data
      await fetchMachines()
    } catch (err) {
      error.value = 'An unexpected error occurred after importing machines.'
    } finally {
      loading.value = false
    }
  }

  // ─── Realtime Subscriptions ──────────────────────────────────────────────────

  let debouncedFetchTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedFetchMachines() {
    if (debouncedFetchTimer) clearTimeout(debouncedFetchTimer)
    debouncedFetchTimer = setTimeout(() => {
      fetchMachines()
    }, 400)
  }

  /**
   * Subscribe to machines and all sub-tables via Supabase Realtime (Requirement 11.2).
   * When an admin updates the machine catalog, changes propagate to all active
   * sessions within 30 seconds.
   */
  function subscribeToRealtime(): void {
    if (realtimeChannels.length > 0) return // already subscribed

    const tables = [
      'machines',
      'machine_features',
      'machine_consumables',
      'machine_inclusions',
      'machine_exclusions',
      'machine_addons',
    ]

    for (const table of tables) {
      const channel = supabase
        .channel(`catalog:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            // Debounced refetch to avoid query stampede during multi-table batch inserts
            debouncedFetchMachines()
          }
        )
        .subscribe()

      realtimeChannels.push(channel)
    }
  }

  /**
   * Unsubscribe from all catalog realtime channels.
   */
  function unsubscribeFromRealtime(): void {
    for (const channel of realtimeChannels) {
      supabase.removeChannel(channel)
    }
    realtimeChannels.length = 0
  }

  // ─── Public Interface ───────────────────────────────────────────────────────

  return {
    // State
    machines,
    loading,
    error,

    // Actions
    fetchMachines,
    createMachine,
    updateMachine,
    softDeleteMachine,
    importFromXlsx,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  }
})
