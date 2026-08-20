const fs = require('fs');

// Fix 1: ClosingDocsPrompt - unused 'item' in v-for
const promptFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\ClosingDocsPrompt.vue';
let prompt = fs.readFileSync(promptFile, 'utf-8');
prompt = prompt.replace(
  'v-for="(item, idx) in additionalItems"',
  'v-for="(_item, idx) in additionalItems"'
);
fs.writeFileSync(promptFile, prompt);
console.log('Fixed unused item variable');

// Fix 2: QuoteFormPanel imports ClosingDocsFormData which no longer exists
const formFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let form = fs.readFileSync(formFile, 'utf-8');
// Remove the import of ClosingDocsFormData
form = form.replace(/import.*ClosingDocsFormData.*\n/g, '');
// Also remove any usage of the type
form = form.replace(/ClosingDocsFormData/g, 'any');
fs.writeFileSync(formFile, form);
console.log('Fixed ClosingDocsFormData import');
