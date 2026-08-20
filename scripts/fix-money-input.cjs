const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Replace contract price input - use @blur only for formatting, v-model for value
content = content.replace(
  `<input
          id="contract-price"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.contractPrice)"
          @input="quoteState.contractPrice = parseMoney(($event.target as HTMLInputElement).value)"
          @blur="($event.target as HTMLInputElement).value = formatMoney(quoteState.contractPrice)"
          placeholder="0"
        />`,
  `<input
          id="contract-price"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.contractPrice)"
          @focus="($event.target as HTMLInputElement).value = quoteState.contractPrice ? String(quoteState.contractPrice) : ''"
          @blur="handleMoneyBlur($event, 'contractPrice')"
          placeholder="0"
        />`
);

// Replace downpayment input
content = content.replace(
  `<input
          id="downpayment"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.downPayment)"
          @input="quoteState.downPayment = parseMoney(($event.target as HTMLInputElement).value)"
          @blur="($event.target as HTMLInputElement).value = formatMoney(quoteState.downPayment)"
          placeholder="0"
        />`,
  `<input
          id="downpayment"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.downPayment)"
          @focus="($event.target as HTMLInputElement).value = quoteState.downPayment ? String(quoteState.downPayment) : ''"
          @blur="handleMoneyBlur($event, 'downPayment')"
          placeholder="0"
        />`
);

// Update the helper functions
content = content.replace(
  `// Money formatting helpers
function formatMoney(val: number | null): string {
  if (val === null || val === 0) return ''
  return val.toLocaleString('en-PH')
}

function parseMoney(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}`,
  `// Money formatting helpers
function formatMoney(val: number | null): string {
  if (val === null || val === 0) return ''
  return val.toLocaleString('en-PH')
}

function handleMoneyBlur(event: Event, field: 'contractPrice' | 'downPayment') {
  const input = event.target as HTMLInputElement
  const cleaned = input.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  const value = isNaN(num) ? 0 : num
  ;(quoteState as any)[field] = value
  input.value = formatMoney(value)
}`
);

fs.writeFileSync(file, content);
console.log('Money inputs fixed - format on blur only');
