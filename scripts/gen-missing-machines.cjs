const fs = require('fs');
const path = require('path');

const missing = JSON.parse(fs.readFileSync(path.join(__dirname, 'missing-machines.json'), 'utf-8'));

let sql = "-- Insert 8 missing machines into database\nBEGIN;\n\n";

missing.forEach(m => {
  const brand = m.brand.replace(/'/g, "''");
  const model = m.model.replace(/'/g, "''");
  const pw = m.printheadWarranty ? String(m.printheadWarranty).replace(/'/g, "''") : '0';
  sql += `INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)\n`;
  sql += `  VALUES ('${brand}', '${model}', NULL, 'Brand New', 'ES Print Media Inc.', true, ${m.srp}, ${m.lbp}, ${m.cashPrice}, ${m.machineWarranty}, '${pw}')\n`;
  sql += `  ON CONFLICT DO NOTHING;\n\n`;
});

sql += "COMMIT;\n";

const outPath = path.join(__dirname, '..', 'supabase', 'seed-missing-machines.sql');
fs.writeFileSync(outPath, sql);
console.log(`Generated ${outPath}`);
console.log(`\nMissing machines:`);
missing.forEach(m => console.log(`  ${m.brand} - ${m.model} (SRP: ${m.srp})`));
