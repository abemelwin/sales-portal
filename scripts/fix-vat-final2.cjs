const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// The file got corrupted - there's a duplicate <script> insertion
// Find where the duplication starts and remove it
const badPart = '})<script setup lang="ts">';
const idx = content.indexOf(badPart);
if (idx !== -1) {
  // Remove from "})" up to the duplicate script tag
  // The real file should end the addon computed with })\n\n and then continue with consumableDisplayList
  const beforeBad = content.substring(0, idx + 2); // keep the })
  
  // Find the consumableDisplayList after the bad section
  const consIdx = content.indexOf('\nconst consumableDisplayList', idx);
  if (consIdx !== -1) {
    content = beforeBad + '\n' + content.substring(consIdx);
  } else {
    console.log('Cannot find consumableDisplayList after corruption');
    process.exit(1);
  }
}

fs.writeFileSync(file, content);
console.log('Fixed file corruption');
