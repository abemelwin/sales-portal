const fs = require('fs');

// Fix QuoteFormPanel.vue - the addTermOption function
const formFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let form = fs.readFileSync(formFile, 'utf-8');
form = form.replace(
  /quoteState\.termOptions\.push\(\{\s*downPayment: 0,\s*months: \d+,\s*monthlyAmortization: null,?\s*\}\)/g,
  'quoteState.termOptions.push({ dealType: "Installment", contractPrice: null, downPayment: 0, months: 12, monthlyAmortization: null })'
);
fs.writeFileSync(formFile, form);
console.log('Fixed QuoteFormPanel addTermOption');

// Fix quote-state-mapper.ts - line 171 area
const mapperFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\utils\\quote-state-mapper.ts';
let mapper = fs.readFileSync(mapperFile, 'utf-8');

// Replace term_options mapping that creates objects without dealType/contractPrice
mapper = mapper.replace(
  /\.map\(\(t[^)]*\)\s*=>\s*\(\{\s*downPayment: t\.down_payment[^}]*\}\)\)/g,
  '.map((t: any) => ({ dealType: "Installment", contractPrice: null, downPayment: t.down_payment, months: t.months, monthlyAmortization: t.monthly_amortization ?? null }))'
);

// Also fix any spread patterns
mapper = mapper.replace(
  /\{ downPayment: t\.down_payment, months: t\.months, monthlyAmortization: t\.monthly_amortization[^}]* \}/g,
  '{ dealType: "Installment", contractPrice: null, downPayment: t.down_payment, months: t.months, monthlyAmortization: t.monthly_amortization ?? null }'
);

fs.writeFileSync(mapperFile, mapper);
console.log('Fixed quote-state-mapper');
