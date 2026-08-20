const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\layout\\NavBar.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace the single adminLinks array with individual permission-based links
// Find the adminLinks array and the template that uses it

// Replace adminLinks definition
content = content.replace(
  /\/\*\* Admin-only navigation links.*?\*\/\s*\nconst adminLinks = \[[\s\S]*?\]/,
  `/** Admin navigation links with permission requirements */
const adminLinks = computed(() => {
  const links: { to: string; label: string }[] = []
  if (permStore.can('manage_users')) links.push({ to: '/users', label: 'Users' })
  if (permStore.can('manage_roles_access')) links.push({ to: '/roles', label: 'Roles' })
  if (permStore.can('edit_machine_catalog')) links.push({ to: '/catalog', label: 'Catalog Editor' })
  return links
})`
);

// Update isAdmin to check if there are any admin links to show
content = content.replace(
  /const isAdmin = computed\(\(\) => permStore\.can\('manage_users'\) \|\| permStore\.can\('edit_machine_catalog'\) \|\| permStore\.can\('manage_roles_access'\)\)/,
  "const isAdmin = computed(() => adminLinks.value.length > 0)"
);

fs.writeFileSync(file, content);
console.log('NavBar: admin links now shown individually based on specific permissions');
