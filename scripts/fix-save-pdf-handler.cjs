const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add @save-pdf handler to QuoteFormPanel component usage
content = content.replace(
  '<QuoteFormPanel',
  '<QuoteFormPanel @save-pdf="() => printQuote(quoteState)"'
);

fs.writeFileSync(file, content);
console.log('Save PDF handler connected in QuoteBuilderView');
