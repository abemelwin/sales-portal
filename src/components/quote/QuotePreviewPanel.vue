<script setup lang="ts">
import { inject, computed, ref, onMounted, onUnmounted } from 'vue'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import letterheadEspmi from '@/assets/letterhead-espmi.svg'
import letterheadAcs from '@/assets/letterhead-acs.svg'

const quoteState = inject(QUOTE_BUILDER_KEY)!

// --- Responsive scaling ---
const paperRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const scale = ref(1)

function updateScale() {
  if (!containerRef.value) return
  const containerWidth = containerRef.value.clientWidth
  // A4 width in px at 96dpi: 210mm ≈ 793.7px
  const a4WidthPx = 793.7
  if (containerWidth < a4WidthPx) {
    scale.value = containerWidth / a4WidthPx
  } else {
    scale.value = 1
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateScale()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// --- Computed display values ---

const letterheadImage = computed(() => {
  return quoteState.letterhead === 'ACS / Alternative' ? letterheadAcs : letterheadEspmi
})

const machineTitle = computed(() => {
  if (!quoteState.selectedBrand || !quoteState.selectedModel) {
    return 'No machine selected'
  }
  return `${quoteState.selectedBrand} ${quoteState.selectedModel}`
})

const showRecertifiedLabel = computed(() => {
  return quoteState.unitCondition === 'Re-certified'
})

const hasClient = computed(() => {
  return !!(quoteState.clientName || quoteState.company || quoteState.address || quoteState.contact)
})

const showTradeIns = computed(() => {
  return (
    (quoteState.dealType === 'Trade-In Cash' || quoteState.dealType === 'Trade-In Terms') &&
    quoteState.tradeIns.length > 0
  )
})

const tradeInSum = computed(() => {
  return quoteState.tradeIns.reduce((sum, ti) => sum + (ti.value || 0), 0)
})

const inclusionsList = computed(() => {
  const items = quoteState.inclusions.map((inc) => inc.description)
  if (quoteState.vatInclusive) {
    items.push('VAT Inclusive')
  }
  return items
})

const exclusionsList = computed(() => {
  return quoteState.exclusions.map((exc) => exc.description)
})

const addonsList = computed(() => {
  return quoteState.addons.map((addon) => addon.description)
})

const consumableDisplayList = computed(() => {
  return quoteState.consumables.map((c) => {
    const customEntry = quoteState.consumablePrices.find(
      (cp) => cp.consumableId === c.id
    )
    const price = customEntry ? customEntry.customPrice : c.default_price
    return {
      name: c.item_name,
      package: c.package_description || '',
      price,
    }
  })
})

const showPricing = computed(() => {
  return quoteState.contractPrice !== null && quoteState.contractPrice > 0
})

const showPromo = computed(() => {
  return quoteState.underPromo && (quoteState.freebies.length > 0 || quoteState.promoValidity)
})

const dealTypeLabel = computed(() => {
  return quoteState.dealType || ''
})

/**
 * Format number as Philippine peso currency string.
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return '₱' + value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
</script>

<template>
  <div class="preview-panel" id="preview-panel">
    <div ref="containerRef" class="preview-panel__container">
      <div
        ref="paperRef"
        class="a4-paper quote-paper"
        :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }"
      >
        <!-- Letterhead header with image -->
        <header class="quote-paper__header">
          <img
            :src="letterheadImage"
            :alt="quoteState.letterhead + ' letterhead'"
            class="quote-paper__letterhead-img"
          />
        </header>

        <!-- Quote body content -->
        <div class="quote-paper__body">
          <!-- QUOTATION title -->
          <div class="quote-paper__title-section">
            <h2 class="quote-paper__title">QUOTATION</h2>
            <p v-if="dealTypeLabel" class="quote-paper__deal-type">{{ dealTypeLabel }}</p>
          </div>

          <!-- Machine name + RE-CERTIFIED label -->
          <section class="quote-paper__machine">
            <p class="quote-paper__machine-name">
              {{ machineTitle }}
              <span v-if="showRecertifiedLabel" class="quote-paper__recertified">
                RE-CERTIFIED
              </span>
            </p>
          </section>

          <!-- Client information -->
          <section v-if="hasClient" class="quote-paper__client">
            <p v-if="quoteState.clientName" class="quote-paper__client-name">
              {{ quoteState.clientName }}
            </p>
            <p v-if="quoteState.company" class="quote-paper__client-detail">
              {{ quoteState.company }}
            </p>
            <p v-if="quoteState.address" class="quote-paper__client-detail">
              {{ quoteState.address }}
            </p>
            <p v-if="quoteState.contact" class="quote-paper__client-detail">
              {{ quoteState.contact }}
            </p>
          </section>

          <!-- Features list -->
          <section v-if="quoteState.features.length > 0" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Features</h3>
            <ul class="quote-paper__list">
              <li v-for="feature in quoteState.features" :key="feature.id">
                {{ feature.description }}
              </li>
            </ul>
          </section>

          <!-- Package Inclusions / Exclusions (two-column layout) -->
          <div
            v-if="inclusionsList.length > 0 || exclusionsList.length > 0"
            class="quote-paper__two-col"
          >
            <div v-if="inclusionsList.length > 0" class="quote-paper__col">
              <div class="quote-paper__col-header">Package Inclusions</div>
              <div class="quote-paper__col-body">
                <ul class="quote-paper__list">
                  <li v-for="(item, idx) in inclusionsList" :key="idx">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div v-if="exclusionsList.length > 0" class="quote-paper__col">
              <div class="quote-paper__col-header">Package Exclusions</div>
              <div class="quote-paper__col-body">
                <ul class="quote-paper__list">
                  <li v-for="(item, idx) in exclusionsList" :key="idx">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Optional Add-ons -->
          <section v-if="addonsList.length > 0" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Optional Add-ons</h3>
            <ul class="quote-paper__list">
              <li v-for="(addon, idx) in addonsList" :key="idx">{{ addon }}</li>
            </ul>
          </section>

          <!-- Consumable prices table -->
          <section v-if="consumableDisplayList.length > 0" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Consumable Prices</h3>
            <table class="quote-paper__price-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Package</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in consumableDisplayList" :key="idx">
                  <td>{{ item.name }}</td>
                  <td>{{ item.package }}</td>
                  <td>{{ formatCurrency(item.price) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Pricing section -->
          <section v-if="showPricing" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Pricing</h3>
            <table class="quote-paper__price-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Contract Price</td>
                  <td>{{ formatCurrency(quoteState.contractPrice) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Term options with monthly amortization -->
            <div class="quote-paper__terms">
              <h4 class="quote-paper__terms-title">Payment Term Options</h4>
              <table class="quote-paper__terms-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Down Payment</th>
                    <th>Months</th>
                    <th>Monthly Amortization</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(term, idx) in quoteState.termOptions" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ formatCurrency(term.downPayment) }}</td>
                    <td>{{ term.months }}</td>
                    <td>{{ formatCurrency(term.monthlyAmortization) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Trade-ins -->
          <section v-if="showTradeIns" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Trade-In Units</h3>
            <table class="quote-paper__price-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ti, idx) in quoteState.tradeIns" :key="idx">
                  <td>{{ ti.description || '(No description)' }}</td>
                  <td>{{ formatCurrency(ti.value) }}</td>
                </tr>
                <tr class="quote-paper__total-row">
                  <td>Total Trade-In</td>
                  <td>{{ formatCurrency(tradeInSum) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Promo / Freebies -->
          <section v-if="showPromo" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Promo Freebies</h3>
            <ul v-if="quoteState.freebies.length > 0" class="quote-paper__list">
              <li v-for="(freebie, idx) in quoteState.freebies" :key="idx">{{ freebie }}</li>
            </ul>
            <p v-if="quoteState.promoValidity" class="quote-paper__promo-validity">
              Promo valid until: <strong>{{ quoteState.promoValidity }}</strong>
            </p>
          </section>

          <!-- Availability and collection arrangements -->
          <section
            v-if="quoteState.availability || quoteState.collectionPayment || quoteState.collectionDownpayment || quoteState.collectionAmortization"
            class="quote-paper__section"
          >
            <h3 class="quote-paper__section-header">Availability &amp; Collection</h3>
            <div class="quote-paper__avail-block">
              <p v-if="quoteState.availability" class="quote-paper__avail-item">
                <strong>Availability:</strong> {{ quoteState.availability }}
              </p>
              <p v-if="quoteState.collectionPayment" class="quote-paper__avail-item">
                <strong>Collection (Payment):</strong> {{ quoteState.collectionPayment }}
              </p>
              <p v-if="quoteState.collectionDownpayment" class="quote-paper__avail-item">
                <strong>Collection (Down Payment):</strong> {{ quoteState.collectionDownpayment }}
              </p>
              <p v-if="quoteState.collectionAmortization" class="quote-paper__avail-item">
                <strong>Collection (Amortization):</strong> {{ quoteState.collectionAmortization }}
              </p>
            </div>
          </section>

          <!-- Signatories -->
          <section class="quote-paper__signatories no-break">
            <div class="quote-paper__sig-truly">Truly yours,</div>
            <div class="quote-paper__sig-grid">
              <div class="quote-paper__sig-cell">
                <div class="quote-paper__sig-name">{{ quoteState.aeName || '' }}</div>
                <div class="quote-paper__sig-line"></div>
                <div class="quote-paper__sig-role">Account Executive</div>
              </div>
              <div class="quote-paper__sig-cell">
                <div class="quote-paper__sig-name">{{ quoteState.clientConforme || '' }}</div>
                <div class="quote-paper__sig-line"></div>
                <div class="quote-paper__sig-role">Client Conforme</div>
              </div>
            </div>
            <div v-if="quoteState.notedByName || quoteState.notedByRole" class="quote-paper__sig-noted">
              <div class="quote-paper__sig-noted-label">Noted By:</div>
              <div class="quote-paper__sig-noted-name">{{ quoteState.notedByName || '' }}</div>
              <div v-if="quoteState.notedByRole" class="quote-paper__sig-noted-role">
                {{ quoteState.notedByRole }}
              </div>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <footer class="quote-paper__footer">
          <p class="quote-paper__footer-text">
            &copy; {{ quoteState.letterhead }}
          </p>
        </footer>
      </div>
      <!-- Spacer to account for scaled height in scrollable container -->
      <div
        class="preview-panel__spacer"
        :style="{ height: scale < 1 ? `${(1122 * scale) - 1122}px` : '0px' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  background: var(--color-gray-200);
  padding: var(--space-4);
}

.preview-panel__container {
  width: 100%;
  max-width: 210mm;
  position: relative;
}

.preview-panel__spacer {
  pointer-events: none;
}

/* A4 paper dimensions: 210mm x 297mm */
.a4-paper {
  width: 210mm;
  min-height: 297mm;
  background: var(--color-white);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  padding: 12mm 15mm;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ─── Letterhead ─── */
.quote-paper__header {
  margin-bottom: 6mm;
}

.quote-paper__letterhead-img {
  width: 100%;
  max-height: 22mm;
  object-fit: contain;
  object-position: left center;
  display: block;
}

/* ─── Title ─── */
.quote-paper__title-section {
  text-align: center;
  margin-bottom: 4mm;
}

.quote-paper__title {
  margin: 0;
  font-size: 16pt;
  font-weight: 700;
  color: var(--color-gray-800);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.quote-paper__deal-type {
  margin: 1mm 0 0;
  font-size: 9pt;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Machine info ─── */
.quote-paper__machine {
  text-align: center;
  margin-bottom: 4mm;
  padding-bottom: 2mm;
  border-bottom: 1px solid var(--color-gray-200);
}

.quote-paper__machine-name {
  margin: 0;
  font-size: 13pt;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.quote-paper__recertified {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 6px;
  font-size: 7pt;
  font-weight: 700;
  color: var(--color-warning);
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: 2px;
  text-transform: uppercase;
  vertical-align: middle;
}

/* ─── Body ─── */
.quote-paper__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ─── Client info ─── */
.quote-paper__client {
  margin-bottom: 4mm;
}

.quote-paper__client-name {
  margin: 0;
  font-size: 10.5pt;
  font-weight: 700;
  color: var(--color-gray-900);
}

.quote-paper__client-detail {
  margin: 0;
  font-size: 8.5pt;
  color: var(--color-gray-700);
  line-height: 1.45;
}

/* ─── Section headers ─── */
.quote-paper__section {
  margin-bottom: 3mm;
}

.quote-paper__section-header {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-primary);
  padding-bottom: 1mm;
  margin: 0 0 2mm;
  letter-spacing: 0.04em;
}

/* ─── Lists ─── */
.quote-paper__list {
  list-style: disc;
  padding-left: 14px;
  margin: 0;
}

.quote-paper__list li {
  font-size: 8pt;
  color: var(--color-gray-700);
  line-height: 1.6;
}

/* ─── Two-column layout (inclusions/exclusions) ─── */
.quote-paper__two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm;
  margin-bottom: 3mm;
}

.quote-paper__col-header {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-white);
  background: var(--color-primary);
  padding: 3px 8px;
  border-radius: 2px 2px 0 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.quote-paper__col-body {
  border: 1px solid var(--color-gray-200);
  border-top: none;
  padding: 3px 8px;
  border-radius: 0 0 2px 2px;
  min-height: 12mm;
}

.quote-paper__col-body .quote-paper__list li {
  font-size: 7.5pt;
  line-height: 1.55;
}

/* ─── Price tables ─── */
.quote-paper__price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin-bottom: 2mm;
}

.quote-paper__price-table thead th {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 4px 8px;
  text-align: left;
  font-size: 7.5pt;
  font-weight: 600;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.quote-paper__price-table thead th:last-child {
  text-align: right;
}

.quote-paper__price-table tbody td {
  padding: 3px 8px;
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: top;
}

.quote-paper__price-table tbody td:last-child {
  text-align: right;
  white-space: nowrap;
  font-weight: 600;
  color: var(--color-primary);
}

.quote-paper__total-row td {
  font-weight: 700;
  border-top: 2px solid var(--color-gray-300);
  border-bottom: none;
}

/* ─── Terms table ─── */
.quote-paper__terms {
  margin-top: 2mm;
}

.quote-paper__terms-title {
  font-size: 8pt;
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0 0 1mm;
}

.quote-paper__terms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
}

.quote-paper__terms-table thead th {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: 3px 8px;
  text-align: left;
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.quote-paper__terms-table tbody td {
  padding: 3px 8px;
  border-bottom: 1px solid var(--color-gray-100);
}

.quote-paper__terms-table tbody td:last-child {
  font-weight: 600;
  color: var(--color-primary);
}

/* ─── Promo section ─── */
.quote-paper__promo-validity {
  font-size: 8pt;
  color: var(--color-gray-700);
  margin: 2mm 0 0;
}

/* ─── Availability block ─── */
.quote-paper__avail-block {
  padding: 3px 8px;
  background: var(--color-gray-50);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.quote-paper__avail-item {
  font-size: 8pt;
  color: var(--color-gray-700);
  margin: 0 0 1mm;
  line-height: 1.5;
}

.quote-paper__avail-item:last-child {
  margin-bottom: 0;
}

/* ─── Signatories ─── */
.quote-paper__signatories {
  margin-top: auto;
  padding-top: 4mm;
  border-top: 2px solid var(--color-gray-200);
}

.quote-paper__sig-truly {
  font-size: 8.5pt;
  color: var(--color-gray-700);
  margin-bottom: 6mm;
  font-style: italic;
}

.quote-paper__sig-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4mm;
  text-align: center;
}

.quote-paper__sig-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quote-paper__sig-name {
  font-size: 8pt;
  color: var(--color-gray-900);
  font-style: italic;
  min-height: 14px;
  margin-bottom: 1mm;
}

.quote-paper__sig-line {
  width: 90%;
  border-top: 1px solid var(--color-gray-600);
  margin-bottom: 1.5mm;
}

.quote-paper__sig-role {
  font-size: 7.5pt;
  font-weight: 700;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.quote-paper__sig-noted {
  margin-top: 6mm;
  padding-top: 2mm;
}

.quote-paper__sig-noted-label {
  font-size: 8pt;
  color: var(--color-gray-700);
  margin-bottom: 1mm;
}

.quote-paper__sig-noted-name {
  font-size: 9pt;
  font-weight: 700;
  color: var(--color-gray-900);
  border-bottom: 1px solid var(--color-gray-600);
  padding-bottom: 1mm;
  display: inline-block;
  min-width: 60mm;
}

.quote-paper__sig-noted-role {
  font-size: 7.5pt;
  color: var(--color-gray-600);
  font-style: italic;
  margin-top: 1mm;
}

/* ─── Footer ─── */
.quote-paper__footer {
  margin-top: 4mm;
  padding-top: 3mm;
  border-top: 1px solid var(--color-gray-200);
}

.quote-paper__footer-text {
  margin: 0;
  font-size: 7pt;
  color: var(--color-gray-400);
  text-align: center;
}

/* ─── Print-specific overrides ─── */
@media print {
  .preview-panel {
    padding: 0;
    background: none;
    overflow: visible;
  }

  .preview-panel__container {
    max-width: none;
  }

  .preview-panel__spacer {
    display: none;
  }

  .a4-paper {
    width: 210mm !important;
    min-height: 297mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    transform: none !important;
    margin: 0 !important;
    padding: 12mm 15mm !important;
  }

  .quote-paper__col-header,
  .quote-paper__price-table thead th,
  .quote-paper__terms-table thead th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
