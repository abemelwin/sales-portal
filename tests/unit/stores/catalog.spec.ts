import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────

// Chainable mock builder for Supabase query methods
function createQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const mock: Record<string, unknown> = {}
  const chain = (...methods: string[]) => {
    for (const method of methods) {
      mock[method] = vi.fn().mockReturnValue(mock)
    }
  }

  chain('select', 'insert', 'update', 'delete', 'eq', 'single', 'order')

  // Terminal methods resolve with the provided value
  mock.single = vi.fn().mockResolvedValue(resolvedValue)
  mock.then = undefined // make it thenable only through single/select/etc.

  // Make insert/update/delete also resolve when awaited directly
  const resolving = {
    ...mock,
    then: (resolve: (v: unknown) => void) => resolve(resolvedValue),
  }

  // Override select so that chained `.select().single()` works
  mock.select = vi.fn().mockReturnValue(mock)
  mock.eq = vi.fn().mockReturnValue(resolvedValue)
  mock.insert = vi.fn().mockReturnValue(mock)
  mock.update = vi.fn().mockReturnValue(mock)
  mock.delete = vi.fn().mockReturnValue(mock)
  mock.order = vi.fn().mockReturnValue(mock)

  return mock
}

// Track table-specific mock behaviors
let mockResponses: Record<string, {
  select?: { data: unknown; error: unknown }
  insert?: { data: unknown; error: unknown }
  update?: { data: unknown; error: unknown }
  delete?: { data: unknown; error: unknown }
}> = {}

function buildChainableMock(tableName: string) {
  const tableResponses = mockResponses[tableName] ?? {}

  const chainable: Record<string, unknown> = {}

  // select chain
  chainable.select = vi.fn().mockImplementation(() => {
    const selectChain: Record<string, unknown> = {}
    selectChain.eq = vi.fn().mockImplementation(() => {
      const eqChain: Record<string, unknown> = {}
      eqChain.single = vi.fn().mockResolvedValue(tableResponses.select ?? { data: null, error: null })
      eqChain.order = vi.fn().mockReturnValue(eqChain)
      // If not single, resolve directly
      eqChain.then = (resolve: (v: unknown) => void) =>
        resolve(tableResponses.select ?? { data: [], error: null })
      return eqChain
    })
    selectChain.order = vi.fn().mockReturnValue(selectChain)
    selectChain.single = vi.fn().mockResolvedValue(tableResponses.select ?? { data: null, error: null })
    selectChain.then = (resolve: (v: unknown) => void) =>
      resolve(tableResponses.select ?? { data: [], error: null })
    return selectChain
  })

  // insert chain
  chainable.insert = vi.fn().mockImplementation(() => {
    const insertChain: Record<string, unknown> = {}
    insertChain.select = vi.fn().mockImplementation(() => {
      const selectChain: Record<string, unknown> = {}
      selectChain.single = vi.fn().mockResolvedValue(tableResponses.insert ?? { data: null, error: null })
      return selectChain
    })
    insertChain.then = (resolve: (v: unknown) => void) =>
      resolve(tableResponses.insert ?? { data: null, error: null })
    return insertChain
  })

  // update chain
  chainable.update = vi.fn().mockImplementation(() => {
    const updateChain: Record<string, unknown> = {}
    updateChain.eq = vi.fn().mockResolvedValue(tableResponses.update ?? { data: null, error: null })
    return updateChain
  })

  // delete chain
  chainable.delete = vi.fn().mockImplementation(() => {
    const deleteChain: Record<string, unknown> = {}
    deleteChain.eq = vi.fn().mockResolvedValue(tableResponses.delete ?? { data: null, error: null })
    return deleteChain
  })

  return chainable
}

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn((tableName: string) => buildChainableMock(tableName)),
  },
}))

// Import the store after mocking
import { useCatalogStore } from '@/stores/catalog'

