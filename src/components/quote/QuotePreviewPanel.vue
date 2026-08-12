<script setup lang="ts">
import { inject, computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { formatQuoteDate, getDisplayedInclusions, getDisplayedExclusions } from '@/utils/quote-calculations'
import { supabase } from '@/services/supabase'
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

/**
 * Maps unit condition to display label and CSS modifier class.
 * Returns null when no condition is set.
 */
const conditionBadge = computed<{ label: string; modifier: string } | null>(() => {
  switch (quoteState.unitCondition) {
    case 'Brand New':
      return { label: 'BRAND NEW', modifier: 'brand-new' }
    case 'Re-certified':
      return { label: 'RE-CERTIFIED', modifier: 're-certified' }
    case 'Demo Unit':
      return { label: 'DEMO UNIT', modifier: 'demo-unit' }
    default:
      return null
  }
})

// --- Machine image ---
const imageLoadError = ref(false)

const machineImageUrl = computed<string | null>(() => {
  if (!quoteState.imageKey) return null
  const { data } = supabase.storage
    .from('machine-images')
    .getPublicUrl(quoteState.imageKey)
  return data.publicUrl
})

const showMachineImage = computed(() => {
  return !!machineImageUrl.value && !imageLoadError.value
})

function onImageError() {
  imageLoadError.value = true
}

// Reset error state when the image key changes (new machine selected)
watch(
  () => quoteState.imageKey,
  () => { imageLoadError.value = false }
)

const formattedDate = computed(() => {
  return quoteState.quoteDate ? formatQuoteDate(quoteState.quoteDate) : ''
})

const hasClient = computed(() => {
  return !!(quoteState.clientName || quoteState.company || quoteState.address || quoteState.contact || quoteState.email)
})

const showSalutation = computed(() => {
  return quoteState.salutation.trim().length > 0
})

const showOpeningLine = computed(() => {
  return quoteState.openingLine.trim().length > 0
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
  const items = getDisplayedInclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items.push('VAT Inclusive')
  }
  return items
})

const exclusionsList = computed(() => {
  return getDisplayedExclusions(quoteState).map((item) => item.description)
})

/**
 * All add-on items for preview rendering.
 * Each item includes its enabled state so the template can render ☑ / ☐ markers.
 * Requirements 11.2, 11.3, 11.4
 */
