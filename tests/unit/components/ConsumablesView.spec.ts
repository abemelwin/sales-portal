import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ConsumablesView from '@/views/ConsumablesView.vue'

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockConsumables = [
  { id: '1', item_name: 'Black Ink Cartridge', package_description: '1 per box', default_price: 250.00 },
  { id: '2', item_name: 'Cyan Toner', package_description: '500g pack', default_price: 1200.50 },
  { id: '3', item_name: 'A4 Paper', package_description: '500 sheets', default_price: 180.00 },
  { id: '4', item_name: 'Drum Unit', package_description: null, default_price: 3500.00 },
  { id: '5', item_name: 'Fuser Kit', package_description: '1 unit', default_price: 8000.00 },
]

const mockSelectFn = vi.fn()
const mockOrderFn = vi.fn()

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelectFn,
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}))

function setupSuccessMock(data = mockConsumables) {
  mockOrderFn.mockResolvedValue({ data, error: null })
  mockSelectFn.mockReturnValue({ order: mockOrderFn })
}

function setupErrorMock(message = 'Network error') {
  mockOrderFn.mockResolvedValue({ data: null, error: { message } })
  mockSelectFn.mockReturnValue({ order: mockOrderFn })
}

function mountView() {
  return mount(ConsumablesView, {
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('ConsumablesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('displays the page title', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()
      expect(wrapper.find('h1').text()).toBe('Consumables Pricelist')
    })

    it('shows loading state initially', async () => {
      // Use a delayed mock to keep the loading state visible
      mockSelectFn.mockReturnValue({
        order: vi.fn().mockReturnValue(new Promise(() => { /* never resolves */ })),
      })
      const wrapper = mountView()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.loading-state').exists()).toBe(true)
    })

    it('displays consumables in a table after load', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const rows = wrapper.findAll('.consumables-table tbody tr')
      expect(rows.length).toBe(5)
    })

    it('displays item name, packaging, and price columns', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const headers = wrapper.findAll('.consumables-table thead th')
      expect(headers[0].text()).toContain('Item Name')
      expect(headers[1].text()).toContain('Packaging')
      expect(headers[2].text()).toContain('Price')
    })

    it('shows dash for null package_description', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      // Drum Unit has null package_description and should show after sorting
      const rows = wrapper.findAll('.consumables-table tbody tr')
      // Default sort is alphabetical by item_name: A4 Paper, Black Ink, Cyan Toner, Drum Unit, Fuser Kit
      const drumRow = rows[3]
      const cells = drumRow.findAll('td')
      expect(cells[1].text()).toBe('—')
    })
  })

  describe('sorting', () => {
    it('sorts by item name ascending by default', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const rows = wrapper.findAll('.consumables-table tbody tr')
      const names = rows.map((r) => r.findAll('td')[0].text())
      expect(names).toEqual([
        'A4 Paper',
        'Black Ink Cartridge',
        'Cyan Toner',
        'Drum Unit',
        'Fuser Kit',
      ])
    })

    it('toggles item name sort to descending on click', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const headers = wrapper.findAll('.consumables-table thead th')
      await headers[0].trigger('click')

      const rows = wrapper.findAll('.consumables-table tbody tr')
      const names = rows.map((r) => r.findAll('td')[0].text())
      expect(names).toEqual([
        'Fuser Kit',
        'Drum Unit',
        'Cyan Toner',
        'Black Ink Cartridge',
        'A4 Paper',
      ])
    })

    it('sorts by price when price header is clicked', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const headers = wrapper.findAll('.consumables-table thead th')
      await headers[2].trigger('click') // Price header

      const rows = wrapper.findAll('.consumables-table tbody tr')
      const names = rows.map((r) => r.findAll('td')[0].text())
      // Ascending by price: A4 Paper (180), Black Ink (250), Cyan Toner (1200.5), Drum Unit (3500), Fuser Kit (8000)
      expect(names).toEqual([
        'A4 Paper',
        'Black Ink Cartridge',
        'Cyan Toner',
        'Drum Unit',
        'Fuser Kit',
      ])
    })

    it('sorts by packaging when packaging header is clicked', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const headers = wrapper.findAll('.consumables-table thead th')
      await headers[1].trigger('click') // Packaging header

      const rows = wrapper.findAll('.consumables-table tbody tr')
      // Null sorts as empty string (first in asc order)
      const firstRowName = rows[0].findAll('td')[0].text()
      expect(firstRowName).toBe('Drum Unit') // null package_description sorts first
    })
  })

  describe('filtering', () => {
    it('filters consumables by item name', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const input = wrapper.find('.filter-input')
      await input.setValue('ink')

      const rows = wrapper.findAll('.consumables-table tbody tr')
      expect(rows.length).toBe(1)
      expect(rows[0].findAll('td')[0].text()).toBe('Black Ink Cartridge')
    })

    it('filter is case-insensitive', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const input = wrapper.find('.filter-input')
      await input.setValue('CYAN')

      const rows = wrapper.findAll('.consumables-table tbody tr')
      expect(rows.length).toBe(1)
      expect(rows[0].findAll('td')[0].text()).toBe('Cyan Toner')
    })

    it('shows empty state when filter matches nothing', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const input = wrapper.find('.filter-input')
      await input.setValue('nonexistent')

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state p').text()).toContain('matching your filter')
    })
  })

  describe('pagination', () => {
    it('uses page size of 25 by default', async () => {
      // Generate 30 consumables
      const manyConsumables = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        item_name: `Item ${String(i + 1).padStart(2, '0')}`,
        package_description: 'pack',
        default_price: (i + 1) * 10,
      }))
      setupSuccessMock(manyConsumables)
      const wrapper = mountView()
      await flushPromises()

      const rows = wrapper.findAll('.consumables-table tbody tr')
      expect(rows.length).toBe(25)
    })

    it('shows pagination info with correct total', async () => {
      const manyConsumables = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        item_name: `Item ${String(i + 1).padStart(2, '0')}`,
        package_description: 'pack',
        default_price: (i + 1) * 10,
      }))
      setupSuccessMock(manyConsumables)
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('.pagination-info').text()).toContain('Page 1 of 2')
      expect(wrapper.find('.pagination-info').text()).toContain('30 items')
    })

    it('navigates to next page', async () => {
      const manyConsumables = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        item_name: `Item ${String(i + 1).padStart(2, '0')}`,
        package_description: 'pack',
        default_price: (i + 1) * 10,
      }))
      setupSuccessMock(manyConsumables)
      const wrapper = mountView()
      await flushPromises()

      const nextBtn = wrapper.findAll('.pagination-btn')[1]
      await nextBtn.trigger('click')

      const rows = wrapper.findAll('.consumables-table tbody tr')
      expect(rows.length).toBe(5) // 30 - 25 = 5 on page 2
    })

    it('disables previous button on first page', async () => {
      setupSuccessMock()
      const wrapper = mountView()
      await flushPromises()

      const prevBtn = wrapper.findAll('.pagination-btn')[0]
      expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('disables next button on last page', async () => {
      setupSuccessMock() // Only 5 items, fits in one page
      const wrapper = mountView()
      await flushPromises()

      const nextBtn = wrapper.findAll('.pagination-btn')[1]
      expect((nextBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('resets to first page when filter changes', async () => {
      const manyConsumables = Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        item_name: `Item ${String(i + 1).padStart(2, '0')}`,
        package_description: 'pack',
        default_price: (i + 1) * 10,
      }))
      setupSuccessMock(manyConsumables)
      const wrapper = mountView()
      await flushPromises()

      // Go to page 2
      const nextBtn = wrapper.findAll('.pagination-btn')[1]
      await nextBtn.trigger('click')
      expect(wrapper.find('.pagination-info').text()).toContain('Page 2')

      // Apply filter - should reset to page 1
      const input = wrapper.find('.filter-input')
      await input.setValue('Item 01')

      expect(wrapper.find('.pagination-info').text()).toContain('Page 1')
    })
  })

  describe('error handling', () => {
    it('shows error message when fetch fails', async () => {
      setupErrorMock('Failed to load consumables')
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state p').text()).toBe('Failed to load consumables')
    })

    it('shows retry button on error', async () => {
      setupErrorMock()
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('.retry-btn').exists()).toBe(true)
    })

    it('retries fetch when retry button is clicked', async () => {
      setupErrorMock()
      const wrapper = mountView()
      await flushPromises()

      // Now set up success for retry
      setupSuccessMock()
      await wrapper.find('.retry-btn').trigger('click')
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(false)
      expect(wrapper.findAll('.consumables-table tbody tr').length).toBe(5)
    })
  })
})
