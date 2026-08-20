const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove the useAuth import if it's unused
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { useAuth }") && !lines.some((l, j) => j > i && l.includes('useAuth()'))) {
    lines.splice(i, 1);
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Removed unused useAuth import');
