const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find where productInfoStore is used and add a fetch on mount/machine change
// Add onMounted to imports if not present
const importLine = lines.findIndex(l => l.includes("import { inject, computed"));
if (importLine !== -1 && !lines[importLine].includes('onMounted')) {
  lines[importLine] = lines[importLine].replace('import { inject, computed', 'import { inject, computed, onMounted, watch');
} else if (importLine !== -1 && !lines[importLine].includes('watch')) {
  lines[importLine] = lines[importLine].replace('import { inject, computed, onMounted', 'import { inject, computed, onMounted, watch');
}

// Find where productInfoStore is declared and add fetch logic after it
const storeIdx = lines.findIndex(l => l.includes('const productInfoStore = useProductInfoStore()'));
if (storeIdx !== -1) {
  lines.splice(storeIdx + 1, 0, `
// Auto-fetch product info links when component mounts or machine changes
onMounted(() => {
  productInfoStore.fetchLinks()
})
watch(() => quoteState.machineId, () => {
  productInfoStore.fetchLinks()
})
`);
  console.log('Added auto-fetch for productInfoStore');
} else {
  console.log('productInfoStore not found - skipping');
}

fs.writeFileSync(file, lines.join('\n'));
