const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the section between "<!-- PRICING -->" and "<!-- Delivery -->"
// and replace it with the correct order

const pricingStart = content.indexOf('      <!-- PRICING -->');
const deliveryStart = content.indexOf('      <!-- Delivery -->');

if (pricingStart === -1 || deliveryStart === -1) {
  console.log('Cannot find markers');
  process.exit(1);
}

// Also need to find the <hr> before Delivery
const hrBeforeDelivery = content.lastIndexOf('<hr class="fp-hr" />', deliveryStart);

const before = content.substring(0, pricingStart);
const after = content.substring(hrBeforeDelivery);

// Build the new pricing through availability/promo section
const newSection = `      <!-- PRICING -->
      <h2 class="fp-section-title">Pricing</h2>
      <div v-if="isReCertified" class="recertified-badge">RE-CERTIFIED</div>
      <div class="fp-sec">
        <label class="fp-lbl" for="contract-price">Contract Price (PHP)</label>
        <input
          id="contract-price"
          class="fp-in"
          type="number"
          v-model.number="quoteState.contractPrice"
          placeholder="0"
          min="0"
          step="0.01"
        />
      </div>

      <!-- Trade-In fields -->
      <div v-if="showTradeIns">
        <div
          v-for="(tradeIn, index) in quoteState.tradeIns"
          :key="index"
          class="trade-in-row"
        >
          <div class="fp-row">
            <div class="fp-sec" style="flex: 0 0 44%">
              <label :for="\`ti-value-\${index}\`" class="fp-lbl">Trade-In Value {{ index + 1 }} (PHP)</label>
              <input
                :id="\`ti-value-\${index}\`"
                class="fp-in"
                type="number"
                v-model.number="tradeIn.value"
                placeholder="0"
                min="0"
                step="0.01"
                @blur="clampTradeInValue(index)"
              />
            </div>
            <div class="fp-sec">
              <label :for="\`ti-desc-\${index}\`" class="fp-lbl">Description {{ index + 1 }}</label>
              <input
                :id="\`ti-desc-\${index}\`"
                class="fp-in"
                type="text"
                v-model="tradeIn.description"
                placeholder="Brand, model, heads\u2026"
              />
            </div>
          </div>
          <button
            v-if="quoteState.tradeIns.length > 1"
            type="button"
            class="fp-remove-btn"
            @click="removeTradeIn(index)"
          >
            Remove Trade-In {{ index + 1 }}
          </button>
        </div>
        <button
          v-if="canAddTradeIn"
          type="button"
          class="fp-add-btn"
          @click="addTradeIn"
        >
          + Add Trade-In
        </button>
        <div v-if="tradeInSum > 0" class="fp-computed">
          Total Trade-In: {{ formatCurrency(tradeInSum) }}
        </div>
      </div>

      <!-- Downpayment -->
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
      </div>

      <!-- VAT Inclusive -->
      <div class="fp-ck" style="margin-top: 8px">
        <input type="checkbox" id="chk-vat-inc" v-model="quoteState.vatInclusive" />
        <label for="chk-vat-inc">VAT Inclusive (moves VAT to Package)</label>
      </div>

      <!-- Collection Arrangements -->
      <div class="fp-sec" style="margin-top: 8px">
        <label class="fp-lbl" for="collection-payment">Collection \u2014 Payment (cash)</label>
        <input id="collection-payment" class="fp-in" type="text" v-model="quoteState.collectionPayment" placeholder="Upon confirmation and before delivery" maxlength="200" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="collection-downpayment">Collection \u2014 Downpayment (terms)</label>
        <input id="collection-downpayment" class="fp-in" type="text" v-model="quoteState.collectionDownpayment" placeholder="Upon confirmation and before delivery" maxlength="200" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="collection-amortization">Collection \u2014 Amortization (terms)</label>
        <input id="collection-amortization" class="fp-in" type="text" v-model="quoteState.collectionAmortization" placeholder="After installation of machine" maxlength="200" />
      </div>

      <!-- Availability -->
      <div class="fp-sec">
        <label class="fp-lbl" for="availability">Availability</label>
        <input id="availability" class="fp-in" type="text" v-model="quoteState.availability" placeholder="ON STOCK" maxlength="200" />
      </div>

      <!-- UNDER PROMO -->
      <div class="fp-ck" style="margin-top: 6px">
        <input type="checkbox" id="chk-promo" v-model="quoteState.underPromo" />
        <label for="chk-promo">UNDER PROMO</label>
      </div>

      <!-- Promo section -->
      <div v-if="quoteState.underPromo" style="margin-top: 6px">
        <label class="fp-lbl">Freebies</label>
        <div v-if="quoteState.freebies.length > 0" style="margin-bottom: 4px">
          <div
            v-for="(freebie, index) in quoteState.freebies"
            :key="index"
            class="freebie-item"
          >
            <span>{{ freebie }}</span>
            <button
              type="button"
              class="fp-remove-btn fp-remove-btn--inline"
              @click="removeFreebie(index)"
              :aria-label="\`Remove freebie: \${freebie}\`"
            >&times;</button>
          </div>
        </div>
        <div class="fp-row" style="margin-top: 4px; margin-bottom: 8px">
          <input
            type="text"
            class="fp-in"
            v-model="freebieInput"
            placeholder="Add a freebie item"
            @keyup.enter="addFreebie"
          />
          <button type="button" class="fp-add-btn" @click="addFreebie">+ Add Freebie</button>
        </div>
        <div class="fp-sec">
          <label class="fp-lbl" for="promo-validity">Promo Validity</label>
          <input
            id="promo-validity"
            class="fp-in"
            type="text"
            v-model="quoteState.promoValidity"
            placeholder="e.g., Valid until Dec 31, 2025"
          />
        </div>
      </div>

      `;

content = before + newSection + after;
fs.writeFileSync(file, content);
console.log('Pricing section rewritten to match reference order');
