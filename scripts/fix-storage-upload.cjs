const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\ProductInfoView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find uploadFile function and replace with Supabase Storage upload
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function uploadFile(category: CategoryKey)')) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx) {
    let braces = 0;
    for (let j = startIdx; j <= i; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
      }
    }
    if (braces === 0) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('Cannot find uploadFile function');
  process.exit(1);
}

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
  '    ',
  '    // Upload to Supabase Storage',
  '    const timestamp = Date.now()',
  '    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, \'_\')',
  '    const path = `${selectedMachineId.value}/${category}/${timestamp}_${safeName}`',
  '    ',
  '    const { data: uploadData, error: uploadError } = await supabase.storage',
  '      .from(\'product-files\')',
  '      .upload(path, file)',
  '    ',
  '    if (uploadError) {',
  '      alert(\'Upload failed: \' + uploadError.message)',
  '      return',
  '    }',
  '    ',
  '    // Get public URL',
  '    const { data: urlData } = supabase.storage',
  '      .from(\'product-files\')',
  '      .getPublicUrl(uploadData.path)',
  '    ',
  '    const publicUrl = urlData.publicUrl',
  '    ',
  '    // Save link to database',
  '    await productInfoStore.addLink(',
  '      selectedMachineId.value!,',
  '      file.name,',
  '      publicUrl,',
  '      category',
  '    )',
  '  }',
  '  input.click()',
  '}',
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFn);

// Make sure supabase is imported
const content = lines.join('\n');
if (!content.includes("import { supabase }")) {
  // Add import
  const importIdx = lines.findIndex(l => l.includes("import { useProductInfoStore }"));
  if (importIdx !== -1) {
    lines.splice(importIdx, 0, "import { supabase } from '@/services/supabase'");
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Upload file now uses Supabase Storage');
