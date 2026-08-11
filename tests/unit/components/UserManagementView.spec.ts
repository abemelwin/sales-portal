import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import UserManagementView from '@/views/UserManagementView.vue'
import { useUserStore } from '@/stores/users'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
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
    role: i % 3 === 0 ? 'admin' : 'salesperson',
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
    expect(wrapper.find('h1').text()).toBe('User Management')
  })

  it('displays "+ Create User" button', () => {
    const wrapper = mountView()
    const btn = wrapper.find('.btn-primary')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('+ Create User')
  })

  it('shows loading state while fetching users', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = true
    store.users = []
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading-state').exists()).toBe(true)
  })

  it('shows empty state when no users exist', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = []
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('displays user table with correct columns', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = createMockUsers(3) as any
    await wrapper.vm.$nextTick()

    const headers = wrapper.findAll('.user-table th')
    expect(headers.length).toBe(4)
    expect(headers[0].text()).toBe('Display Name')
    expect(headers[1].text()).toBe('Username')
    expect(headers[2].text()).toBe('Role')
    expect(headers[3].text()).toBe('Status')
  })

  it('displays users in the table rows', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = createMockUsers(3) as any
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('.user-table tbody tr')
    expect(rows.length).toBe(3)
    expect(rows[0].findAll('td')[0].text()).toBe('User 0')
  })

  it('shows role badges with correct styling', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = [
      { id: '1', user_id: 'uid1', display_name: 'Admin User', role: 'admin', is_active: true, created_at: '', updated_at: '' },
      { id: '2', user_id: 'uid2', display_name: 'Sales User', role: 'salesperson', is_active: true, created_at: '', updated_at: '' },
    ] as any
    await wrapper.vm.$nextTick()

    const badges = wrapper.findAll('.role-badge')
    expect(badges[0].text()).toBe('Admin')
    expect(badges[0].classes()).toContain('role-admin')
    expect(badges[1].text()).toBe('Salesperson')
    expect(badges[1].classes()).toContain('role-salesperson')
  })

  it('shows status badges with correct styling', async () => {
    const wrapper = mountView()
    const store = useUserStore()
    store.loading = false
    store.users = [
      { id: '1', user_id: 'uid1', display_name: 'Active', role: 'admin', is_active: true, created_at: '', updated_at: '' },
      { id: '2', user_id: 'uid2', display_name: 'Inactive', role: 'salesperson', is_active: false, created_at: '', updated_at: '' },
    ] as any
    await wrapper.vm.$nextTick()

    const badges = wrapper.findAll('.status-badge')
    expect(badges[0].text()).toBe('Active')
    expect(badges[0].classes()).toContain('status-active')
    expect(badges[1].text()).toBe('Inactive')
    expect(badges[1].classes()).toContain('status-inactive')
  })

  describe('Pagination', () => {
    it('paginates users with max 50 rows per page', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      store.loading = false
      store.users = createMockUsers(75) as any
      await wrapper.vm.$nextTick()

      // Trigger pagination totalCount update
      // The component sets totalCount on mount, so manually trigger
      const rows = wrapper.findAll('.user-table tbody tr')
      expect(rows.length).toBeLessThanOrEqual(50)
    })

    it('shows pagination controls when multiple pages exist', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      store.loading = false
      store.users = createMockUsers(75) as any
      await wrapper.vm.$nextTick()

      // Verify table is rendering
      const table = wrapper.find('.user-table')
      expect(table.exists()).toBe(true)

      const rows = wrapper.findAll('.user-table tbody tr')
      expect(rows.length).toBe(50) // first page should show 50

      const paginationNav = wrapper.find('nav[aria-label="User table pagination"]')
      expect(paginationNav.exists()).toBe(true)
    })

    it('does not show pagination controls when all users fit on one page', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      store.loading = false
      store.users = createMockUsers(10) as any
      await wrapper.vm.$nextTick()

      const paginationNav = wrapper.find('.pagination')
      expect(paginationNav.exists()).toBe(false)
    })
  })

  describe('Create User Form', () => {
    it('opens create form modal on button click', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      store.loading = false
      store.users = []
      await wrapper.vm.$nextTick()

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('#create-user-title').text()).toBe('Create New User')
    })

    it('closes modal on cancel click', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      const cancelBtn = wrapper.findAll('.modal-actions .btn-secondary')[0]
      await cancelBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('shows all required form fields', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('#create-username').exists()).toBe(true)
      expect(wrapper.find('#create-display-name').exists()).toBe(true)
      expect(wrapper.find('#create-password').exists()).toBe(true)
      expect(wrapper.find('#create-role').exists()).toBe(true)
    })

    it('validates username is required', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      // Submit with empty form
      const form = wrapper.find('form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      const errors = wrapper.findAll('.field-error')
      expect(errors.length).toBeGreaterThan(0)
      const usernameError = wrapper.find('#create-username')
        .element.parentElement?.querySelector('.field-error')
      expect(usernameError?.textContent).toContain('Username is required')
    })

    it('validates username minimum length (3 chars)', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('ab')
      await wrapper.find('#create-display-name').setValue('Test User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      const errors = wrapper.findAll('.field-error')
      const usernameErrors = errors.filter(e => e.text().includes('at least 3'))
      expect(usernameErrors.length).toBe(1)
    })

    it('validates username characters (alphanumeric + underscores only)', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('user@name!')
      await wrapper.find('#create-display-name').setValue('Test User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      const errors = wrapper.findAll('.field-error')
      const usernameErrors = errors.filter(e => e.text().includes('letters, numbers, and underscores'))
      expect(usernameErrors.length).toBe(1)
    })

    it('validates display name is required', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('valid_user')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      const errors = wrapper.findAll('.field-error')
      const dnErrors = errors.filter(e => e.text().includes('Display name is required'))
      expect(dnErrors.length).toBe(1)
    })

    it('validates password minimum length (8 chars)', async () => {
      const wrapper = mountView()
      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('valid_user')
      await wrapper.find('#create-display-name').setValue('Test User')
      await wrapper.find('#create-password').setValue('short')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      const errors = wrapper.findAll('.field-error')
      const pwErrors = errors.filter(e => e.text().includes('at least 8'))
      expect(pwErrors.length).toBe(1)
    })

    it('calls createUser store action on valid submission', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      const createSpy = vi.spyOn(store, 'createUser').mockResolvedValue({ success: true })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('new_user')
      await wrapper.find('#create-display-name').setValue('New User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      expect(createSpy).toHaveBeenCalledWith({
        username: 'new_user',
        display_name: 'New User',
        password: 'password123',
        role: 'salesperson',
      })
    })

    it('shows success message after user creation', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      vi.spyOn(store, 'createUser').mockResolvedValue({ success: true })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('new_user')
      await wrapper.find('#create-display-name').setValue('New User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      expect(wrapper.find('.alert-success').exists()).toBe(true)
      expect(wrapper.find('.alert-success').text()).toContain('New User')
    })

    it('shows duplicate username error from server', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      vi.spyOn(store, 'createUser').mockResolvedValue({
        success: false,
        error: 'Username already taken',
      })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('existing_user')
      await wrapper.find('#create-display-name').setValue('Existing User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      const errors = wrapper.findAll('.field-error')
      const dupErrors = errors.filter(e => e.text().includes('already taken'))
      expect(dupErrors.length).toBe(1)
    })

    it('shows server error for non-duplicate failures', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      vi.spyOn(store, 'createUser').mockResolvedValue({
        success: false,
        error: 'Network error occurred',
      })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('new_user')
      await wrapper.find('#create-display-name').setValue('New User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      expect(wrapper.find('.modal .alert-error').exists()).toBe(true)
      expect(wrapper.find('.modal .alert-error').text()).toBe('Network error occurred')
    })

    it('closes modal on successful user creation', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      vi.spyOn(store, 'createUser').mockResolvedValue({ success: true })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('new_user')
      await wrapper.find('#create-display-name').setValue('New User')
      await wrapper.find('#create-password').setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('allows selecting admin role', async () => {
      const wrapper = mountView()
      const store = useUserStore()
      const createSpy = vi.spyOn(store, 'createUser').mockResolvedValue({ success: true })

      await wrapper.find('.btn-primary').trigger('click')
      await wrapper.vm.$nextTick()

      await wrapper.find('#create-username').setValue('admin_user')
      await wrapper.find('#create-display-name').setValue('Admin User')
      await wrapper.find('#create-password').setValue('password123')
      await wrapper.find('#create-role').setValue('admin')

      const form = wrapper.find('form')
      await form.trigger('submit')
      await flushPromises()

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      )
    })
  })
})
