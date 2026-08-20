const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove any remaining lines with dismissError
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dismissError')) {
    removeIdxs.push(i);
  }
}

removeIdxs.sort((a, b) => b - a);
for (const idx of removeIdxs) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Removed ${removeIdxs.length} remaining dismissError refs`);
