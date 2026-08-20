const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\layout\\NavBar.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find and remove the Closing Docs nav link
const removeIdxs = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('closing-docs') || lines[i].includes('Closing Docs')) {
    // Check if it's a router-link or nav item
    if (lines[i].includes('<router-link') || lines[i].includes('to=')) {
      removeIdxs.push(i);
    } else if (lines[i].includes('Closing Docs') && (lines[i].includes('label') || lines[i].includes("'"))) {
      removeIdxs.push(i);
    }
  }
}

// Remove found lines
removeIdxs.sort((a, b) => b - a);
for (const idx of removeIdxs) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Removed ${removeIdxs.length} Closing Docs nav references`);
