const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// The error is about quoteState having these properties through type inference
// The issue is likely that the ClosingDocsPrompt import is wrong
// Check if it's imported properly
if (!content.includes("import ClosingDocsPrompt")) {
  // Find where to add the import
  const lastImport = content.lastIndexOf("import ");
  const endOfLine = content.indexOf('\n', lastImport);
  content = content.substring(0, endOfLine + 1) + 
    "import ClosingDocsPrompt from '@/components/quote/ClosingDocsPrompt.vue'\n" +
    content.substring(endOfLine + 1);
  console.log('Added ClosingDocsPrompt import');
}

fs.writeFileSync(file, content);
