const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\UserManagementView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

for (let i = 0; i < lines.length; i++) {
  // Fix prompt line
  if (lines[i].includes('const np = prompt(') && lines[i].includes('4 characters')) {
    lines[i] = '  const np = prompt(`New password for "${user.display_name}" (min 4 characters):`)';
  }
  // Fix confirm line
  if (lines[i].includes('confirm(') && lines[i].includes('Delete user')) {
    lines[i] = '  if (!confirm(`Delete user "${user.display_name}"?`)) return';
  }
  // Fix $event.target
  if (lines[i].includes('.target as HTMLSelectElement') && lines[i].includes('@change')) {
    lines[i] = '                @change="handleRoleChange(user, ($event.target as HTMLSelectElement).value as Role)"';
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed all template literal issues');
