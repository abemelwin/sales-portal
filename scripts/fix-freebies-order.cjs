const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuoteFormPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the promo section and reorder: Freebies label + list + add button FIRST, then Promo Validity
const oldPromo = `      <!-- Promo section -->
      <div v-if="quoteState.underPromo" style="margin-top: 6px">
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
        <div class="fp-row" style="margin-top: 4px">
          <input
            type="text"
            class="fp-in"
            v-model="freebieInput"
            placeholder="Add a freebie item"
            @keyup.enter="addFreebie"
          />
          <button type="button" class="fp-add-btn" @click="addFreebie">Add</button>
        </div>
      </div>`;

const newPromo = `      <!-- Promo section -->
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
      </div>`;

content = content.replace(oldPromo, newPromo);
fs.writeFileSync(file, content);
console.log('Freebies order fixed - now shows Freebies first, then Promo Validity');
