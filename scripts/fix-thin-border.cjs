const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Change 2px to 1px in print CSS for q-shdr
content = content.replace(
  'border-bottom: 2px solid #c0392b !important;',
  'border-bottom: 1px solid #c0392b !important;'
);

fs.writeFileSync(file, content);
console.log('Fixed: section header border changed from 2px to 1px in print');
