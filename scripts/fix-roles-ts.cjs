const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\RoleManagementView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Fix: cast supabase calls to avoid TS issues with unknown table
content = content.replace(
  /\.from\('role_permissions'\)/g,
  ".from('role_permissions' as any)"
);

fs.writeFileSync(file, content);
console.log('Fixed TS errors');
