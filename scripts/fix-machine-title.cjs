const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  "return `${quoteState.selectedBrand} ${quoteState.selectedModel}`",
  "return quoteState.selectedModel"
);

fs.writeFileSync(file, content);
console.log('machineTitle fixed - uses model only (brand already included)');
