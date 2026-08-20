const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove lines that reference saveError or saveSuccess in template
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('saveError') || lines[i].includes('saveSuccess')) {
    removeIdxs.push(i);
  }
}

// Also remove the dismissError function if it exists
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function dismissError')) {
    // Remove function and its body
    let end = i;
    let braces = 0;
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
      }
      if (braces === 0 && j > i) { end = j; break; }
    }
    for (let j = i; j <= end; j++) removeIdxs.push(j);
    break;
  }
}

// Remove in reverse
const unique = [...new Set(removeIdxs)].sort((a, b) => b - a);
for (const idx of unique) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Removed ${unique.length} lines with saveError/saveSuccess/dismissError`);
