const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// 1. Fix inclusionsList - DON'T add "VAT Inclusive" to inclusions (reference doesn't)
content = content.replace(
  `const inclusionsList = computed(() => {
  const items = getDisplayedInclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items.push('VAT Inclusive')
  }
  return items
})`,
  `const inclusionsList = computed(() => {
  return getDisplayedInclusions(quoteState).map((item) => item.description)
})`
);

// 2. Fix exclusionsList - remove "Value Added Tax (VAT)" when vatInclusive is checked
content = content.replace(
  `const exclusionsList = computed(() => {
  return getDisplayedExclusions(quoteState).map((item) => item.description)
})`,
  `const exclusionsList = computed(() => {
  let items = getDisplayedExclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items = items.filter((desc) => !desc.toLowerCase().includes('value added tax'))
  }
  return items
})`
);

// 3. Fix consumableDisplayList - multiply prices by 1.12 when vatInclusive
content = content.replace(
  `const consumableDisplayList = computed(() => {
  return quoteState.consumables.map((c) => {
    const customEntry = quoteState.consumablePrices.find(
      (cp) => cp.consumableId === c.id
    )
    const price = customEntry ? customEntry.customPrice : c.default_price
    return {
      name: c.item_name,
      package: c.package_description || '',
      price,
    }
  })
})`,
  `const consumableDisplayList = computed(() => {
  return quoteState.consumables.map((c) => {
    const customEntry = quoteState.consumablePrices.find(
      (cp) => cp.consumableId === c.id
    )
    let price = customEntry ? customEntry.customPrice : c.default_price
    if (quoteState.vatInclusive) price = price * 1.12
    return {
      name: c.item_name,
      package: c.package_description || '',
      price,
    }
  })
})`
);

// 4. Fix addonDisplayItems - add VAT to prices in description text
content = content.replace(
  `const addonDisplayItems = computed(() => quoteState.addonItems)`,
  `const addonDisplayItems = computed(() => {
  if (!quoteState.vatInclusive) return quoteState.addonItems
  // When VAT inclusive, multiply any peso amounts in addon descriptions by 1.12
  return quoteState.addonItems.map((item) => ({
    ...item,
    description: item.description.replace(
      /([P?])\s?([\d,]+(?:\.\d{1,2})?)/g,
      (_match, sym, num) => {
        const val = parseFloat(num.replace(/,/g, '')) * 1.12
        return sym + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
    ),
  }))
})`
);

fs.writeFileSync(file, content);
console.log('VAT logic fixed in QuotePreviewPanel');
