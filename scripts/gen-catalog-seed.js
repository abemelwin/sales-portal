const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'Sales-Portal.html'), 'utf8');

// Extract MACHINES object using eval in a sandbox
const match = html.match(/var MACHINES=(\{[\s\S]+?\});[\r\n]/);
if (!match) { console.error('MACHINES not found'); process.exit(1); }

let machines;
try {
  machines = JSON.parse(match[1]);
} catch(e) {
  // Try broader match
  const start = html.indexOf('var MACHINES={');
  const varStart = start + 'var MACHINES='.length;
  // Find matching closing brace
  let depth = 0, end = varStart;
  for (let i = varStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  machines = JSON.parse(html.substring(varStart, end + 1));
}

const keys = Object.keys(machines);
console.error(`Found ${keys.length} machines`);

const lines = [
  '-- Seed: populate has_trade_in, has_printhead, service_fee, availability, image_key, unit_condition',
  '-- Generated from Sales-Portal.html MACHINES catalog',
  'BEGIN;',
  ''
];

for (const key of keys) {
  const m = machines[key];
  const title = (m.quoteTitle || '').replace(/'/g, "''");
  const brand = (m.brand || '').replace(/'/g, "''");
  const category = (m.category || '').replace(/'/g, "''");
  const hasTrade = m.hasTradeIn ? 'true' : 'false';
  const hasPH = m.hasPrinthead ? 'true' : 'false';

  let fee = 0;
  for (const wl of (m.warrantyLines || [])) {
    const t = wl.t || '';
    const feeMatch = t.match(/service fee of [P₱]\s*([\d,]+(?:\.\d+)?)/);
    if (feeMatch) { fee = parseFloat(feeMatch[1].replace(/,/g, '')); break; }
  }

  const avail = (m.defaultAvail || '').replace(/'/g, "''").replace(/[–—]/g, '-');
  const imgKey = (m.imageKey || '').replace(/'/g, "''");

  lines.push(`UPDATE machines SET has_trade_in=${hasTrade}, has_printhead=${hasPH}, service_fee=${fee}, availability=NULLIF('${avail}',''), image_key=NULLIF('${imgKey}',''), unit_condition='${category}' WHERE brand='${brand}' AND model='${title}';`);
}

lines.push('');
lines.push('COMMIT;');

const out = lines.join('\n');
fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed-catalog-fields.sql'), out, 'utf8');
console.error(`Written ${keys.length} UPDATE statements`);
console.log('Done');
