const fs = require('fs');
const path = require('path');
const basePath = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src';

// Fix NavBar - remove unused individual permission computed (isAdmin already covers it)
const navFile = path.join(basePath, 'components', 'layout', 'NavBar.vue');
let nav = fs.readFileSync(navFile, 'utf-8');
nav = nav.replace(/const canManageUsers = computed.*\n/g, '');
nav = nav.replace(/const canManageRoles = computed.*\n/g, '');
nav = nav.replace(/const canEditCatalog = computed.*\n/g, '');
fs.writeFileSync(navFile, nav);
console.log('Fixed NavBar unused vars');

// Fix auth.ts - move the import inside the function where it's used
const authFile = path.join(basePath, 'stores', 'auth.ts');
let auth = fs.readFileSync(authFile, 'utf-8');
// Remove top-level import
auth = auth.replace("import { usePermissionsStore } from '@/stores/permissions'\n", '');
// Add dynamic import where it's used
auth = auth.replace(
  "// Fetch role permissions\n    const permStore = usePermissionsStore()",
  "// Fetch role permissions\n    const { usePermissionsStore } = await import('@/stores/permissions')\n    const permStore = usePermissionsStore()"
);
// But wait - fetchUserProfile might not be async... let me check
// Actually it IS async, so dynamic import is fine
fs.writeFileSync(authFile, auth);
console.log('Fixed auth.ts import');
