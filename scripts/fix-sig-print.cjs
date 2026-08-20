const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace the CSS for q-sig-line to use a more print-friendly approach
// Use border-bottom on a spacer div instead of border-top
content = content.replace(
  /\.q-sig-line \{[^}]+\}/,
  `.q-sig-line {
  width: 90%;
  height: 0;
  border-bottom: 1px solid #333 !important;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}`
);

// Also fix the noted-by line if it exists
if (content.includes('.q-noted-line')) {
  content = content.replace(
    /\.q-noted-line \{[^}]+\}/,
    `.q-noted-line {
  width: 50%;
  height: 0;
  border-bottom: 1px solid #333 !important;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}`
  );
}

// Add to print CSS block
content = content.replace(
  /\.q-availability \{[^}]*-webkit-print-color-adjust: exact !important;[^}]*\}/,
  (match) => match + `

  .q-sig-line,
  .q-noted-line {
    border-bottom: 1px solid #333 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }`
);

fs.writeFileSync(file, content);
console.log('Signature lines fixed for print - using border-bottom with !important');
