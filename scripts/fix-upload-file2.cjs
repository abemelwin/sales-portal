const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\ProductInfoView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find uploadFile function and replace its body
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function uploadFile(category: CategoryKey)')) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].trim() === '}' && !lines[i].startsWith('  }')) {
    endIdx = i;
    break;
  }
}

// Find the closing brace more carefully
if (endIdx === -1) {
  let braceCount = 0;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }
    if (braceCount === 0 && i > startIdx) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find uploadFile function bounds');
  process.exit(1);
}

console.log(`Found uploadFile at lines ${startIdx+1}-${endIdx+1}`);

const newFn = [
  'async function uploadFile(category: CategoryKey) {',
  '  if (!selectedMachineId.value) return',
  '  ',
  '  const input = document.createElement(\'input\')',
  '  input.type = \'file\'',
  '  input.accept = \'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx\'',
  '  input.onchange = async (e: Event) => {',
  '    const file = (e.target as HTMLInputElement).files?.[0]',
  '    if (!file) return',
  '    const label = file.name',
  '    const url = URL.createObjectURL(file)',
  '    await productInfoStore.addLink(',
  '      selectedMachineId.value!,',
  '      label,',
  '      url,',
  '      category',
  '    )',
  '  }',
  '  input.click()',
  '}',
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFn);
fs.writeFileSync(file, lines.join('\n'));
console.log('Upload file function replaced with file picker');
