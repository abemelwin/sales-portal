const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add addonDisplayItems back before consumableDisplayList
const addonComputed = `const addonDisplayItems = computed(() => {
  if (!quoteState.vatInclusive) return quoteState.addonItems
  return quoteState.addonItems.map((item) => ({
    ...item,
    description: item.description.replace(
      /([P\u20B1])\\s?([\\d,]+(?:\\.\\d{1,2})?)/g,
      (_match: string, sym: string, num: string) => {
        const val = parseFloat(num.replace(/,/g, '')) * 1.12
        return sym + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
    ),
  }))
})

`;

content = content.replace(
  'const consumableDisplayList = computed(',
  addonComputed + 'const consumableDisplayList = computed('
);

fs.writeFileSync(file, content);
console.log('addonDisplayItems restored');
