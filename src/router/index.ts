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
    path: '/pricelist',
    name: 'pricelist',
    component: () => import('@/views/PricelistView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/consumables',
    name: 'consumables',
    component: () => import('@/views/ConsumablesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/closing-docs',
    name: 'closing-docs-index',
    component: () => import('@/views/ClosingDocsIndexView.vue'),
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

  // If store has no session yet, try to get it directly from Supabase
  // This handles page reload where onAuthStateChange hasn't fired yet
  if (!authStore.session) {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      authStore.session = data.session
      // Fetch profile if not loaded
      if (!authStore.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.session.user.id)
          .eq('is_active', true)
          .single()
        if (profile) {
          authStore.user = profile as any
          authStore.role = (profile.role as any) || 'user'
        }
      }
    }
  }

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Redirect unauthenticated users to login with return URL
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Admin routes: elevated roles get access
  const adminRoles = ['superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor']
  if (to.meta.requiresAdmin && !adminRoles.includes(authStore.role || '')) {
    return { name: 'dashboard' }
  }
})

export default router
