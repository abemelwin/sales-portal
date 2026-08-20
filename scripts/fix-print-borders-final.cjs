const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace border-bottom approach with a pseudo-element using background-color
// which is more reliable in print

// Update the q-shdr CSS to use ::after pseudo-element with background
content = content.replace(
  /\.q-shdr \{[^}]+\}/,
  `.q-shdr {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #c0392b;
  padding-bottom: 1mm;
  margin-bottom: 1.5mm;
  letter-spacing: .4px;
  margin-top: 2mm;
  position: relative;
}

.q-shdr::after {
  content: '';
  display: block;
  width: 100%;
  height: 1px;
  background: #c0392b;
  margin-top: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}`
);

// Remove the old print override for q-shdr border
content = content.replace(
  /\s*\.q-shdr \{[^}]*border-bottom: 1px solid #c0392b !important;[^}]*\}/,
  ''
);

fs.writeFileSync(file, content);
console.log('Section headers now use ::after with background-color (print-reliable)');
