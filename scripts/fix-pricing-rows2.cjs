const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find the pricingRows computed and replace it
let startIdx = -1;
let endIdx = -1;
let braceCount = 0;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const pricingRows = computed(')) {
    startIdx = i - 1; // include comment line before
    foundStart = true;
    braceCount = 0;
  }
  if (foundStart) {
    for (const ch of lines[i]) {
      if (ch === '(') braceCount++;
      if (ch === ')') braceCount--;
    }
    if (braceCount === 0 && i > startIdx + 1) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find pricingRows bounds');
  process.exit(1);
}

console.log(`Found pricingRows at lines ${startIdx+1}-${endIdx+1}`);

// Replace with new implementation
const newLines = [
  '// Pricing table rows: primary row + additional term options',
  'const pricingRows = computed(() => {',
  '  const cp = quoteState.contractPrice || 0',
  '  const isCash = quoteState.dealType?.toLowerCase().includes(\'cash\') ?? true',
  '  const rows: { downPayment: number; balance: number | null; paymentTerms: string; monthly: number | null }[] = []',
  '',
  '  // Primary row',
  '  const dp = quoteState.downPayment || 0',
  '  const months = quoteState.months || 12',
  '  const balance = cp - dp - tradeInSum.value',
  '  const paymentTerms = isCash ? \'CASH\' : months + \' months\'',
  '  const monthly = isCash ? null : (balance > 0 && months > 0 ? balance / months : null)',
  '  rows.push({ downPayment: dp, balance, paymentTerms, monthly })',
  '',
  '  // Additional term options',
  '  quoteState.termOptions.forEach((term) => {',
  '    const tCp = term.contractPrice || cp',
  '    const tDp = term.downPayment || 0',
  '    const tMonths = term.months || 12',
  '    const tIsCash = (term.dealType || \'\').toLowerCase().includes(\'cash\')',
  '    const tBalance = tCp - tDp - tradeInSum.value',
  '    const tPaymentTerms = tIsCash ? \'CASH\' : tMonths + \' months\'',
  '    const tMonthly = tIsCash ? null : (tBalance > 0 && tMonths > 0 ? tBalance / tMonths : null)',
  '    rows.push({ downPayment: tDp, balance: tBalance, paymentTerms: tPaymentTerms, monthly: tMonthly })',
  '  })',
  '',
  '  return rows',
  '})',
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newLines);
fs.writeFileSync(file, lines.join('\n'));
console.log('pricingRows replaced successfully');
