const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Replace everything after "routes\n})\n" 
const marker = "routes\n})\n";
const idx = content.indexOf(marker);
if (idx === -1) {
  // try CRLF
  const marker2 = "routes\r\n})\r\n";
  const idx2 = content.indexOf(marker2);
  if (idx2 === -1) { console.log('Marker not found'); process.exit(1); }
  content = content.substring(0, idx2 + marker2.length);
} else {
  content = content.substring(0, idx + marker.length);
}

content += `
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
`;

fs.writeFileSync(file, content);
console.log('Router rewritten successfully');
