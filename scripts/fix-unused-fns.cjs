const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove unused clampMonths and clampDownPayment functions
content = content.replace(/function clampMonths\([^)]*\)\s*\{[^}]*\}\s*/g, '');
content = content.replace(/function clampDownPayment\([^)]*\)\s*\{[^}]*\}\s*/g, '');

fs.writeFileSync(file, content);
console.log('Removed unused functions');
