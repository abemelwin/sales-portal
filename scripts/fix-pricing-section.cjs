const fs = require('fs');

// 1. Add downPayment and months to QuoteBuilderState
const composableFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\composables\\useQuoteBuilder.ts';
let composable = fs.readFileSync(composableFile, 'utf-8');

// Add fields to interface after contractPrice
composable = composable.replace(
  'contractPrice: number | null\n  dealType: DealType | null',
  'contractPrice: number | null\n  downPayment: number\n  months: number\n  dealType: DealType | null'
);

// Add defaults in the reactive creation
composable = composable.replace(
  'contractPrice: null,\n    dealType: null,',
  'contractPrice: null,\n    downPayment: 0,\n    months: 12,\n    dealType: null,'
);

fs.writeFileSync(composableFile, composable);
console.log('Updated useQuoteBuilder.ts with downPayment + months');

// 2. Update the QuoteFormPanel pricing section
const formFile = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let form = fs.readFileSync(formFile, 'utf-8');

// Find the current Term Options section and replace with the reference layout
const oldTermSection = `      <!-- Term Options -->
      <div class="fp-sec" style="margin-top: 8px">
        <div class="fp-term-header">
          <label class="fp-lbl">Term Options ({{ quoteState.termOptions.length }}/5)</label>
          <button
            type="button"
            class="fp-add-btn fp-add-btn--inline"
            :disabled="!canAddTermOption"
            @click="addTermOption"
          >
            + Add
          </button>
        </div>
        <div
          v-for="(option, index) in quoteState.termOptions"
          :key="index"
          class="to-row"
        >
          <div class="to-hd">
            <span>Option {{ index + 1 }}</span>
            <button
              v-if="canRemoveTermOption"
              type="button"
              class="to-del"
              @click="removeTermOption(index)"
              :aria-label="\`Remove term option \${index + 1}\`"
            >
              &times;
            </button>
          </div>
          <div class="fp-row">
            <div class="fp-sec">
              <label :for="\`dp-\${index}\`" class="fp-lbl">Down Payment</label>
              <input
                :id="\`dp-\${index}\`"
                class="fp-in"
                type="number"
                v-model.number="option.downPayment"
                min="0"
                step="0.01"
                placeholder="0.00"
                @blur="clampDownPayment(index)"
              />
            </div>
            <div class="fp-sec">
              <label :for="\`months-\${index}\`" class="fp-lbl">Months</label>
              <input
                :id="\`months-\${index}\`"
                class="fp-in"
                type="number"
                v-model.number="option.months"
                min="1"
                max="60"
                step="1"
                placeholder="12"
                @blur="clampMonths(index)"
              />
            </div>
          </div>
          <div v-if="option.monthlyAmortization !== null" class="fp-computed">
            Monthly: {{ formatCurrency(option.monthlyAmortization) }}
          </div>
        </div>
      </div>`;

const newTermSection = `      <!-- Downpayment -->
      <div class="fp-sec">
        <label class="fp-lbl" for="downpayment">Downpayment (PHP)</label>
        <input
          id="downpayment"
          class="fp-in"
          type="number"
          v-model.number="quoteState.downPayment"
          placeholder="0"
          min="0"
          step="0.01"
        />
      </div>

      <!-- Terms (Months) -->
      <div class="fp-sec">
        <label class="fp-lbl" for="inst-months">Terms (No. of Months)</label>
        <input
          id="inst-months"
          class="fp-in"
          type="number"
          v-model.number="quoteState.months"
          placeholder="12"
          min="1"
          max="60"
        />
      </div>

      <!-- Additional Term Options -->
      <div class="fp-sec" style="margin-top: 8px">
        <label class="fp-lbl">Additional Term Options (optional)</label>
        <div
          v-for="(option, index) in quoteState.termOptions"
          :key="index"
          class="to-row"
        >
          <div class="to-hd">
            <span class="to-title">Additional Option</span>
            <button
              type="button"
              class="to-del"
              @click="removeTermOption(index)"
              :aria-label="\`Remove term option \${index + 1}\`"
            >
              &times;
            </button>
          </div>
          <div class="fp-sec">
            <label :for="\`deal-type-\${index}\`" class="fp-lbl">Deal Type</label>
            <select :id="\`deal-type-\${index}\`" class="fp-in" v-model="option.dealType">
              <option value="Installment">Installment</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div class="fp-sec">
            <label :for="\`to-price-\${index}\`" class="fp-lbl">Contract Price</label>
            <input
              :id="\`to-price-\${index}\`"
              class="fp-in"
              type="number"
              v-model.number="option.contractPrice"
              placeholder="Defaults to main price"
              min="0"
              step="0.01"
            />
          </div>
          <div class="fp-row">
            <div class="fp-sec">
              <label :for="\`to-dp-\${index}\`" class="fp-lbl">Downpayment</label>
              <input
                :id="\`to-dp-\${index}\`"
                class="fp-in"
                type="number"
                v-model.number="option.downPayment"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div class="fp-sec">
              <label :for="\`to-months-\${index}\`" class="fp-lbl">Months</label>
              <input
                :id="\`to-months-\${index}\`"
                class="fp-in"
                type="number"
                v-model.number="option.months"
                min="1"
                max="60"
                step="1"
                placeholder="12"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          class="fp-add-btn"
          @click="addTermOption"
        >
          + Add Term Option
        </button>
      </div>`;

form = form.replace(oldTermSection, newTermSection);
fs.writeFileSync(formFile, form);
console.log('Updated QuoteFormPanel pricing section');
