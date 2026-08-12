const fs = require('fs');
const path = require('path');

// Read prices
const prices = JSON.parse(fs.readFileSync(path.join(__dirname, 'machine-prices.json'), 'utf-8'));
const priceMap = {};
prices.forEach(p => {
  const key = `${p.brand}|||${p.model}`;
  priceMap[key] = p;
});

// Read current seed
let seed = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'catalog-seed.sql'), 'utf-8');

// For each INSERT INTO machines line, add the price columns
seed = seed.replace(
  /INSERT INTO machines \(brand, model, sub_model, unit_condition, letterhead, is_active\)\s*\n\s*VALUES \('([^']+)', '([^']+)', (NULL|'[^']*'), '([^']+)', '([^']+)', (true|false)\)/g,
  (match, brand, model, subModel, unitCond, letterhead, isActive) => {
    const key = `${brand}|||${model}`;
    const p = priceMap[key];
    const srp = p ? p.srp : 0;
    const lbp = p ? p.lbp : 0;
    const cash = p ? p.cashPrice : 0;
    const mw = p ? p.machineWarranty : 12;
    const pw = p ? (p.printheadWarranty || '0') : '0';
    return `INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)\n  VALUES ('${brand}', '${model}', ${subModel}, '${unitCond}', '${letterhead}', ${isActive}, ${srp}, ${lbp}, ${cash}, ${mw}, '${pw}')`;
  }
);

fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'catalog-seed.sql'), seed);
console.log('catalog-seed.sql updated with pricing columns');
