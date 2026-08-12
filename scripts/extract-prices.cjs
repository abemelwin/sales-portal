const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'Sales-Portal.html'), 'utf-8');

// Find the MACHINES= line
const match = html.match(/var MACHINES=(\{.*?\});\s*\n/);
if (!match) {
  console.error('Could not find MACHINES data');
  process.exit(1);
}

const machines = JSON.parse(match[1]);
const keys = Object.keys(machines).sort();

console.log(`Found ${keys.length} machines\n`);

// Output a summary with pricing
const output = [];
keys.forEach(k => {
  const m = machines[k];
  output.push({
    key: k,
    brand: m.brand,
    model: m.quoteTitle,
    srp: m.srp || 0,
    lbp: m.lbp || 0,
    cashPrice: m.cashPrice || 0,
    machineWarranty: m.machineWarranty || 0,
    printheadWarranty: m.printheadWarranty || ''
  });
});

// Write as JSON for use later
fs.writeFileSync(path.join(__dirname, 'machine-prices.json'), JSON.stringify(output, null, 2));
console.log(`Wrote ${output.length} machine prices to scripts/machine-prices.json`);

// Show first 10 
output.slice(0, 10).forEach(m => {
  console.log(`${m.brand} | ${m.model} | SRP:${m.srp} | LBP:${m.lbp} | Cash:${m.cashPrice} | MW:${m.machineWarranty} | PW:${m.printheadWarranty}`);
});
