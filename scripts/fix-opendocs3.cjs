const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find all lines with "const route = useRoute()" and remove duplicates
let firstFound = false;
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const route = useRoute()')) {
    if (firstFound) {
      removeIdxs.push(i);
    } else {
      firstFound = true;
    }
  }
}

// Also find duplicate useRoute imports
let importFound = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { useRoute } from 'vue-router'")) {
    if (importFound) {
      removeIdxs.push(i);
    } else {
      importFound = true;
    }
  }
}

removeIdxs.sort((a, b) => b - a);
for (const idx of removeIdxs) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Removed ${removeIdxs.length} duplicate lines`);
