const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Keep everything up to and including the router creation
const marker = "routes\r\n})\r\n";
const idx = content.indexOf(marker);
if (idx === -1) { console.log("Marker not found"); process.exit(1); }
content = content.substring(0, idx + marker.length);

content += `
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
`;

fs.writeFileSync(file, content);
console.log('Router fixed with direct getSession() call');
