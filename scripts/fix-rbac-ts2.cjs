const fs = require('fs');
const path = require('path');
const basePath = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src';

// Fix NavBar
const navFile = path.join(basePath, 'components', 'layout', 'NavBar.vue');
let navLines = fs.readFileSync(navFile, 'utf-8').split('\n');
navLines = navLines.filter(l => !l.includes('canEditCatalog') && !l.includes('canManageUsers') && !l.includes('canManageRoles'));
fs.writeFileSync(navFile, navLines.join('\n'));
console.log('NavBar cleaned');

// Fix auth.ts
const authFile = path.join(basePath, 'stores', 'auth.ts');
let authLines = fs.readFileSync(authFile, 'utf-8').split('\n');
// Remove the top-level usePermissionsStore import
authLines = authLines.filter(l => !l.includes("import { usePermissionsStore }"));
// Find where permStore is used and add dynamic import before it
for (let i = 0; i < authLines.length; i++) {
  if (authLines[i].includes('const permStore = usePermissionsStore()')) {
    authLines[i] = "    const { usePermissionsStore } = await import('@/stores/permissions')\n    const permStore = usePermissionsStore()";
    break;
  }
}
fs.writeFileSync(authFile, authLines.join('\n'));
console.log('Auth store cleaned');
