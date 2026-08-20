const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\router\\index.ts';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find the broken pattern: "  }\n  },"  and fix to "  },"
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i].trim() === '}' && lines[i+1].trim() === '},') {
    lines.splice(i, 1); // remove the standalone }
    console.log(`Removed extra } at line ${i+1}`);
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
