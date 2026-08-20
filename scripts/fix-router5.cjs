const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Keep everything up to and including the router creation
const marker = "routes\r\n})\r\n";
let idx = content.indexOf(marker);
if (idx === -1) {
  const marker2 = "routes\n})\n";
  idx = content.indexOf(marker2);
  if (idx === -1) { console.log("Marker not found"); process.exit(1); }
  content = content.substring(0, idx + marker2.length);
} else {
  content = content.substring(0, idx + marker.length);
}

content += `
router.beforeEach(async (to) => {
  const { useAuthStore } = await import('@/stores/auth')
  const { supabase } = await import('@/services/supabase')
  const authStore = useAuthStore()

  // If the store doesn't have a session yet, check Supabase directly
  // This handles page reload where onAuthStateChange hasn't fired yet
  if (!authStore.session && to.meta.requiresAuth !== false) {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      // Session exists - hydrate the store
      authStore.session = data.session
      if (!authStore.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.session.user.id)
          .eq('is_active', true)
          .single()
        if (profile) {
          authStore.user = profile as any
          authStore.role = (profile as any).role || 'user'
        }
      }
    }
  }

  // Now make routing decisions
  const isAuthenticated = !!authStore.session && !!authStore.user

  // Redirect authenticated users away from login page
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !isAuthenticated) {
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
console.log('Router rewritten - v5');
