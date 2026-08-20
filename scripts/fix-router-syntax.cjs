const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let content = fs.readFileSync(file, 'utf-8');

// Fix the double closing brace issue
content = content.replace(
  `    meta: { requiresAuth: true }
  }
  },`,
  `    meta: { requiresAuth: true }
  },`
);

fs.writeFileSync(file, content);
console.log('Fixed router syntax - removed extra closing brace');
