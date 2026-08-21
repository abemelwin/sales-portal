import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import UserManagementView from '@/views/UserManagementView.vue'
import { useUserStore } from '@/stores/users'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
      },
    },
  },
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/users', component: UserManagementView },
    { path: '/', component: { template: '<div />' } },
  ],
})

function mountView() {
  return mount(UserManagementView, {
    global: {
      plugins: [createPinia(), router],
    },
  })
}

function createMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    user_id: `user-${i}-abcdefgh-1234`,
    display_name: `User ${i}`,
    email: `user${i}@espmi.local`,
    role: i % 3 === 0 ? 'superadmin' : 'user',
    is_active: i % 5 !== 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }))
}

describe('UserManagementView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the page title', () => {
    const wrapper = mountView()
    expect(wrapper.find('h2').text()).toBe('User & Access Management')
  })

  it('displays "+ Add User" button', () => {
    const wrapper = mountView()
    const btn = wrapper.find('.um-btn-add')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('+ Add User')
  })

  it('shows loading state while fetching users', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = true
    store.users = []
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.um-loading').exists()).toBe(true)
  })

  it('displays user table with correct columns', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = createMockUsers(3) as any
    await wrapper.vm.$nextTick()

    const headers = wrapper.findAll('.um-table th')
    expect(headers.length).toBe(3)
    expect(headers[0].text()).toBe('Username')
    expect(headers[1].text()).toBe('Role')
    expect(headers[2].text()).toBe('Actions')
  })

  it('displays users in the table rows', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = createMockUsers(3) as any
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('.um-table tbody tr')
    expect(rows.length).toBe(3)
  })

  describe('Add User Form', () => {
    it('shows validation error when email is missing', async () => {
      const wrapper = mountView()
      await wrapper.find('.um-btn-add').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.um-error').text()).toContain('Enter an email and password.')
    })

    it('shows validation error when email is invalid', async () => {
      const wrapper = mountView()
      const inputs = wrapper.findAll('.um-input')
      await inputs[0].setValue('invalidemail')
      await inputs[1].setValue('password123')

      await wrapper.find('.um-btn-add').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.um-error').text()).toContain('Enter a valid email address.')
    })

    it('calls createUser store action on valid submission', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      const createSpy = vi.spyOn(store, 'createUser').mockResolvedValue({ success: true })

      const inputs = wrapper.findAll('.um-input')
      await inputs[0].setValue('newuser@espmi.local')
      await inputs[1].setValue('password123')

      await wrapper.find('.um-btn-add').trigger('click')
      await flushPromises()

      expect(createSpy).toHaveBeenCalledWith({
        username: 'newuser@espmi.local',
        display_name: 'newuser@espmi.local',
        password: 'password123',
        role: 'user',
      })
    })
  })
})
