const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\QuotePreviewPanel.vue';
let content = fs.readFileSync(file, 'utf-8');

// Find the section from "<!-- PRICING -->" to "<!-- Closing + Signatories -->"
const pricingStart = content.indexOf('          <!-- PRICING -->');
const closingStart = content.indexOf('          <!-- Closing + Signatories -->');

if (pricingStart === -1 || closingStart === -1) {
  console.log('Cannot find markers. pricingStart:', pricingStart, 'closingStart:', closingStart);
  process.exit(1);
}

const before = content.substring(0, pricingStart);
const after = content.substring(closingStart);

const newPreview = `          <!-- PRICING -->
          <template v-if="showPricing">
            <div class="q-shdr">Pricing</div>
            <table class="q-ptbl" style="width:100%;border-collapse:collapse;margin-bottom:1mm">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Contract Price</th>
                  <th>Down Payment</th>
                  <th>Balance</th>
                  <th>Payment Terms</th>
                  <th>Monthly Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in pricingRows" :key="idx">
                  <td>{{ machineTitle }}</td>
                  <td>{{ formatCurrency(quoteState.contractPrice) }}</td>
                  <td>{{ formatCurrency(row.term.downPayment) }}</td>
                  <td>{{ formatCurrency(row.balance) }}</td>
                  <td>{{ row.paymentTerms }}</td>
                  <td>{{ row.monthly !== null ? formatCurrency(row.monthly) : '\u2014' }}</td>
                </tr>
                <tr class="note-row">
                  <td colspan="6">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span v-if="quoteState.vatInclusive" style="font-weight:700;color:#c0392b;letter-spacing:.5px">VAT INCLUSIVE</span>
                      <span v-else></span>
                      <span style="font-style:italic;font-size:7pt;color:#888">in Philippine Pesos. Prices may change without prior notice.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="quoteState.underPromo && quoteState.promoValidity" style="text-align:right;font-size:8.5pt;font-weight:700;color:#c0392b;margin:0 0 2mm">
              Promo Validity: {{ quoteState.promoValidity }}
            </p>
          </template>

          <!-- Trade-ins -->
          <template v-if="showTradeIns">
            <div class="q-shdr">Trade-In Units</div>
            <table class="q-ptbl" style="width:100%;border-collapse:collapse;margin-bottom:2mm">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ti, idx) in quoteState.tradeIns" :key="idx">
                  <td>{{ ti.description || '(No description)' }}</td>
                  <td style="text-align:right">{{ formatCurrency(ti.value) }}</td>
                </tr>
                <tr>
                  <td style="font-weight:700;border-top:2px solid #ddd">Total Trade-In</td>
                  <td style="font-weight:700;border-top:2px solid #ddd;text-align:right">{{ formatCurrency(tradeInSum) }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <!-- COLLECTION ARRANGEMENTS -->
          <template v-if="showCollection">
            <div class="q-shdr">Collection Arrangements</div>
            <div class="q-avail">
              <p v-if="quoteState.collectionPayment" style="margin:0 0 1mm;font-size:8pt">
                <span style="display:inline-block;width:80px">Payment:</span>
                {{ formatCurrency(quoteState.contractPrice) }} \u2014 {{ quoteState.collectionPayment }}
              </p>
              <p v-if="quoteState.collectionDownpayment" style="margin:0 0 1mm;font-size:8pt">
                <span style="display:inline-block;width:80px">Down Payment:</span>
                {{ quoteState.collectionDownpayment }}
              </p>
              <p v-if="quoteState.collectionAmortization" style="margin:0;font-size:8pt">
                <span style="display:inline-block;width:80px">Amortization:</span>
                {{ quoteState.collectionAmortization }}
              </p>
            </div>
          </template>

          <!-- FREEBIES -->
          <template v-if="quoteState.underPromo && quoteState.freebies.length > 0">
            <div class="q-shdr">Freebies</div>
            <ul style="list-style:none;padding-left:0;margin:0 0 2mm">
              <li v-for="(freebie, idx) in quoteState.freebies" :key="idx" style="font-size:8pt;color:#444;line-height:1.8">
                <span style="color:#c0392b;margin-right:5px">\u2605</span> {{ freebie }}
              </li>
            </ul>
          </template>

          <!-- PACKAGE INCLUSIONS / EXCLUSIONS -->
          <template v-if="inclusionsList.length > 0 || exclusionsList.length > 0">
            <div class="q-shdr">Package Inclusions / Exclusions</div>
            <div class="q-two">
              <div v-if="inclusionsList.length > 0">
                <div class="q-col-hdr">Package Inclusions</div>
                <div class="q-col-body">
                  <ul>
                    <li v-for="(item, idx) in inclusionsList" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </div>
              <div v-if="exclusionsList.length > 0">
                <div class="q-col-hdr" style="background:#c0392b">Exclusive</div>
                <div class="q-col-body">
                  <ul>
                    <li v-for="(item, idx) in exclusionsList" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </template>

          <!-- OPTIONAL ADD-ONS -->
          <template v-if="addonDisplayItems.length > 0">
            <div class="q-shdr">Optional Add-Ons</div>
            <ul style="list-style:none;padding-left:0;margin:0 0 2mm">
              <li
                v-for="(addon, idx) in addonDisplayItems"
                :key="addon.id ?? idx"
                style="display:flex;align-items:baseline;gap:5px;font-size:8pt;color:#444;line-height:1.6"
              >
                <span style="flex-shrink:0;font-size:9pt">{{ addon.enabled ? '\u2611' : '\u2610' }}</span>
                {{ addon.description }}
              </li>
            </ul>
          </template>

          <!-- CONSUMABLES -->
          <template v-if="consumableDisplayList.length > 0">
            <div class="q-shdr">Consumables</div>
            <div class="q-cons-grid">
              <div
                v-for="(item, idx) in consumableDisplayList"
                :key="idx"
                class="q-cons-item"
              >
                <span class="ci-name">{{ item.name }}</span>
                <span class="ci-pkg">{{ item.package }}</span>
                <span class="ci-price">{{ formatCurrency(item.price) }}</span>
              </div>
            </div>
          </template>

          <!-- AVAILABILITY -->
          <div v-if="quoteState.availability" class="q-availability">
            <strong>AVAILABILITY:</strong> {{ quoteState.availability }}
          </div>

          <!-- WARRANTY -->
          <template v-if="showWarranty">
            <div class="q-shdr">Warranty</div>
            <ul style="list-style:disc;padding-left:14px;margin:0 0 2mm">
              <li
                v-for="(line, idx) in warrantyLines"
                :key="idx"
                style="font-size:8pt;line-height:1.65"
                :style="line.bold ? { color: '#c0392b', fontWeight: '700' } : { color: '#555' }"
              >
                {{ line.text }}
              </li>
            </ul>
          </template>

          `;

content = before + newPreview + after;
fs.writeFileSync(file, content);
console.log('Preview panel rewritten to match reference order');
