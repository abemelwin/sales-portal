import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quotes/new',
    name: 'quote-new',
    component: () => import('@/views/QuoteBuilderView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quotes/:id',
    name: 'quote-edit',
    component: () => import('@/views/QuoteBuilderView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quotes/:id/closing',
    name: 'quote-closing',
    component: () => import('@/views/ClosingDocsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/closing-docs',
    name: 'closing-docs-index',
    component: () => import('@/views/QuoteBuilderView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/product-info',
    name: 'product-info',
    component: () => import('@/views/ProductInfoView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/views/CatalogEditorView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/RoleManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/migrate',
    name: 'migrate',
    component: () => import('@/views/DataMigrationView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/views/ChangePasswordView.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const { supabase } = await import('@/services/supabase')
  const authStore = useAuthStore()

  // On page reload, the store may not have session yet.
  // Check Supabase directly - getSession() reads from localStorage (instant).
  if (!authStore.session) {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      authStore.session = data.session
    }
  }

  // Determine if user has a valid session (token exists)
  const hasSession = !!authStore.session

  // If we have a session but no user profile yet, fetch it
  if (hasSession && !authStore.user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authStore.session!.user.id)
      .eq('is_active', true)
      .single()
    if (profile) {
      authStore.user = profile as any
      authStore.role = (profile as any).role || 'user'
    }
  }

  const isAuthenticated = hasSession && !!authStore.user

  // Redirect authenticated users away from login page
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    // If we have a session token but profile fetch failed, still allow access
    // This handles the case where RLS blocks the profile query
    if (hasSession) {
      // User is authenticated but profile not loaded - allow navigation
      return
    }
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Admin routes: elevated roles get access
  const adminRoles = ['superadmin', 'product_manager', 'product_technical_head', 'service_manager', 'sales_admin_manager', 'sales_admin_supervisor']
  if (to.meta.requiresAdmin && !adminRoles.includes(authStore.role || '')) {
    // If role not loaded yet but has session, allow (profile will load async)
    if (hasSession && !authStore.role) return
    return { name: 'dashboard' }
  }
})

export default router
