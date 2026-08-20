const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Use regex to find and replace the promo section
// The pattern: after "underPromo" div opens, swap Promo Validity block with Freebies block
const promoStart = content.indexOf('<!-- Promo section -->');
const promoEnd = content.indexOf('<!-- Collection Arrangements -->');

if (promoStart === -1 || promoEnd === -1) {
  console.log('Could not find markers');
  process.exit(1);
}

const before = content.substring(0, promoStart);
const after = content.substring(promoEnd);

const newPromo = `<!-- Promo section -->
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

content = before + newPromo + after;
fs.writeFileSync(file, content);
console.log('Promo section rewritten');
