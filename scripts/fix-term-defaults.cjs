const fs = require('fs');

// Fix useQuoteBuilder.ts - update default term option
const composableFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\composables\\useQuoteBuilder.ts';
let composable = fs.readFileSync(composableFile, 'utf-8');

// Fix the default term options in the initial state
composable = composable.replace(
  /termOptions: \[\s*\{\s*downPayment: 0,\s*months: \d+,\s*monthlyAmortization: null,?\s*\}\s*\]/g,
  'termOptions: []'
);

// Fix any addTermOption helper that creates term options
composable = composable.replace(
  /\{ downPayment: 0, months: \d+, monthlyAmortization: null \}/g,
  '{ dealType: "Installment", contractPrice: null, downPayment: 0, months: 12, monthlyAmortization: null }'
);

fs.writeFileSync(composableFile, composable);
console.log('Fixed useQuoteBuilder defaults');

// Fix quote-state-mapper.ts
const mapperFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\utils\\quote-state-mapper.ts';
let mapper = fs.readFileSync(mapperFile, 'utf-8');

// Fix term options mapping
mapper = mapper.replace(
  /\{ downPayment: ([\w.]+), months: ([\w.]+), monthlyAmortization: ([\w.|null ]+) \}/g,
  '{ dealType: "Installment", contractPrice: null, downPayment: $1, months: $2, monthlyAmortization: $3 }'
);

fs.writeFileSync(mapperFile, mapper);
console.log('Fixed quote-state-mapper');
