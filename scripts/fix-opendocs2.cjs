const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove the duplicate "const route = useRoute()" we just added
// Keep the original one
let count = 0;
content = content.replace(/const route = useRoute\(\)\n/g, (match) => {
  count++;
  return count === 1 ? match : ''; // keep first, remove second
});

// Also remove duplicate useRoute import
let importCount = 0;
content = content.replace(/import { useRoute } from 'vue-router'\n/g, (match) => {
  importCount++;
  return importCount === 1 ? match : '';
});

fs.writeFileSync(file, content);
console.log('Fixed duplicate route declaration');
