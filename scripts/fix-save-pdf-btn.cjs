const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the "OPEN CLOSING DOCUMENTS" button and add "SAVE AS PDF" after it
const closingBtn = '      <!-- Open Closing Documents Button -->';
const idx = content.indexOf(closingBtn);

if (idx === -1) {
  console.log('Cannot find closing docs button marker');
  // Try to find the button itself
  const alt = 'class="closing-docs-btn"';
  const altIdx = content.indexOf(alt);
  if (altIdx === -1) { console.log('Cannot find any marker'); process.exit(1); }
  
  // Find the end of that button (</button>)
  const btnEnd = content.indexOf('</button>', altIdx);
  const insertAt = btnEnd + '</button>'.length;
  
  content = content.substring(0, insertAt) + `

      <!-- Save as PDF Button -->
      <button type="button" class="save-pdf-btn" @click="$emit('save-pdf')">
        \uD83D\uDCBE SAVE AS PDF
      </button>
      <p class="fp-note" style="text-align:center;margin-top:4px">Tip: in the print dialog, set Destination to "Save as PDF"</p>
` + content.substring(insertAt);
} else {
  // Find the button after the comment
  const btnStart = content.indexOf('<button', idx);
  const btnEnd = content.indexOf('</button>', btnStart);
  const insertAt = btnEnd + '</button>'.length;
  
  content = content.substring(0, insertAt) + `

      <!-- Save as PDF Button -->
      <button type="button" class="save-pdf-btn" @click="$emit('save-pdf')">
        \uD83D\uDCBE SAVE AS PDF
      </button>
      <p class="fp-note" style="text-align:center;margin-top:4px">Tip: in the print dialog, set Destination to "Save as PDF"</p>
` + content.substring(insertAt);
}

// Add CSS for the button
if (!content.includes('.save-pdf-btn')) {
  content = content.replace(
    '</style>',
    `.save-pdf-btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}

.save-pdf-btn:hover {
  background: #a93226;
}
</style>`
  );
}

// Add the emit declaration
if (!content.includes("'save-pdf'")) {
  content = content.replace(
    "const emit = defineEmits",
    "const emit = defineEmits"
  );
  // Check if defineEmits exists
  if (!content.includes('defineEmits')) {
    // Add it after script setup opening
    content = content.replace(
      '<script setup lang="ts">',
      '<script setup lang="ts">\nconst emit = defineEmits<{ (e: \'save-pdf\'): void }>()'
    );
  }
}

fs.writeFileSync(file, content);
console.log('Save as PDF button added to form panel');
