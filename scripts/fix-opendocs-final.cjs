const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace the current openDocs watch with a simpler approach using onMounted
const oldWatch = `// Auto-open Closing Docs modal when navigated with ?openDocs=true
const route = useRoute()
watch(() => route.query.openDocs, (val) => {
  if (val === 'true') {
    setTimeout(() => {
      const btn = document.querySelector('.closing-docs-btn') as HTMLButtonElement
      if (btn) btn.click()
    }, 500)
  }
}, { immediate: true })`;

const newWatch = `// Auto-open Closing Docs modal when navigated with ?openDocs=true
const route = useRoute()
onMounted(() => {
  if (route.query.openDocs === 'true') {
    setTimeout(() => {
      const btn = document.querySelector('.closing-docs-btn') as HTMLButtonElement
      if (btn) btn.click()
    }, 800)
  }
})`;

content = content.replace(oldWatch, newWatch);

// Make sure watch is not imported if unused, and onMounted is imported
if (!content.includes('onMounted')) {
  content = content.replace(
    'import { provide,',
    'import { provide, onMounted,'
  );
}

// Remove watch from imports if no longer used elsewhere
// Actually keep it in case it's used elsewhere

fs.writeFileSync(file, content);
console.log('Changed to onMounted approach for openDocs');
