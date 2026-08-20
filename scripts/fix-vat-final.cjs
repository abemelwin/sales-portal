const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// 1. Fix inclusionsList - remove "VAT Inclusive" push, keep clean list
const oldInclusions = `const inclusionsList = computed(() => {
  const items = getDisplayedInclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items.push('VAT Inclusive')
  }
  return items
})`;

const newInclusions = `const inclusionsList = computed(() => {
  return getDisplayedInclusions(quoteState).map((item) => item.description)
})`;

content = content.replace(oldInclusions, newInclusions);

// 2. Fix exclusionsList - filter out VAT when vatInclusive is checked
const oldExclusions = `const exclusionsList = computed(() => {
  return getDisplayedExclusions(quoteState).map((item) => item.description)
})`;

const newExclusions = `const exclusionsList = computed(() => {
  let items = getDisplayedExclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items = items.filter((desc) => !desc.toLowerCase().includes('value added tax'))
  }
  return items
})`;

content = content.replace(oldExclusions, newExclusions);

// 3. Fix addonDisplayItems - the regex was corrupted
const oldAddons = content.substring(
  content.indexOf('const addonDisplayItems = computed('),
  content.indexOf('})\n})\n\nconst consumableDisplayList') + 4
);

const newAddons = `const addonDisplayItems = computed(() => {
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
})`;

// Find and replace the addon computed
const addonStart = content.indexOf('const addonDisplayItems = computed(');
const addonEnd = content.indexOf('\n\nconst consumableDisplayList');
content = content.substring(0, addonStart) + newAddons + content.substring(addonEnd);

// 4. Fix consumableDisplayList - add 1.12 multiplier
const oldCons = `const consumableDisplayList = computed(() => {
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
})`;

const newCons = `const consumableDisplayList = computed(() => {
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
})`;

content = content.replace(oldCons, newCons);

fs.writeFileSync(file, content);
console.log('VAT logic fully fixed');
