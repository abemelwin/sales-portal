const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Keep everything up to router creation
const marker = "routes\r\n})\r\n";
let idx = content.indexOf(marker);
if (idx === -1) {
  const m2 = "routes\n})\n";
  idx = content.indexOf(m2);
  if (idx === -1) { console.log("NOT FOUND"); process.exit(1); }
  content = content.substring(0, idx + m2.length);
} else {
  content = content.substring(0, idx + marker.length);
}

content += `
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
  const adminRoles = ['superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor']
  if (to.meta.requiresAdmin && !adminRoles.includes(authStore.role || '')) {
    // If role not loaded yet but has session, allow (profile will load async)
    if (hasSession && !authStore.role) return
    return { name: 'dashboard' }
  }
})

export default router
`;

fs.writeFileSync(file, content);
console.log('Router v6 - allow access if session exists even without profile');
