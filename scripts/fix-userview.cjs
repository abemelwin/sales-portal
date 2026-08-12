const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'views', 'UserManagementView.vue');
let content = fs.readFileSync(file, 'utf-8');

// Fix template literals that got mangled by PowerShell
// Line 85: prompt template
content = content.replace(
  /const np = prompt\(\\New password for "\\.*?\)/,
  'const np = prompt(`New password for "${user.display_name}" (min 4 characters):`)'
);

// Line 92: alert template  
content = content.replace(
  /alert\(\\Password reset for \\\.\\?\)/,
  'alert(`Password reset for ${user.display_name}.`)'
);

// Line 110: confirm template
content = content.replace(
  /if \(!confirm\(\\Delete user "\\"\?\\?\)\) return/,
  'if (!confirm(`Delete user "${user.display_name}"?`)) return'
);

// Line 182: $event.target
content = content.replace(
  /\(\\\.target as HTMLSelectElement\)\.value as Role/,
  '($event.target as HTMLSelectElement).value as Role'
);

fs.writeFileSync(file, content);
console.log('Fixed template literals in UserManagementView.vue');
