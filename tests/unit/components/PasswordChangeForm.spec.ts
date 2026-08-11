import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PasswordChangeForm from '@/components/PasswordChangeForm.vue'
import { useAuthStore } from '@/stores/auth'

// Mock the supabase service
vi.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
}))

function createWrapper() {
  return mount(PasswordChangeForm, {
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the form with all required fields', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('h2').text()).toBe('Change Password')
    expect(wrapper.find('#current-password').exists()).toBe(true)
    expect(wrapper.find('#new-password').exists()).toBe(true)
    expect(wrapper.find('#confirm-password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('disables submit button when form is empty', () => {
    const wrapper = createWrapper()
    const submitBtn = wrapper.find('button[type="submit"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows validation error when new password is too short', async () => {
    const wrapper = createWrapper()

    await wrapper.find('#new-password').setValue('short')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Password must be at least 8 characters.')
  })

  it('shows validation error when new password is too long', async () => {
    const wrapper = createWrapper()
    const longPassword = 'a'.repeat(129)

    await wrapper.find('#new-password').setValue(longPassword)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Password must be at most 128 characters.')
  })

  it('shows hint text for valid password length', async () => {
    const wrapper = createWrapper()

    // Before typing - hint is shown
    expect(wrapper.text()).toContain('Must be 8–128 characters.')
  })

  it('shows mismatch error when confirm password does not match', async () => {
    const wrapper = createWrapper()

    await wrapper.find('#new-password').setValue('validpassword123')
    await wrapper.find('#confirm-password').setValue('differentpassword')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Passwords do not match.')
  })

  it('enables submit button when form is valid', async () => {
    const wrapper = createWrapper()

    await wrapper.find('#current-password').setValue('currentPass1')
    await wrapper.find('#new-password').setValue('newPassword123')
    await wrapper.find('#confirm-password').setValue('newPassword123')
    await wrapper.vm.$nextTick()

    const submitBtn = wrapper.find('button[type="submit"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows success message on successful password change', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()

    // Set up authenticated state
    authStore.user = { id: '1', display_name: 'Test', role: 'admin', user_id: '1', is_active: true } as any
    authStore.session = { user: { email: 'test@example.com' } } as any

    // Mock successful changePassword
    vi.spyOn(authStore, 'changePassword').mockResolvedValue({ success: true })

    await wrapper.find('#current-password').setValue('currentPass1')
    await wrapper.find('#new-password').setValue('newPassword123')
    await wrapper.find('#confirm-password').setValue('newPassword123')
    await wrapper.find('form').trigger('submit')

    // Wait for async operation
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Password changed successfully.')
    })
  })

  it('shows error message on failed password change', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()

    authStore.user = { id: '1', display_name: 'Test', role: 'admin', user_id: '1', is_active: true } as any
    authStore.session = { user: { email: 'test@example.com' } } as any

    // Mock failed changePassword
    vi.spyOn(authStore, 'changePassword').mockResolvedValue({
      success: false,
      error: 'Current password is incorrect.',
    })

    await wrapper.find('#current-password').setValue('wrongPassword')
    await wrapper.find('#new-password').setValue('newPassword123')
    await wrapper.find('#confirm-password').setValue('newPassword123')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Current password is incorrect.')
    })
  })

  it('clears the form after successful password change', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()

    authStore.user = { id: '1', display_name: 'Test', role: 'admin', user_id: '1', is_active: true } as any
    authStore.session = { user: { email: 'test@example.com' } } as any

    vi.spyOn(authStore, 'changePassword').mockResolvedValue({ success: true })

    await wrapper.find('#current-password').setValue('currentPass1')
    await wrapper.find('#new-password').setValue('newPassword123')
    await wrapper.find('#confirm-password').setValue('newPassword123')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect((wrapper.find('#current-password').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('#new-password').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('#confirm-password').element as HTMLInputElement).value).toBe('')
    })
  })

  it('shows loading state while submitting', async () => {
    const wrapper = createWrapper()
    const authStore = useAuthStore()

    authStore.user = { id: '1', display_name: 'Test', role: 'admin', user_id: '1', is_active: true } as any
    authStore.session = { user: { email: 'test@example.com' } } as any

    // Mock a slow changePassword
    vi.spyOn(authStore, 'changePassword').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    )

    await wrapper.find('#current-password').setValue('currentPass1')
    await wrapper.find('#new-password').setValue('newPassword123')
    await wrapper.find('#confirm-password').setValue('newPassword123')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Changing...')
  })
})
