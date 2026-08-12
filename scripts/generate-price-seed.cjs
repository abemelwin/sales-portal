const fs = require('fs');
const path = require('path');

const prices = JSON.parse(fs.readFileSync(path.join(__dirname, 'machine-prices.json'), 'utf-8'));

let sql = `-- Auto-generated: Update machines with pricing data from reference portal\nBEGIN;\n\n`;

prices.forEach(m => {
  const model = m.model.replace(/'/g, "''");
  const brand = m.brand.replace(/'/g, "''");
  const pw = m.printheadWarranty ? String(m.printheadWarranty).replace(/'/g, "''") : '0 mo.';
  sql += `UPDATE machines SET srp = ${m.srp}, lbp = ${m.lbp}, cash_price = ${m.cashPrice}, machine_warranty_months = ${m.machineWarranty}, printhead_warranty = '${pw}' WHERE brand = '${brand}' AND model = '${model}';\n`;
});

sql += `\nCOMMIT;\n`;

const outPath = path.join(__dirname, '..', 'supabase', 'seed-prices.sql');
fs.writeFileSync(outPath, sql);
console.log(`Generated ${outPath} with ${prices.length} UPDATE statements`);
