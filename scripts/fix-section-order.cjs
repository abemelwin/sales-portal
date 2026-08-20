const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the Consumables section and the Exclusions section, then swap them
// Markers:
// Consumables starts: "<!-- Consumable Prices -->" or the v-if with consumables.length
// Exclusions starts: the v-if with exclusionItems.length

// Find Consumables block
const consStart = content.indexOf('      <!-- Consumable Prices -->');
if (consStart === -1) {
  // Try alternate marker
  var consStart2 = content.indexOf('      <div v-if="quoteState.consumables.length > 0">');
  if (consStart2 === -1) { console.log('Cannot find consumables section'); process.exit(1); }
  // Back up to the hr before it
  var hrBefore = content.lastIndexOf('<hr class="fp-hr" />', consStart2);
  var actualConsStart = hrBefore;
} else {
  var actualConsStart = consStart;
}

// Find Exclusions block  
const exclStart = content.indexOf('      <div v-if="quoteState.exclusionItems.length > 0">');
if (exclStart === -1) { console.log('Cannot find exclusions section'); process.exit(1); }
// Back up to hr
const exclHr = content.lastIndexOf('<hr class="fp-hr" />', exclStart);
const actualExclStart = exclHr;

// Find end of exclusions (it ends at Optional Add-Ons or next section)
const addonsStart = content.indexOf('      <div v-if="quoteState.addonItems.length > 0">', exclStart);
const exclEnd = content.lastIndexOf('<hr class="fp-hr" />', addonsStart);

// Find end of consumables (which is start of exclusions)
const consEnd = actualExclStart;

// Extract both sections
const consumablesBlock = content.substring(actualConsStart, consEnd);
const exclusionsBlock = content.substring(actualExclStart, addonsStart > 0 ? content.lastIndexOf('      <div v-if="quoteState.addonItems', addonsStart) : undefined);

// Actually, let me do this more simply - just find and swap the two div blocks
// Consumables: from its <hr> to Exclusions <hr>
// Exclusions: from its <hr> to Add-Ons

// Simpler approach: find the section between Package Inclusions end and Optional Add-Ons start
const inclEnd = content.indexOf('      <!-- Consumable Prices -->');
if (inclEnd === -1) {
  console.log('Using alternate approach');
}

// Let me find by the h2 titles
const consH2 = content.indexOf('<h2 class="fp-section-title">Consumables');
const exclH2 = content.indexOf('<h2 class="fp-section-title">Exclusions');
const addonsH2 = content.indexOf('<h2 class="fp-section-title">Optional Add-Ons');

if (consH2 === -1 || exclH2 === -1) {
  console.log('Cannot find section headers');
  process.exit(1);
}

// Get the full consumables section (from its containing div start to end)
// and the full exclusions section
// Find the container divs
const consDiv = content.lastIndexOf('<div v-if="quoteState.consumables.length > 0">', consH2);
const consHr = content.lastIndexOf('<hr class="fp-hr" />', consDiv);

const exclDiv = content.lastIndexOf('<div v-if="quoteState.exclusionItems.length > 0">', exclH2);
const exclHr2 = content.lastIndexOf('<hr class="fp-hr" />', exclDiv);

// Find the ends - exclusions ends where addons start
const addonsDiv = content.lastIndexOf('<div v-if="quoteState.addonItems.length > 0">', addonsH2);
const addonsHr = content.lastIndexOf('<hr class="fp-hr" />', addonsDiv);

// Consumables section: from consHr to exclHr2
const consumablesSec = content.substring(consHr, exclHr2);
// Exclusions section: from exclHr2 to addonsHr
const exclusionsSec = content.substring(exclHr2, addonsHr);

// Swap them
const newContent = content.substring(0, consHr) + exclusionsSec + consumablesSec + content.substring(addonsHr);

fs.writeFileSync(file, newContent);
console.log('Swapped Exclusions before Consumables');
console.log('New order: Inclusions -> Exclusions -> Consumables -> Add-Ons');
