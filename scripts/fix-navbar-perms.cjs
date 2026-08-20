const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\layout\\NavBar.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Add watch import if not present and add a watch on role to fetch permissions
const importIdx = lines.findIndex(l => l.includes("import { ref, computed"));
if (importIdx !== -1 && !lines[importIdx].includes('watch')) {
  lines[importIdx] = lines[importIdx].replace('import { ref, computed', 'import { ref, computed, watch');
}

// Add watch after permStore declaration
const permStoreIdx = lines.findIndex(l => l.includes('const permStore = usePermissionsStore()'));
if (permStoreIdx !== -1) {
  lines.splice(permStoreIdx + 1, 0, `
// Fetch permissions when role changes (handles page reload timing)
watch(role, (newRole) => {
  if (newRole && !permStore.loaded) {
    permStore.fetchPermissions(newRole)
  }
}, { immediate: true })
`);
}

fs.writeFileSync(file, lines.join('\n'));
console.log('NavBar: added watch on role to fetch permissions');
