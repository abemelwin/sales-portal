const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find and remove the toolbar-right div containing Save Quote button
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('class="quote-builder-view__toolbar-right"')) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].trim() === '</div>') {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1);
  console.log(`Removed Save Quote toolbar (lines ${startIdx+1}-${endIdx+1})`);
} else {
  console.log('Could not find toolbar-right div');
}

fs.writeFileSync(file, lines.join('\n'));
