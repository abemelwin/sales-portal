const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace q-sig-line CSS to use background instead of border
content = content.replace(
  /\.q-sig-line \{[^}]+\}/,
  `.q-sig-line {
  width: 90%;
  height: 1px;
  background: #333;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}`
);

// Replace q-noted-line CSS too
content = content.replace(
  /\.q-noted-line \{[^}]+\}/,
  `.q-noted-line {
  width: 50%;
  height: 1px;
  background: #333;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}`
);

// Also remove any print override that uses border for these
content = content.replace(
  /\s*\.q-sig-line,\s*\n\s*\.q-noted-line \{[^}]*\}/,
  ''
);

fs.writeFileSync(file, content);
console.log('Signature lines now use background (height:1px) instead of border');
