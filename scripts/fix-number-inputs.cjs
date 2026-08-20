const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Fix Contact No. input - add inputmode="tel" and filter non-numeric on input
content = content.replace(
  'id="client-contact" class="fp-in" type="text" v-model="quoteState.contact" placeholder="09XX XXX XXXX"',
  'id="client-contact" class="fp-in" type="tel" inputmode="tel" v-model="quoteState.contact" placeholder="09XX XXX XXXX" @input="quoteState.contact = quoteState.contact.replace(/[^0-9+ ()-]/g, \'\')"'
);

// Fix Contract Price - already using formatMoney, just ensure inputmode
// Fix Terms/Months input - numbers only
content = content.replace(
  'id="inst-months" class="fp-in" type="number"',
  'id="inst-months" class="fp-in" type="number" inputmode="numeric"'
);

fs.writeFileSync(file, content);
console.log('Contact number input restricted to digits only');
