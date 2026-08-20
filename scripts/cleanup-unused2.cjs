const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\QuoteBuilderView.vue';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

const removeLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { toQuotePayload")) {
    lines[i] = lines[i].replace("toQuotePayload, ", "");
  }
  if (lines[i].includes("import { useRoute, useRouter }")) {
    lines[i] = lines[i].replace(", useRouter", "");
  }
  if (lines[i].trim() === "const router = useRouter()") {
    removeLines.push(i);
  }
  if (lines[i].trim() === "const saving = ref(false)") {
    removeLines.push(i);
  }
  if (lines[i].includes("const saveError = ref")) {
    removeLines.push(i);
  }
  if (lines[i].includes("const saveSuccess = ref")) {
    removeLines.push(i);
  }
}

// Remove lines in reverse order
removeLines.sort((a, b) => b - a);
for (const idx of removeLines) {
  lines.splice(idx, 1);
}

fs.writeFileSync(file, lines.join('\n'));
console.log(`Fixed imports, removed ${removeLines.length} unused lines`);
