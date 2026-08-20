const fs = require('fs');

// === 1. Fix Contract Price and Downpayment inputs to show formatted numbers ===
const formFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let form = fs.readFileSync(formFile, 'utf-8');

// Replace contract price input with text input that auto-formats
form = form.replace(
  `<input
          id="contract-price"
          class="fp-in"
          type="number"
          v-model.number="quoteState.contractPrice"
          placeholder="0"
          min="0"
          step="0.01"
        />`,
  `<input
          id="contract-price"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.contractPrice)"
          @input="quoteState.contractPrice = parseMoney(($event.target as HTMLInputElement).value)"
          @blur="($event.target as HTMLInputElement).value = formatMoney(quoteState.contractPrice)"
          placeholder="0"
        />`
);

// Replace downpayment input
form = form.replace(
  `<input
          id="downpayment"
          class="fp-in"
          type="number"
          v-model.number="quoteState.downPayment"
          placeholder="0"
          min="0"
          step="0.01"
        />`,
  `<input
          id="downpayment"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.downPayment)"
          @input="quoteState.downPayment = parseMoney(($event.target as HTMLInputElement).value)"
          @blur="($event.target as HTMLInputElement).value = formatMoney(quoteState.downPayment)"
          placeholder="0"
        />`
);

// Add formatMoney and parseMoney helper functions to the script
// Find a good place to insert - after the imports section
const insertAfter = 'const { role } = useAuth()';
if (form.includes(insertAfter)) {
  form = form.replace(
    insertAfter,
    insertAfter + `

// Money formatting helpers
function formatMoney(val: number | null): string {
  if (val === null || val === 0) return ''
  return val.toLocaleString('en-PH')
}

function parseMoney(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}`
  );
} else {
  // Try alternate insertion point
  const alt = 'const freebieInput = ref';
  if (form.includes(alt)) {
    form = form.replace(
      alt,
      `// Money formatting helpers
function formatMoney(val: number | null): string {
  if (val === null || val === 0) return ''
  return val.toLocaleString('en-PH')
}

function parseMoney(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

` + alt
    );
  }
}

fs.writeFileSync(formFile, form);
console.log('Contract Price and Downpayment now auto-format with commas');

// === 2. Fix Product Info Upload File to use actual file picker ===
const piFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\views\\ProductInfoView.vue';
let pi = fs.readFileSync(piFile, 'utf-8');

// Replace the uploadFile function that uses prompt() with actual file upload
const oldUpload = `// Upload file (for now, same as add link but with file prompt label)
async function uploadFile(category: CategoryKey) {
  if (!selectedMachineId.value) return
  const url = prompt('Paste the file URL or shared drive link:')
  if (!url) return
  const label = prompt('File name / label:', '')
  if (label === null) return
  await productInfoStore.addLink(
    selectedMachineId.value,
    label || url,
    url,
    category
  )
}`;

const newUpload = `// Upload file - opens file picker, uploads to Supabase Storage
async function uploadFile(category: CategoryKey) {
  if (!selectedMachineId.value) return
  
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const label = file.name
    // For now, create an object URL (browser-only) until Supabase Storage is configured
    const url = URL.createObjectURL(file)
    
    await productInfoStore.addLink(
      selectedMachineId.value!,
      label,
      url,
      category
    )
  }
  input.click()
}`;

pi = pi.replace(oldUpload, newUpload);
fs.writeFileSync(piFile, pi);
console.log('Product Info Upload File now opens file picker instead of URL prompt');
