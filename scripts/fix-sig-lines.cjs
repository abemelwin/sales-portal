const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Fix signature cells - swap line and name order (line above name)
// Find q-sig-name and q-sig-line pairs and swap them
for (let i = 0; i < lines.length; i++) {
  // Pattern: q-sig-name followed by q-sig-line => swap to q-sig-line then q-sig-name
  if (lines[i].includes('q-sig-name') && i + 1 < lines.length && lines[i + 1].includes('q-sig-line')) {
    const temp = lines[i];
    lines[i] = lines[i + 1];
    lines[i + 1] = temp;
  }
}

// Also fix the Noted By section - add a line above the name
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('q-noted-name')) {
    // Add a line div before it
    lines.splice(i, 0, '              <div class="q-noted-line"></div>');
    break;
  }
}

// Add CSS for q-noted-line
const styleIdx = lines.findIndex(l => l.includes('.q-sig-sub'));
if (styleIdx !== -1) {
  // Find a good place to add the CSS
  const insertAfter = lines.findIndex((l, idx) => idx > styleIdx && l.trim() === '}');
  if (insertAfter !== -1) {
    lines.splice(insertAfter + 1, 0, `
.q-noted-line {
  width: 50%;
  border-top: 1px solid #333;
  margin-top: 6mm;
}
`);
  }
}

// Also make the sig line print properly
// The q-sig-line already has border-top - just ensure print CSS has it
fs.writeFileSync(file, lines.join('\n'));
console.log('Signature lines fixed - line above name (signing space)');
