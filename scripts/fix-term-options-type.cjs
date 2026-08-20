const fs = require('fs');

const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\composables\\useQuoteBuilder.ts';
let content = fs.readFileSync(file, 'utf-8');

// Update term options interface to include dealType and contractPrice
content = content.replace(
  `termOptions: {
    downPayment: number
    months: number
    monthlyAmortization: number | null
  }[]`,
  `termOptions: {
    dealType: string
    contractPrice: number | null
    downPayment: number
    months: number
    monthlyAmortization: number | null
  }[]`
);

fs.writeFileSync(file, content);
console.log('Term options type updated');
