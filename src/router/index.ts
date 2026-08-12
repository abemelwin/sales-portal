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

// Helper: wait for Supabase auth to resolve on page load
let authInitialized = false
let authInitPromise: Promise<void> | null = null

function waitForAuthInit(authStore: ReturnType<typeof import('@/stores/auth')['useAuthStore']>): Promise<void> {
  if (authInitialized) return Promise.resolve()
  if (authInitPromise) return authInitPromise

  authInitPromise = new Promise<void>((resolve) => {
    if (authStore.session) {
      authInitialized = true
      resolve()
      return
    }
    const timeout = setTimeout(() => { authInitialized = true; resolve() }, 3000)
    const check = setInterval(() => {
      if (authStore.session || authStore.user) {
        clearTimeout(timeout)
        clearInterval(check)
        authInitialized = true
        resolve()
      }
    }, 50)
  })
  return authInitPromise
}

router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  // Wait for auth initialization on protected routes
  if (to.meta.requiresAuth) {
    await waitForAuthInit(authStore)
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
