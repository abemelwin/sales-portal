const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Fix inclusionsList: remove the VAT Inclusive push
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("items.push('VAT Inclusive')")) {
    // Remove the if block (line before, this line, and line after with })
    lines[i-1] = ''; // if (quoteState.vatInclusive) {
    lines[i] = '';   // items.push('VAT Inclusive')
    lines[i+1] = ''; // }
    break;
  }
}

// Fix exclusionsList: add VAT filter
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const exclusionsList = computed(')) {
    // Replace the next few lines
    const end = lines.indexOf('})', i);
    lines.splice(i, end - i + 1,
      'const exclusionsList = computed(() => {',
      '  let items = getDisplayedExclusions(quoteState).map((item) => item.description)',
      '  if (quoteState.vatInclusive) {',
      '    items = items.filter((desc) => !desc.toLowerCase().includes(\'value added tax\'))',
      '  }',
      '  return items',
      '})'
    );
    break;
  }
}

// Fix consumableDisplayList: add 1.12 multiplier
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const consumableDisplayList = computed(')) {
    // Find "const price = customEntry" and change to let + add VAT
    for (let j = i; j < i + 15; j++) {
      if (lines[j] && lines[j].includes('const price = customEntry')) {
        lines[j] = '    let price = customEntry ? customEntry.customPrice : c.default_price';
        // Add VAT line after
        lines.splice(j + 1, 0, '    if (quoteState.vatInclusive) price = price * 1.12');
        break;
      }
    }
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('All VAT fixes applied line by line');
