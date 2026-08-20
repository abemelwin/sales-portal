const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find machineImageUrl computed and replace it to also check product_info_links
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const machineImageUrl = computed')) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) { console.log('Cannot find machineImageUrl'); process.exit(1); }

// Find end
let endIdx = -1;
let braces = 0;
for (let i = startIdx; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '(' || ch === '{') braces++;
    if (ch === ')' || ch === '}') braces--;
  }
  if (lines[i].includes('})') && braces <= 0) {
    endIdx = i;
    break;
  }
}

const newComputed = [
  'const machineImageUrl = computed<string | null>(() => {',
  '  // First check imageKey (from machine catalog)',
  '  if (quoteState.imageKey) {',
  '    const { data } = supabase.storage',
  '      .from(\'machine-images\')',
  '      .getPublicUrl(quoteState.imageKey)',
  '    return data.publicUrl',
  '  }',
  '  // Fallback: check product_info_links for a "picture" type link',
  '  if (quoteState.machineId) {',
  '    const pictureLink = productInfoStore.productLinks.find(',
  '      (l) => l.machine_id === quoteState.machineId && l.document_type === \'picture\'',
  '    )',
  '    if (pictureLink) return pictureLink.url',
  '  }',
  '  return null',
  '})',
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newComputed);

// Make sure productInfoStore is imported
const content = lines.join('\n');
if (!content.includes('useProductInfoStore')) {
  // Add import
  const insertIdx = lines.findIndex(l => l.includes("import { supabase }"));
  if (insertIdx !== -1) {
    lines.splice(insertIdx + 1, 0, "import { useProductInfoStore } from '@/stores/productInfo'");
    // Add store instance
    const storeInsertIdx = lines.findIndex(l => l.includes('const quoteState = inject'));
    if (storeInsertIdx !== -1) {
      lines.splice(storeInsertIdx + 1, 0, 'const productInfoStore = useProductInfoStore()');
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('machineImageUrl now checks Product Info pictures as fallback');
