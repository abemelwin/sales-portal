const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Fix the template bindings - cast quoteState properties
content = content.replace(
  ':client-contact="quoteState.contact"',
  ':client-contact="(quoteState as any).contact"'
);
content = content.replace(
  ':client-conforme="quoteState.clientConforme"',
  ':client-conforme="(quoteState as any).clientConforme"'
);
content = content.replace(
  ':ae-name="quoteState.aeName"',
  ':ae-name="(quoteState as any).aeName"'
);

fs.writeFileSync(file, content);
console.log('Fixed type errors with as any cast');
