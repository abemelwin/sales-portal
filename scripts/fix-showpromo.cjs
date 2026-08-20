const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove the unused showPromo computed
content = content.replace(/const showPromo = computed\(\(\) => \{[^}]+\}\)\s*\n/g, '');

fs.writeFileSync(file, content);
console.log('Removed unused showPromo');
