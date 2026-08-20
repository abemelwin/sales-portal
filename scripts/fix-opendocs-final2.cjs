const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find the watch block and replace with onMounted
let watchStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("watch(() => route.query.openDocs")) {
    watchStart = i;
    break;
  }
}

if (watchStart === -1) {
  console.log("Cannot find openDocs watch");
  process.exit(1);
}

// Find end of watch block (the }, { immediate: true }) line)
let watchEnd = -1;
for (let i = watchStart; i < lines.length; i++) {
  if (lines[i].includes('immediate: true')) {
    watchEnd = i;
    break;
  }
}

if (watchEnd === -1) {
  console.log("Cannot find end of watch");
  process.exit(1);
}

// Replace with onMounted
const newLines = [
  'onMounted(() => {',
  '  if (route.query.openDocs === \'true\') {',
  '    setTimeout(() => {',
  '      const btn = document.querySelector(\'.closing-docs-btn\') as HTMLButtonElement',
  '      if (btn) btn.click()',
  '    }, 800)',
  '  }',
  '})',
];

lines.splice(watchStart, watchEnd - watchStart + 1, ...newLines);

// Make sure onMounted is imported
const importLine = lines.findIndex(l => l.includes('import { provide'));
if (importLine !== -1 && !lines[importLine].includes('onMounted')) {
  lines[importLine] = lines[importLine].replace('import { provide,', 'import { provide, onMounted,');
}

// Remove watch from imports if it's only used here
const watchUsed = lines.some((l, i) => i !== importLine && l.includes('watch('));
if (!watchUsed) {
  const idx = lines.findIndex(l => l.includes('import {') && l.includes('watch'));
  if (idx !== -1) {
    lines[idx] = lines[idx].replace(', watch,', ',').replace(', watch ', ' ').replace(' watch,', '');
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Replaced watch with onMounted for openDocs');
