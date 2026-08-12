const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'Sales-Portal.html'), 'utf-8');

// Extract the BUILTIN_PRICELISTS JSON array
const match = html.match(/var BUILTIN_PRICELISTS=(\[.*?\]);\s*\n/);
if (!match) {
  console.error('Could not find BUILTIN_PRICELISTS');
  process.exit(1);
}

const pricelists = JSON.parse(match[1]);
console.log(`Found ${pricelists.length} built-in pricelists:\n`);

const outDir = path.join(__dirname, '..', 'public', 'pricelists');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

pricelists.forEach(p => {
  const buffer = Buffer.from(p.b64, 'base64');
  const filename = p.id + '.pdf';
  fs.writeFileSync(path.join(outDir, filename), buffer);
  console.log(`  ${p.name} (${p.date}) -> ${filename} (${(buffer.length/1024).toFixed(1)} KB)`);
});

// Write metadata JSON for the Vue component
const meta = pricelists.map(p => ({ id: p.id, name: p.name, date: p.date }));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(meta, null, 2));
console.log(`\nWrote index.json with ${meta.length} entries`);
