const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Find and replace the beforeEach block
const oldGuard = `router.beforeEach(async (to) => {
  // Lazy-import auth store to avoid circular dependency issues
  // and to ensure Pinia is installed before store access
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Redirect unauthenticated users to login with return URL
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Redirect non-admin users away from admin-only routes
  if (to.meta.requiresAdmin && authStore.role !== 'superadmin') {
    return { name: 'dashboard' }
  }
})`;

const newGuard = `// Helper: wait for Supabase auth to resolve on page load
let authInitialized = false
let authInitPromise: Promise<void> | null = null

function waitForAuthInit(authStore: any): Promise<void> {
  if (authInitialized) return Promise.resolve()
  if (authInitPromise) return authInitPromise

  authInitPromise = new Promise<void>((resolve) => {
    // If session already exists, done
    if (authStore.session) {
      authInitialized = true
      resolve()
      return
    }
    // Wait for Supabase onAuthStateChange to fire (max 3s)
    const timeout = setTimeout(() => {
      authInitialized = true
      resolve()
    }, 3000)

    const checkInterval = setInterval(() => {
      if (authStore.session || authStore.user) {
        clearTimeout(timeout)
        clearInterval(checkInterval)
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
})`;

content = content.replace(oldGuard, newGuard);
fs.writeFileSync(file, content);
console.log('Router guard fixed');
