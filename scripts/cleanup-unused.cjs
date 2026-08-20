const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Remove unused imports
content = content.replace("import { toQuotePayload, restoreFromQuote } from '@/utils/quote-state-mapper'\n", "import { restoreFromQuote } from '@/utils/quote-state-mapper'\n");

// Remove unused router (but keep route)
content = content.replace("const router = useRouter()\n", "");
content = content.replace("import { useRoute, useRouter } from 'vue-router'\n", "import { useRoute } from 'vue-router'\n");

// Remove unused saving ref
content = content.replace("const saving = ref(false)\n", "");

// Remove saveError and saveSuccess if still present
content = content.replace(/\/\*\* Whether a save operation is in progress \*\/\n/g, '');
content = content.replace(/\/\*\* Error message to display to the user \*\/\n/g, '');
content = content.replace(/\/\*\* Success message to display temporarily \*\/\n/g, '');
content = content.replace("const saveError = ref<string | null>(null)\n", "");
content = content.replace("const saveSuccess = ref(false)\n", "");

fs.writeFileSync(file, content);
console.log('Cleaned up unused variables');
