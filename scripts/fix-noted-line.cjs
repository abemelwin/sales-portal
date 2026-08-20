const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove border-bottom from q-noted-name
content = content.replace(
  /\.q-noted-name \{[^}]*\}/,
  `.q-noted-name {
  font-size: 9pt;
  font-weight: 700;
  color: #111;
  padding-top: 1mm;
  display: inline-block;
  min-width: 60mm;
}`
);

fs.writeFileSync(file, content);
console.log('Removed extra border-bottom from q-noted-name');
