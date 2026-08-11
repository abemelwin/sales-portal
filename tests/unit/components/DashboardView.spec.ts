import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ref, computed } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import { useDashboardStore } from '@/stores/dashboard'

// Mock composables
const mockRole = ref('admin')

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: computed(() => ({ id: 'user-1', email: 'test@example.com' })),
    role: mockRole,
    isAuthenticated: computed(() => true),
    loading: computed(() => false),
    error: computed(() => null),
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  }),
}))

vi.mock('@/composables/useRealtime', () => ({
  useRealtime: () => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    status: ref('connected'),
  }),
}))

vi.mock('@/composables/useReconnection', () => ({
  useReconnection: () => ({
    isDisconnected: ref(false),
    attemptCount: ref(0),
    isMaxAttemptsReached: computed(() => false),
    startReconnection: vi.fn(),
    stopReconnection: vi.fn(),
  }),
}))

vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/quotes/new', component: { template: '<div />' } },
    { path: '/pricelist', component: { template: '<div />' } },
    { path: '/consumables', component: { template: '<div />' } },
  ],
})

function mountDashboard() {
  return mount(DashboardView, {
    global: {
      plugins: [createPinia(), router],
    },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the dashboard title', () => {
    const wrapper = mountDashboard()
    expect(wrapper.find('.dashboard-title').text()).toBe('Dashboard')
  })

  it('displays monthly quote count card', () => {
    const wrapper = mountDashboard()
    const cards = wrapper.findAll('.data-card')
    expect(cards.length).toBeGreaterThanOrEqual(1)
    // First card shows quote count
    expect(cards[0].find('.data-card-count').text()).toBe('0')
    expect(cards[0].find('.data-card-label').text()).toBe('Quotes This Month')
  })

  it('displays active user count card for admin role', () => {
    const wrapper = mountDashboard()
    const cards = wrapper.findAll('.data-card')
    // Admin should see 2 cards
    expect(cards.length).toBe(2)
    expect(cards[1].find('.data-card-label').text()).toBe('Active Users')
  })

  it('provides navigation shortcuts to Quote Builder, Pricelist, and Consumables', () => {
    const wrapper = mountDashboard()
    const links = wrapper.findAll('.shortcut-link')
    expect(links.length).toBe(3)
    expect(links[0].attributes('href')).toBe('/quotes/new')
    expect(links[1].attributes('href')).toBe('/pricelist')
    expect(links[2].attributes('href')).toBe('/consumables')
  })

  it('shows error state with retry button when store has error', async () => {
    const wrapper = mountDashboard()
    const store = useDashboardStore()
    store.error = 'Failed to load dashboard data'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.dashboard-error').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('Failed to load dashboard data')
    expect(wrapper.find('.retry-button').exists()).toBe(true)
  })

  it('calls fetchCounts on retry button click', async () => {
    const wrapper = mountDashboard()
    const store = useDashboardStore()
    store.error = 'Network error'
    await wrapper.vm.$nextTick()

    const fetchCountsSpy = vi.spyOn(store, 'fetchCounts')
    await wrapper.find('.retry-button').trigger('click')
    expect(fetchCountsSpy).toHaveBeenCalled()
  })

  it('shows "0" for monthly quote count when no quotes exist', () => {
    const wrapper = mountDashboard()
    const store = useDashboardStore()
    store.monthlyQuoteCount = 0
    expect(wrapper.find('.data-card-count').text()).toBe('0')
  })
})
