const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\layout\\NavBar.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find the watch and remove the !permStore.loaded condition
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (newRole && !permStore.loaded)')) {
    lines[i] = lines[i].replace('if (newRole && !permStore.loaded)', 'if (newRole)');
    console.log('Fixed: removed !permStore.loaded guard');
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
