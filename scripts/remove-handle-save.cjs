const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove the handleSave function, saving ref, saveError, saveSuccess refs
// Find handleSave function start and end
let fnStart = -1;
let fnEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function handleSave()')) {
    fnStart = i;
  }
  if (fnStart !== -1 && i > fnStart && lines[i].trim() === '}' && lines[i].startsWith('}')) {
    fnEnd = i;
    break;
  }
}

// Find it more carefully with brace counting
if (fnEnd === -1 && fnStart !== -1) {
  let braceCount = 0;
  for (let i = fnStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }
    if (braceCount === 0 && i > fnStart) {
      fnEnd = i;
      break;
    }
  }
}

if (fnStart !== -1 && fnEnd !== -1) {
  // Also remove the comment above it
  if (lines[fnStart - 1] && lines[fnStart - 1].includes('*/')) {
    // Find the start of the comment block
    let commentStart = fnStart - 1;
    while (commentStart > 0 && !lines[commentStart].includes('/**')) {
      commentStart--;
    }
    // Also remove the section header if present
    if (lines[commentStart - 2] && lines[commentStart - 2].includes('Quote Saving')) {
      commentStart -= 2;
    }
    fnStart = commentStart;
  }
  
  lines.splice(fnStart, fnEnd - fnStart + 1);
  console.log(`Removed handleSave function (lines ${fnStart+1}-${fnEnd+1})`);
}

// Remove unused refs: saving, saveError, saveSuccess
const removePatterns = [
  /^const saving = ref.*$/,
  /^const saveError = ref.*$/,
  /^const saveSuccess = ref.*$/,
  /^\s*saving\.value/,
  /^\s*saveError\.value/,
  /^\s*saveSuccess\.value/,
];

// Just suppress the TS error by adding an underscore or using the variable
// Actually easier: just comment out "saving" since other refs might be used elsewhere

fs.writeFileSync(file, lines.join('\n'));
console.log('handleSave removed');
