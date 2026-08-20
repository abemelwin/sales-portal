const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Find the router creation and everything after
const routerCreate = "const router = createRouter({\n  history: createWebHistory(import.meta.env.BASE_URL),\n  routes\n})\n";
const idx = content.indexOf(routerCreate);
if (idx === -1) {
  console.log("Marker not found, trying CRLF...");
  const routerCreateCRLF = "const router = createRouter({\r\n  history: createWebHistory(import.meta.env.BASE_URL),\r\n  routes\r\n})\r\n";
  const idx2 = content.indexOf(routerCreateCRLF);
  if (idx2 === -1) { console.log("Still not found!"); process.exit(1); }
  content = content.substring(0, idx2 + routerCreateCRLF.length);
} else {
  content = content.substring(0, idx + routerCreate.length);
}

content += `
// Wait for Supabase to restore session from localStorage on initial page load
let authResolved = false

async function ensureAuth(authStore: any): Promise<void> {
  if (authResolved) return
  authResolved = true

  // If already authenticated, no need to wait
  if (authStore.isAuthenticated) return

  // Give Supabase time to fire INITIAL_SESSION event
  // This happens asynchronously after page load
  await new Promise<void>((resolve) => {
    // Check immediately
    if (authStore.isAuthenticated) { resolve(); return }

    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; resolve() }
    }, 2000)

    // Poll every 50ms for up to 2 seconds
    const interval = setInterval(() => {
      if (authStore.isAuthenticated) {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          clearInterval(interval)
          resolve()
        }
      }
    }, 50)
  })
}

router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  // On first navigation, wait for auth session to restore
  await ensureAuth(authStore)

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
console.log('Router rewritten with proper auth wait');