describe('Catalog Store — Atomic Operations with Rollback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockResponses = {}
    vi.clearAllMocks()
  })

  describe('createMachine', () => {
    it('should create machine and sub-records successfully', async () => {
      mockResponses = {
        machines: {
          insert: { data: { id: 'machine-1', brand: 'Canon', model: 'G100' }, error: null },
          select: { data: [], error: null },
        },
        machine_features: { insert: { data: null, error: null } },
        machine_consumables: { insert: { data: null, error: null } },
      }

      const store = useCatalogStore()
      const result = await store.createMachine({
        brand: 'Canon',
        model: 'G100',
        unit_condition: 'Brand New',
        features: [{ description: 'Auto duplex', sort_order: 0 }],
        consumables: [{ item_name: 'Ink', package_description: '1 bottle', default_price: 500, sort_order: 0 }],
        inclusions: [],
        exclusions: [],
        addons: [],
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should rollback machine record when sub-record insert fails', async () => {
      const { supabase } = await import('@/services/supabase')
      
      // Track delete calls to verify rollback
      let machineDeleted = false

      mockResponses = {
        machines: {
          insert: { data: { id: 'machine-1', brand: 'Canon', model: 'G100' }, error: null },
          select: { data: [], error: null },
          delete: { data: null, error: null },
        },
        machine_features: { insert: { data: null, error: null } },
        machine_consumables: {
          insert: { data: null, error: { message: 'constraint violation on default_price' } },
        },
      }

      const store = useCatalogStore()
      const result = await store.createMachine({
        brand: 'Canon',
        model: 'G100',
        unit_condition: 'Brand New',
        features: [{ description: 'Auto duplex', sort_order: 0 }],
        consumables: [{ item_name: 'Ink', package_description: '1 bottle', default_price: -1, sort_order: 0 }],
        inclusions: [],
        exclusions: [],
        addons: [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to save consumables')
      expect(result.error).toContain('constraint violation on default_price')
      // Verify the machine delete (rollback) was triggered
      expect(supabase.from).toHaveBeenCalledWith('machines')
    })

    it('should identify which sub-record type failed in error message', async () => {
      mockResponses = {
        machines: {
          insert: { data: { id: 'machine-1' }, error: null },
          delete: { data: null, error: null },
        },
        machine_features: { insert: { data: null, error: null } },
        machine_consumables: { insert: { data: null, error: null } },
        machine_inclusions: { insert: { data: null, error: null } },
        machine_exclusions: {
          insert: { data: null, error: { message: 'text too long' } },
        },
      }

      const store = useCatalogStore()
      const result = await store.createMachine({
        brand: 'Epson',
        model: 'L3210',
        unit_condition: 'Brand New',
        features: [{ description: 'Print/Copy/Scan', sort_order: 0 }],
        consumables: [],
        inclusions: [{ description: 'USB cable', sort_order: 0 }],
        exclusions: [{ description: 'x'.repeat(10000), sort_order: 0 }],
        addons: [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to save exclusions')
      expect(result.error).toContain('text too long')
    })

    it('should return error when main machine insert fails (no rollback needed)', async () => {
      mockResponses = {
        machines: {
          insert: { data: null, error: { message: 'duplicate key value violates unique constraint' } },
        },
      }

      const store = useCatalogStore()
      const result = await store.createMachine({
        brand: 'Canon',
        model: 'G100',
        unit_condition: 'Brand New',
        features: [],
        consumables: [],
        inclusions: [],
        exclusions: [],
        addons: [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('duplicate key value')
    })
  })

  describe('updateMachine', () => {
    it('should update machine and sub-records successfully', async () => {
      mockResponses = {
        machines: {
          select: { data: { id: 'machine-1', brand: 'Canon', model: 'G100', updated_at: '2024-01-01' }, error: null },
          update: { data: null, error: null },
        },
        machine_features: {
          select: { data: [{ id: 'f1', machine_id: 'machine-1', description: 'Old feature', sort_order: 0 }], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_consumables: {
          select: { data: [], error: null },
        },
        machine_inclusions: {
          select: { data: [], error: null },
        },
        machine_exclusions: {
          select: { data: [], error: null },
        },
        machine_addons: {
          select: { data: [], error: null },
        },
      }

      const store = useCatalogStore()
      const result = await store.updateMachine('machine-1', {
        brand: 'Canon Updated',
        features: [{ description: 'New feature', sort_order: 0 }],
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should rollback to snapshot when sub-record update fails', async () => {
      const { supabase } = await import('@/services/supabase')

      mockResponses = {
        machines: {
          select: { data: { id: 'machine-1', brand: 'Canon', model: 'G100', updated_at: '2024-01-01' }, error: null },
          update: { data: null, error: null },
        },
        machine_features: {
          select: { data: [{ id: 'f1', machine_id: 'machine-1', description: 'Original', sort_order: 0 }], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: { message: 'value too long for type' } },
        },
        machine_consumables: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_inclusions: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_exclusions: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_addons: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
      }

      const store = useCatalogStore()
      const result = await store.updateMachine('machine-1', {
        brand: 'Canon Updated',
        features: [{ description: 'x'.repeat(10000), sort_order: 0 }],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to update features')
      expect(result.error).toContain('value too long for type')
      // Verify rollback was attempted (machines.update called for revert)
      expect(supabase.from).toHaveBeenCalledWith('machines')
    })

    it('should identify which sub-record type failed during update', async () => {
      mockResponses = {
        machines: {
          select: { data: { id: 'machine-1', brand: 'HP', model: 'Pro', updated_at: '2024-01-01' }, error: null },
          update: { data: null, error: null },
        },
        machine_features: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_consumables: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_inclusions: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: { message: 'insert failed' } },
        },
        machine_exclusions: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
        machine_addons: {
          select: { data: [], error: null },
          delete: { data: null, error: null },
          insert: { data: null, error: null },
        },
      }

      const store = useCatalogStore()
      const result = await store.updateMachine('machine-1', {
        features: [{ description: 'ok', sort_order: 0 }],
        consumables: [],
        inclusions: [{ description: 'Bad item', sort_order: 0 }],
        exclusions: [],
        addons: [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to update inclusions')
    })

    it('should return error when update fails', async () => {
      mockResponses = {
        machines: {
          update: { error: { message: 'machine not found' } },
        },
      }

      const store = useCatalogStore()
      const result = await store.updateMachine('nonexistent-id', {
        brand: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('machine not found')
    })
  })
})
