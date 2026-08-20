const fs = require('fs');

// 1. Update router - make /closing-docs redirect to /quotes/new?openDocs=true
const routerFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let router = fs.readFileSync(routerFile, 'utf-8');

// Replace the closing-docs-index route to redirect to quotes/new
router = router.replace(
  /\{\s*path: '\/closing-docs',\s*name: 'closing-docs-index',\s*component:.*?ClosingDocsIndexView.*?\}/s,
  `{
    path: '/closing-docs',
    name: 'closing-docs-index',
    redirect: '/quotes/new?openDocs=true',
    meta: { requiresAuth: true }
  }`
);

fs.writeFileSync(routerFile, router);
console.log('Router updated - /closing-docs now redirects to /quotes/new?openDocs=true');

// 2. Update QuoteBuilderView to auto-open the modal when openDocs=true query param is present
const qbFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let qb = fs.readFileSync(qbFile, 'utf-8');

// Find the onMounted or a good place to add the check
// Add after the route loading check
if (!qb.includes('openDocs')) {
  // Find the onMounted
  const onMountedIdx = qb.indexOf('onMounted(');
  if (onMountedIdx !== -1) {
    // Find the closing of onMounted
    // Add a watch for the query param instead
    const insertPoint = qb.indexOf('// \u2500\u2500\u2500 Mobile Tab Navigation');
    if (insertPoint === -1) {
      // Try alternate location - after imports
      const altPoint = qb.indexOf('provide(QUOTE_BUILDER_KEY, quoteState)');
      if (altPoint !== -1) {
        const afterProvide = qb.indexOf('\n', altPoint) + 1;
        qb = qb.substring(0, afterProvide) + `
// Auto-open Closing Docs modal when navigated with ?openDocs=true
const route = useRoute()
watch(() => route.query.openDocs, (val) => {
  if (val === 'true') {
    // Trigger the closing docs prompt in the form panel
    setTimeout(() => {
      const btn = document.querySelector('.closing-docs-btn') as HTMLButtonElement
      if (btn) btn.click()
    }, 500)
  }
}, { immediate: true })

` + qb.substring(afterProvide);
      }
    }
  }
}

fs.writeFileSync(qbFile, qb);
console.log('QuoteBuilderView updated - auto-opens modal on ?openDocs=true');
