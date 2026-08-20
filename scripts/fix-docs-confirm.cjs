const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find handleDocsConfirm and replace - just close the modal for now
// (The full T&C view needs its own implementation later)
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function handleDocsConfirm')) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) { console.log('Cannot find handleDocsConfirm'); process.exit(1); }

let endIdx = -1;
let braces = 0;
for (let i = startIdx; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') braces++;
    if (ch === '}') braces--;
  }
  if (braces === 0 && i > startIdx) {
    endIdx = i;
    break;
  }
}

const newFn = [
  'function handleDocsConfirm(_data: any) {',
  '  showDocsPrompt.value = false',
  '  // For now, trigger print (Save as PDF) with the T&C view',
  '  // TODO: implement full T&C document generation',
  '  alert(\'Closing Documents feature will open the T&C printable view. For now, use SAVE AS PDF to export the quotation.\')',
  '}',
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFn);
fs.writeFileSync(file, lines.join('\n'));
console.log('handleDocsConfirm updated - removes save requirement');
