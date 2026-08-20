const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove router and route declarations
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const router = useRouter()") || lines[i].includes("const route = useRoute()")) {
    removeIdxs.push(i);
  }
}
// Remove the import too
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { useRouter, useRoute }")) {
    removeIdxs.push(i);
  }
}

removeIdxs.sort((a, b) => b - a);
for (const idx of removeIdxs) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Removed ${removeIdxs.length} unused router/route lines`);
