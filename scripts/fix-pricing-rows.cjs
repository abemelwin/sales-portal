const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find and replace the pricingRows computed
const oldPricingRows = `const pricingRows = computed(() => {
  return quoteState.termOptions.map((term) => {
    const cp = quoteState.contractPrice
    const balance = cp !== null
      ? cp - term.downPayment - tradeInSum.value
      : null
    const isCash = quoteState.dealType?.toLowerCase().includes('cash') ?? false
    const paymentTerms = isCash ? 'CASH' : \`\${term.months} months\`
    const monthly = isCash ? null : term.monthlyAmortization
    return { term, balance, paymentTerms, monthly }
  })
})`;

const newPricingRows = `const pricingRows = computed(() => {
  const cp = quoteState.contractPrice || 0
  const isCash = quoteState.dealType?.toLowerCase().includes('cash') ?? true
  const rows: { downPayment: number; balance: number | null; paymentTerms: string; monthly: number | null }[] = []

  // Primary row using standalone downPayment + months
  const dp = quoteState.downPayment || 0
  const months = quoteState.months || 12
  const balance = cp - dp - tradeInSum.value
  const paymentTerms = isCash ? 'CASH' : months + ' months'
  const monthly = isCash ? null : (balance > 0 && months > 0 ? balance / months : null)
  rows.push({ downPayment: dp, balance, paymentTerms, monthly })

  // Additional term options
  quoteState.termOptions.forEach((term) => {
    const tCp = term.contractPrice || cp
    const tDp = term.downPayment || 0
    const tMonths = term.months || 12
    const tIsCash = (term.dealType || '').toLowerCase().includes('cash')
    const tBalance = tCp - tDp - tradeInSum.value
    const tPaymentTerms = tIsCash ? 'CASH' : tMonths + ' months'
    const tMonthly = tIsCash ? null : (tBalance > 0 && tMonths > 0 ? tBalance / tMonths : null)
    rows.push({ downPayment: tDp, balance: tBalance, paymentTerms: tPaymentTerms, monthly: tMonthly })
  })

  return rows
})`;

content = content.replace(oldPricingRows, newPricingRows);

// Also fix the template that references row.term.downPayment -> row.downPayment
content = content.replace(
  '<td>{{ formatCurrency(row.term.downPayment) }}</td>',
  '<td>{{ formatCurrency(row.downPayment) }}</td>'
);

fs.writeFileSync(file, content);
console.log('pricingRows fixed to use standalone downPayment/months');
