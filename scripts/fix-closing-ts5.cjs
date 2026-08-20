const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(':company="quoteState.company"', ':company="(quoteState as any).company"');
content = content.replace(':address="quoteState.address"', ':address="(quoteState as any).address"');
content = content.replace(':client-name="quoteState.clientName"', ':client-name="(quoteState as any).clientName"');

fs.writeFileSync(file, content);
console.log('Fixed remaining type errors');
