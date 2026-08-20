const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Add watch import if not present
if (!content.includes('watch,')) {
  content = content.replace(
    'import { provide,',
    'import { provide, watch,'
  );
} else if (!content.includes(', watch')) {
  // watch might already be there
}

// Add route usage + watch after provide
const provideIdx = content.indexOf('provide(QUOTE_BUILDER_KEY, quoteState)');
if (provideIdx === -1) {
  console.log('Cannot find provide statement');
  process.exit(1);
}

const afterProvide = content.indexOf('\n', provideIdx) + 1;

// Check if useRoute is imported
if (!content.includes('useRoute')) {
  content = content.replace(
    "import { useRoute } from 'vue-router'",
    "import { useRoute } from 'vue-router'"
  );
  // If no useRoute import, add it
  if (!content.includes('useRoute')) {
    content = content.replace(
      "import { provide,",
      "import { useRoute } from 'vue-router'\nimport { provide,"
    );
  }
}

// Add the route const and watch
const openDocsCode = `
// Auto-open Closing Docs modal when navigated with ?openDocs=true
const route = useRoute()
watch(() => route.query.openDocs, (val) => {
  if (val === 'true') {
    setTimeout(() => {
      const btn = document.querySelector('.closing-docs-btn') as HTMLButtonElement
      if (btn) btn.click()
    }, 500)
  }
}, { immediate: true })

`;

// Insert after provide line
content = content.substring(0, afterProvide) + openDocsCode + content.substring(afterProvide);

fs.writeFileSync(file, content);
console.log('Added openDocs watch to QuoteBuilderView');
