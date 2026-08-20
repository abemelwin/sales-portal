const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Remove lines that import 'any' from ClosingDocsPrompt or reference ClosingDocsFormData
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import") && lines[i].includes("ClosingDocsPrompt") && lines[i].includes("any")) {
    removeIdxs.push(i);
  }
  if (lines[i].includes("import type") && lines[i].includes("any")) {
    removeIdxs.push(i);
  }
}

removeIdxs.sort((a, b) => b - a);
for (const idx of removeIdxs) {
  lines.splice(idx, 1);
}

// Also fix the handleDocsConfirm function signature if it uses 'any' type from import
let content = lines.join('\n');
content = content.replace(/function handleDocsConfirm\(_data: any\)/, 'function handleDocsConfirm(_data: any)');

fs.writeFileSync(file, content);
console.log(`Removed ${removeIdxs.length} broken import lines`);
