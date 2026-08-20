const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\utils\\quote-state-mapper.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  `.map((opt) => ({
        downPayment: opt.down_payment,
        months: opt.months,
        monthlyAmortization: opt.monthly_amortization ?? null,
      }))`,
  `.map((opt) => ({
        dealType: 'Installment' as string,
        contractPrice: null as number | null,
        downPayment: opt.down_payment,
        months: opt.months,
        monthlyAmortization: opt.monthly_amortization ?? null,
      }))`
);

fs.writeFileSync(file, content);
console.log('Fixed mapper .map()');