const addonDisplayItems = computed(() => {
  return quoteState.addonItems
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

// Warranty section (Req 12.3, 12.4)
const showWarranty = computed(() => {
  return quoteState.warrantyCompany.trim().length > 0
})

const warrantyLines = computed(() => {
  const lines: { text: string; bold: boolean }[] = []

  if (quoteState.warrantyMachineDuration.trim()) {
    lines.push({
      text: `${quoteState.warrantyMachineDuration} limited warranty on main unit excluding software-related concerns. Terms and conditions apply.`,
      bold: false,
    })
  }

  if (quoteState.warrantyPrintheadDuration.trim()) {
    lines.push({
      text: `${quoteState.warrantyPrintheadDuration} limited warranty on print heads / laser tube.`,
      bold: false,
    })
    lines.push({
      text: 'Use of parts and inks other than those supplied by the manufacturer will void the warranty.',
      bold: true,
    })
  }

  lines.push({ text: 'No warranty for package inclusions.', bold: false })

  lines.push({
    text: `The unit is exclusive to ${quoteState.warrantyCompany} and its authorized dealers. It is an essential consideration of this Agreement that all matters pertaining to the supply shall be held in the strictest confidence.`,
    bold: false,
  })

  lines.push({
    text: `Any repairs or modifications made to this unit without the consent of ${quoteState.warrantySupplier || 'ESPMI'} will void the warranty.`,
    bold: true,
  })

  return lines
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
            <p v-if="formattedDate" class="quote-paper__quote-date">Date: {{ formattedDate }}</p>
          </div>

          <!-- Machine name, condition badge, and hero layout (image + features) -->
          <section class="quote-paper__machine">
            <p class="quote-paper__machine-name">{{ machineTitle }}</p>

            <!-- Unit condition badge (Req 17) -->
            <div
              v-if="conditionBadge"
              class="quote-paper__condition-badge"
              :class="`quote-paper__condition-badge--${conditionBadge.modifier}`"
            >
              {{ conditionBadge.label }}
            </div>

            <!-- Hero layout: image left + features right (Req 14) -->
            <div
              class="quote-paper__hero"
              :class="{ 'quote-paper__hero--with-image': showMachineImage }"
            >
              <!-- Machine image column -->
              <div v-if="showMachineImage || (machineImageUrl && imageLoadError)" class="quote-paper__hero-image-col">
                <img
                  v-if="!imageLoadError"
                  :src="machineImageUrl!"
                  :alt="machineTitle"
                  class="quote-paper__machine-image"
                  @error="onImageError"
                />
                <div v-else class="quote-paper__image-placeholder">
                  <span>Image unavailable</span>
                </div>
              </div>

              <!-- Features column -->
              <div
                v-if="quoteState.features.length > 0"
                class="quote-paper__hero-features-col"
              >
                <h3 class="quote-paper__section-header">Features</h3>
                <ul class="quote-paper__list">
                  <li v-for="feature in quoteState.features" :key="feature.id">
                    {{ feature.description }}
                  </li>
                </ul>
              </div>
            </div>
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
            <p v-if="quoteState.email" class="quote-paper__client-detail">
              {{ quoteState.email }}
            </p>
          </section>

          <!-- Salutation -->
          <p v-if="showSalutation" class="quote-paper__salutation">
            {{ quoteState.salutation }}
          </p>

          <!-- Opening line -->
          <p v-if="showOpeningLine" class="quote-paper__opening-line">
            {{ quoteState.openingLine }}
          </p>

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
          <section v-if="addonDisplayItems.length > 0" class="quote-paper__section">
            <h3 class="quote-paper__section-header">Optional Add-ons</h3>
            <ul class="quote-paper__list quote-paper__list--addons">
              <li v-for="(addon, idx) in addonDisplayItems" :key="addon.id ?? idx" class="quote-paper__addon-item">
                <span class="quote-paper__addon-marker">{{ addon.enabled ? '☑' : '☐' }}</span>
                {{ addon.description }}
              </li>
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

          <!-- Warranty Section (Req 12.3, 12.4) -->
          <section v-if="showWarranty" class="quote-paper__section quote-paper__warranty">
            <h3 class="quote-paper__section-header">Warranty</h3>
            <ul class="quote-paper__warranty-list">
              <li
                v-for="(line, idx) in warrantyLines"
                :key="idx"
                :class="{ 'quote-paper__warranty-bold': line.bold }"
              >
                {{ line.text }}
              </li>
            </ul>
          </section>

          <!-- Closing paragraph + Signatories (kept together, Req 15.1–15.5) -->
          <section class="quote-paper__signatories no-break">
            <!-- Closing paragraph (Req 15.1) -->
            <p class="quote-paper__closing-text">
              Trusting that the above quotation will receive your favorable consideration and assuring you of our best service at all times. Thank you very much.
            </p>

            <!-- "Very truly yours," / "Conforme:" labels (Req 15.2, 15.3) -->
            <div class="quote-paper__sig-labels-row">
              <div class="quote-paper__sig-label-left">Very truly yours,</div>
              <div class="quote-paper__sig-label-right">Conforme:</div>
            </div>

            <div class="quote-paper__sig-grid">
              <div class="quote-paper__sig-cell">
                <div class="quote-paper__sig-name">{{ quoteState.aeName || '' }}</div>
                <div class="quote-paper__sig-line"></div>
                <div class="quote-paper__sig-role">Account Executive</div>
                <!-- Req 15.4 -->
                <div class="quote-paper__sig-sub">Signature over Printed Name</div>
              </div>
              <div class="quote-paper__sig-cell">
                <div class="quote-paper__sig-name">{{ quoteState.clientConforme || '' }}</div>
                <div class="quote-paper__sig-line"></div>
                <div class="quote-paper__sig-role">Client</div>
                <!-- Req 15.4 -->
                <div class="quote-paper__sig-sub">Signature over Printed Name</div>
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

.quote-paper__quote-date {
  margin: 1mm 0 0;
  font-size: 8.5pt;
  color: var(--color-gray-600);
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

/* Unit condition badge (Req 17) */
.quote-paper__condition-badge {
  display: inline-block;
  margin-top: 2mm;
  padding: 2px 8px;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: 3px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.quote-paper__condition-badge--brand-new {
  color: #fff;
  background: #16a34a;
  border: 1px solid #15803d;
}

.quote-paper__condition-badge--re-certified {
  color: #fff;
  background: #dc2626;
  border: 1px solid #b91c1c;
}

.quote-paper__condition-badge--demo-unit {
  color: #fff;
  background: #d97706;
  border: 1px solid #b45309;
}

/* Hero layout: image + features (Req 14) */
.quote-paper__hero {
  margin-top: 3mm;
  display: flex;
  flex-direction: column;
}

.quote-paper__hero--with-image {
  flex-direction: row;
  align-items: flex-start;
  gap: 4mm;
}

.quote-paper__hero-image-col {
  flex: 0 0 70mm;
  width: 70mm;
}

.quote-paper__machine-image {
  width: 100%;
  height: auto;
  max-height: 55mm;
  object-fit: contain;
  border-radius: 2px;
  display: block;
}

.quote-paper__image-placeholder {
  width: 70mm;
  height: 45mm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border: 1px dashed var(--color-gray-300);
  border-radius: 2px;
  font-size: 7.5pt;
  color: var(--color-gray-400);
  font-style: italic;
}

.quote-paper__hero-features-col {
  flex: 1;
  min-width: 0;
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

/* ─── Salutation & Opening line ─── */
.quote-paper__salutation {
  margin: 3mm 0 1.5mm;
  font-size: 9pt;
  color: var(--color-gray-800);
}

.quote-paper__opening-line {
  margin: 0 0 3mm;
  font-size: 8.5pt;
  color: var(--color-gray-700);
  line-height: 1.55;
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

/* ─── Add-ons list with checkbox markers ─── */
.quote-paper__list--addons {
  list-style: none;
  padding-left: 0;
}

.quote-paper__addon-item {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 8pt;
  color: var(--color-gray-700);
  line-height: 1.6;
}

.quote-paper__addon-marker {
  flex-shrink: 0;
  font-size: 9pt;
  line-height: 1;
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

/* ─── Warranty section ─── */
.quote-paper__warranty {
  margin-bottom: 3mm;
}

.quote-paper__warranty-list {
  list-style: disc;
  padding-left: 14px;
  margin: 0;
}

.quote-paper__warranty-list li {
  font-size: 8pt;
  color: var(--color-gray-700);
  line-height: 1.65;
}

.quote-paper__warranty-bold {
  color: var(--color-danger, #c0392b) !important;
  font-weight: 700;
}

/* ─── Closing paragraph ─── */
.quote-paper__closing-text {
  font-size: 8.5pt;
  color: var(--color-gray-700);
  line-height: 1.6;
  margin: 0 0 5mm;
}

/* ─── "Very truly yours," / "Conforme:" row ─── */
.quote-paper__sig-labels-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6mm;
}

.quote-paper__sig-label-left,
.quote-paper__sig-label-right {
  font-size: 8.5pt;
  color: var(--color-gray-700);
  font-style: italic;
}

/* ─── Signature sub-label ("Signature over Printed Name") ─── */
.quote-paper__sig-sub {
  font-size: 7pt;
  color: var(--color-gray-500);
  margin-top: 1mm;
  font-style: italic;
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
