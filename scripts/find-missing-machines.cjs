const fs = require('fs');
const path = require('path');

// Load all machine models from the reference (246)
const prices = JSON.parse(fs.readFileSync(path.join(__dirname, 'machine-prices.json'), 'utf-8'));
const refModels = new Set(prices.map(p => p.model));

// Load seeded machines from catalog-seed.sql
const seed = fs.readFileSync(path.join(__dirname, 'catalog-seed.sql'), 'utf-8');
const seededModels = new Set();
const re = /VALUES \('[^']+', '([^']+)',/g;
let m;
while ((m = re.exec(seed)) !== null) {
  seededModels.add(m[1]);
}

console.log(`Reference: ${refModels.size} machines`);
console.log(`Seeded: ${seededModels.size} machines`);
console.log(`\nMissing from seed (in reference but not seeded):`);

const missing = [];
for (const model of refModels) {
  if (!seededModels.has(model)) {
    const p = prices.find(x => x.model === model);
    missing.push(p);
    console.log(`  ${p.brand} | ${p.model}`);
  }
}

console.log(`\nTotal missing: ${missing.length}`);
fs.writeFileSync(path.join(__dirname, 'missing-machines.json'), JSON.stringify(missing, null, 2));
