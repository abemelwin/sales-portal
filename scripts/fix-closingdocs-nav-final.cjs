const fs = require('fs');

// Change approach: instead of redirect, make nav link directly trigger the modal
// via the NavBar component

// 1. Update router - change closing-docs back to a real route that shows the Quote Generator
const routerFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let router = fs.readFileSync(routerFile, 'utf-8');

// Replace the redirect with a component that just renders QuoteBuilderView with openDocs flag
router = router.replace(
  `path: '/closing-docs',
    name: 'closing-docs-index',
    redirect: '/quotes/new?openDocs=true',
    meta: { requiresAuth: true }`,
  `path: '/closing-docs',
    name: 'closing-docs-index',
    component: () => import('@/views/QuoteBuilderView.vue'),
    meta: { requiresAuth: true }`
);

fs.writeFileSync(routerFile, router);
console.log('Router: /closing-docs now loads QuoteBuilderView directly');

// 2. Update QuoteBuilderView to check route path instead of query
const qbFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(qbFile, 'utf-8').split('\n');

// Find the onMounted openDocs check and change to check route.path
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("route.query.openDocs === 'true'")) {
    lines[i] = lines[i].replace("route.query.openDocs === 'true'", "route.path === '/closing-docs'");
    console.log('Changed openDocs check to route.path check');
    break;
  }
}

fs.writeFileSync(qbFile, lines.join('\n'));
console.log('QuoteBuilderView updated');
