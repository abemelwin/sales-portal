const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add missing QUOTE_BUILDER_KEY import
if (!content.includes("import { QUOTE_BUILDER_KEY")) {
  content = content.replace(
    "import { computeAmortization",
    "import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'\nimport { computeAmortization"
  );
}

// Also add useAuth import if missing (needed for role check)
if (!content.includes("import { useAuth }")) {
  content = content.replace(
    "import { QUOTE_BUILDER_KEY }",
    "import { useAuth } from '@/composables/useAuth'\nimport { QUOTE_BUILDER_KEY }"
  );
}

// Remove all the 'as any' casts we added since now the type should resolve
content = content.replace(/\(quoteState as any\)\./g, 'quoteState.');

fs.writeFileSync(file, content);
console.log('Added QUOTE_BUILDER_KEY import');
