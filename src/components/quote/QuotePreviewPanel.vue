<script setup lang="ts">
import { inject, computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { formatQuoteDate, getDisplayedInclusions, getDisplayedExclusions } from '@/utils/quote-calculations'
import { supabase } from '@/services/supabase'
import { useProductInfoStore } from '@/stores/productInfo'
import letterheadEspmi from '@/assets/letterhead-espmi-1.jpg'
import letterheadAcs from '@/assets/letterhead-acs-1.jpg'

const quoteState = inject(QUOTE_BUILDER_KEY)!
const productInfoStore = useProductInfoStore()

// --- Responsive scaling ---
const paperRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const scale = ref(1)

function updateScale() {
  if (!containerRef.value) return
  const containerWidth = containerRef.value.clientWidth
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
  return quoteState.selectedModel
})

/**
 * Maps unit condition to display label and CSS modifier class.
 */
const conditionBadge = computed<{ label: string; modifier: string } | null>(() => {
  switch (quoteState.unitCondition) {
    case 'Brand New':
      return { label: 'BRAND NEW', modifier: 'new' }
    case 'Re-certified':
      return { label: 'RE-CERTIFIED', modifier: 'used' }
    case 'Demo Unit':
      return { label: 'DEMO UNIT', modifier: 'used' }
    default:
      return null
  }
})

// --- Machine image ---
const imageLoadError = ref(false)

const machineImageUrl = computed<string | null>(() => {
  // First check imageKey (from machine catalog)
  if (quoteState.imageKey) {
    const { data } = supabase.storage
      .from('machine-images')
      .getPublicUrl(quoteState.imageKey)
    return data.publicUrl
  }
  // Fallback: check product_info_links for a "picture" type link
  if (quoteState.machineId) {
    const pictureLink = productInfoStore.productLinks.find(
      (l) => l.machine_id === quoteState.machineId && l.document_type === 'picture'
    )
    if (pictureLink) return pictureLink.url
  }
  return null
})

const showMachineImage = computed(() => {
  return !!machineImageUrl.value && !imageLoadError.value
})

function onImageError() {
  imageLoadError.value = true
}

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

const showSalutation = computed(() => quoteState.salutation.trim().length > 0)
const showOpeningLine = computed(() => quoteState.openingLine.trim().length > 0)

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



  return items
})

const exclusionsList = computed(() => {
  let items = getDisplayedExclusions(quoteState).map((item) => item.description)
  if (quoteState.vatInclusive) {
    items = items.filter((desc) => !desc.toLowerCase().includes('value added tax'))
  }
  return items
})

const addonDisplayItems = computed(() => {
  if (!quoteState.vatInclusive) return quoteState.addonItems
  return quoteState.addonItems.map((item) => ({
    ...item,
    description: item.description.replace(
      /([P₱])\s?([\d,]+(?:\.\d{1,2})?)/g,
      (_match: string, sym: string, num: string) => {
        const val = parseFloat(num.replace(/,/g, '')) * 1.12
        return sym + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
    ),
  }))
})

const consumableDisplayList = computed(() => {
  return quoteState.consumables.map((c) => {
    const customEntry = quoteState.consumablePrices.find(
      (cp) => cp.consumableId === c.id
    )
    let price = customEntry ? customEntry.customPrice : c.default_price
    if (quoteState.vatInclusive) price = price * 1.12
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

// Pricing table rows: primary row + additional term options
const pricingRows = computed(() => {
  const cp = quoteState.contractPrice || 0
  const isCash = quoteState.dealType?.toLowerCase().includes('cash') ?? true
  const rows: { downPayment: number; balance: number | null; paymentTerms: string; monthly: number | null }[] = []

  // Primary row
  const dp = quoteState.downPayment || 0
  const months = quoteState.months || 12
  const balance = cp - dp - tradeInSum.value
  const paymentTerms = isCash ? 'CASH' : months + ' months'
  const monthly = isCash ? null : (balance > 0 && months > 0 ? balance / months : null)
  rows.push({ downPayment: dp, balance, paymentTerms, monthly })

  // Additional term options
  quoteState.termOptions.forEach((term) => {
    const tCp = term.contractPrice || cp
    const tDp = term.downPayment || 0
    const tMonths = term.months || 12
    const tIsCash = (term.dealType || '').toLowerCase().includes('cash')
    const tBalance = tCp - tDp - tradeInSum.value
    const tPaymentTerms = tIsCash ? 'CASH' : tMonths + ' months'
    const tMonthly = tIsCash ? null : (tBalance > 0 && tMonths > 0 ? tBalance / tMonths : null)
    rows.push({ downPayment: tDp, balance: tBalance, paymentTerms: tPaymentTerms, monthly: tMonthly })
  })

  return rows
})

const showCollection = computed(() => {
  return !!(
    quoteState.availability ||
    quoteState.collectionPayment ||
    quoteState.collectionDownpayment ||
    quoteState.collectionAmortization
  )
})

// Warranty section
const showWarranty = computed(() => quoteState.warrantyCompany.trim().length > 0)

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
  <div class="preview-panel">
    <div ref="containerRef" class="preview-panel__container">
      <div
        id="quote-paper"
        ref="paperRef"
        :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }"
      >
        <!-- Letterhead -->
        <div class="q-lh">
          <img :src="letterheadImage" :alt="quoteState.letterhead + ' letterhead'" class="q-lh-img" />
          <div class="q-lh-meta">
            <span v-if="formattedDate">Date: {{ formattedDate }}</span>
          </div>
        </div>

        <!-- Body -->
        <div class="q-body">

          <!-- Client block -->
          <div v-if="hasClient" style="margin-bottom:3mm">
            <p v-if="quoteState.clientName" class="q-cname">{{ quoteState.clientName }}</p>
            <p v-if="quoteState.company" class="q-cdetail">{{ quoteState.company }}</p>
            <p v-if="quoteState.address" class="q-cdetail">{{ quoteState.address }}</p>
            <p v-if="quoteState.contact" class="q-cdetail">{{ quoteState.contact }}</p>
            <p v-if="quoteState.email" class="q-cdetail">{{ quoteState.email }}</p>
          </div>

          <!-- Salutation -->
          <p v-if="showSalutation" class="q-sal">{{ quoteState.salutation }}</p>

          <!-- Opening line -->
          <p v-if="showOpeningLine" class="q-intro">{{ quoteState.openingLine }}</p>

          <!-- Machine title + condition badge -->
          <div class="q-mtitle">
            {{ machineTitle }}
            <span
              v-if="conditionBadge"
              class="q-mcond"
              :class="`q-mcond-${conditionBadge.modifier}`"
            >{{ conditionBadge.label }}</span>
          </div>

          <!-- Hero: image + features -->
          <div class="q-hero">
            <div class="q-hero-img">
              <img
                v-if="showMachineImage"
                :src="machineImageUrl!"
                :alt="machineTitle"
                @error="onImageError"
              />
              <div v-else-if="machineImageUrl && imageLoadError" class="q-img-placeholder">
                Image unavailable
              </div>
            </div>
            <div v-if="quoteState.features.length > 0" class="q-feat">
              <div class="q-feat-hdr">Product Specifications:</div>
              <ul>
                <li v-for="feature in quoteState.features" :key="feature.id">
                  {{ feature.description }}
                </li>
              </ul>
            </div>
          </div>

          <!-- PRICING -->
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
                  <td>{{ formatCurrency(row.downPayment) }}</td>
                  <td>{{ formatCurrency(row.balance) }}</td>
                  <td>{{ row.paymentTerms }}</td>
                  <td>{{ row.monthly !== null ? formatCurrency(row.monthly) : '—' }}</td>
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
                {{ formatCurrency(quoteState.contractPrice) }} — {{ quoteState.collectionPayment }}
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
                <span style="color:#c0392b;margin-right:5px">★</span> {{ freebie }}
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
                <span style="flex-shrink:0;font-size:9pt">{{ addon.enabled ? '☑' : '☐' }}</span>
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

                    <!-- Closing + Signatories -->
          <div class="q-sig no-break">
            <p class="q-closing">
              Trusting that the above quotation will receive your favorable consideration and assuring you of our best service at all times. Thank you very much.
            </p>

            <div class="q-sig-labels-row">
              <span>Very truly yours,</span>
              <span>Conforme:</span>
            </div>

            <div class="q-sig-grid">
              <div class="q-sig-cell">
                <div class="q-sig-line"></div>
                <div class="q-sig-name">{{ quoteState.aeName || '' }}</div>
                <div class="q-sig-role">Account Executive</div>
                <div class="q-sig-sub">Signature over Printed Name</div>
              </div>
              <div class="q-sig-cell">
                <div class="q-sig-line"></div>
                <div class="q-sig-name">{{ quoteState.clientConforme || '' }}</div>
                <div class="q-sig-role">Client</div>
                <div class="q-sig-sub">Signature over Printed Name</div>
              </div>
            </div>

            <div v-if="quoteState.notedByName || quoteState.notedByRole" class="q-noted">
              <div class="q-noted-label">Noted By:</div>
              <div class="q-noted-line"></div>
              <div class="q-noted-name">{{ quoteState.notedByName || '' }}</div>
              <div v-if="quoteState.notedByRole" class="q-noted-role">{{ quoteState.notedByRole }}</div>
            </div>
          </div>

        </div><!-- end q-body -->

        <!-- Footer -->
        <footer class="q-footer">
          <p>&copy; {{ quoteState.letterhead }}</p>
        </footer>

      </div><!-- end #quote-paper -->

      <!-- Spacer to account for scaled height -->
      <div
        class="preview-panel__spacer"
        :style="{ height: scale < 1 ? `${(1122 * scale) - 1122}px` : '0px' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Outer shell ─── */
.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  background: #e5e7eb;
  padding: 16px;
}

.preview-panel__container {
  width: 100%;
  max-width: 210mm;
  position: relative;
}

.preview-panel__spacer {
  pointer-events: none;
}

/* ─── A4 paper ─── */
#quote-paper {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  box-shadow: 0 4px 24px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.08);
  border-radius: 2px;
  padding: 0 0 6mm;
}

/* ─── Letterhead ─── */
.q-lh {
  border-bottom: 3px solid #c0392b;
  margin-bottom: 3mm;
}

.q-lh-img {
  width: 100%;
  display: block;
}

.q-lh-meta {
  padding: 2px 14mm 4px;
  display: flex;
  justify-content: flex-end;
  font-size: 7.5pt;
  color: #555;
}

/* ─── Body ─── */
.q-body {
  padding: 0 14mm;
}

/* ─── Client info ─── */
.q-cname {
  margin: 0;
  font-size: 10.5pt;
  font-weight: 700;
  color: #111;
}

.q-cdetail {
  margin: 0;
  font-size: 8.5pt;
  color: #555;
  line-height: 1.45;
}

/* ─── Salutation / intro ─── */
.q-sal {
  margin: 3mm 0 1mm;
  font-size: 8.5pt;
  color: #333;
}

.q-intro {
  margin: 0 0 3mm;
  font-size: 8.5pt;
  color: #555;
  line-height: 1.55;
}

/* ─── Machine title ─── */
.q-mtitle {
  font-size: 11pt;
  font-weight: 700;
  color: #c0392b;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 2mm;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1.5mm;
}

.q-mcond {
  display: block;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 1mm;
}

.q-mcond-new { color: #27ae60; }
.q-mcond-used { color: #c0392b; }

/* ─── Hero ─── */
.q-hero {
  display: flex;
  gap: 5mm;
  align-items: flex-start;
  margin-bottom: 2mm;
}

.q-hero-img {
  width: 70mm;
  flex-shrink: 0;
  text-align: center;
}

.q-hero-img img {
  max-width: 70mm;
  max-height: 62mm;
  object-fit: contain;
}

.q-img-placeholder {
  width: 70mm;
  height: 45mm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px dashed #ccc;
  border-radius: 2px;
  font-size: 7.5pt;
  color: #aaa;
  font-style: italic;
}

.q-feat-hdr {
  font-size: 8pt;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
  margin-bottom: 1mm;
}

.q-feat ul {
  padding-left: 14px;
  margin: 0;
}

.q-feat ul li {
  font-size: 8pt;
  color: #444;
  line-height: 1.55;
}

/* ─── Section header ─── */
.q-shdr {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #c0392b;
  border-bottom: 1px solid #c0392b;
  padding-bottom: 1mm;
  margin-bottom: 1.5mm;
  letter-spacing: .4px;
  margin-top: 2mm;
}

/* ─── Pricing / trade-in table ─── */
.q-ptbl {
  width: 100%;
  border-collapse: collapse;
}

.q-ptbl th {
  background: #c0392b;
  color: #fff;
  padding: 4px 8px;
  font-size: 7.5pt;
  font-weight: 600;
  text-align: left;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.q-ptbl td {
  padding: 3px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 8pt;
  color: #333;
}

.q-ptbl .note-row td {
  font-size: 7pt;
  color: #aaa;
  font-style: italic;
  border-bottom: none;
}

/* ─── Collection arrangements ─── */
.q-avail {
  font-size: 8pt;
  color: #333;
  padding: 3px 8px;
  background: #f9f9f9;
  border-left: 3px solid #c0392b;
  margin-top: 2mm;
  margin-bottom: 2mm;
  line-height: 1.6;
}

/* ─── Two-column inclusions/exclusions ─── */
.q-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm;
  margin-bottom: 2mm;
  margin-top: 2mm;
}

.q-col-hdr {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  background: #c0392b;
  padding: 3px 8px;
  border-radius: 2px 2px 0 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.q-col-body {
  border: 1px solid #eee;
  border-top: none;
  padding: 3px 8px;
  min-height: 12mm;
}

.q-col-body ul {
  padding-left: 14px;
  margin: 0;
}

.q-col-body ul li {
  font-size: 7.5pt;
  color: #333;
  line-height: 1.55;
}

/* ─── Consumables grid ─── */
.q-cons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 3mm;
  margin-bottom: 2mm;
}

.q-cons-item {
  display: flex;
  justify-content: space-between;
  padding: 1px 3px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 7.5pt;
}

.ci-name { color: #333; flex: 1; }
.ci-pkg { color: #999; font-size: 7pt; margin: 0 3px; }
.ci-price { color: #c0392b; font-weight: 600; }

/* ─── Signatories ─── */
.q-sig {
  margin-top: auto;
  padding-top: 4mm;
  border-top: 2px solid #e5e7eb;
}

.q-closing {
  font-size: 8.5pt;
  color: #555;
  line-height: 1.6;
  margin: 0 0 5mm;
}

.q-sig-labels-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6mm;
  font-size: 8.5pt;
  color: #555;
  font-style: italic;
}

.q-sig-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4mm;
  text-align: center;
}

.q-sig-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.q-sig-name {
  font-size: 8pt;
  color: #111;
  font-style: italic;
  min-height: 14px;
  margin-bottom: 1mm;
}

.q-sig-line {
  width: 90%;
  height: 0;
  border-bottom: 1px solid #333 !important;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.q-sig-role {
  font-size: 7.5pt;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.q-sig-sub {
  font-size: 7pt;
  color: #aaa;
  margin-top: 1mm;
  font-style: italic;
}

.q-noted-line {
  width: 50%;
  height: 0;
  border-bottom: 1px solid #333 !important;
  margin-top: 8mm;
  margin-bottom: 1mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}


.q-noted {
  margin-top: 6mm;
  padding-top: 2mm;
}

.q-noted-label {
  font-size: 8pt;
  color: #555;
  margin-bottom: 1mm;
}

.q-noted-name {
  font-size: 9pt;
  font-weight: 700;
  color: #111;
  border-bottom: 1px solid #555;
  padding-bottom: 1mm;
  display: inline-block;
  min-width: 60mm;
}

.q-noted-role {
  font-size: 7.5pt;
  color: #555;
  font-style: italic;
  margin-top: 1mm;
}

/* ─── Footer ─── */
.q-footer {
  margin-top: 4mm;
  padding: 3mm 14mm 0;
  border-top: 1px solid #e5e7eb;
}

.q-footer p {
  margin: 0;
  font-size: 7pt;
  color: #aaa;
  text-align: center;
}

/* ─── Print overrides ─── */
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

  #quote-paper {
    width: 210mm !important;
    min-height: 297mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    transform: none !important;
    margin: 0 !important;
  }

  .q-col-hdr,
  .q-ptbl th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
.q-availability {
  font-size: 8pt;
  padding: 2mm 3mm;
  border-left: 3px solid #c0392b;
  background: #f9f9f9;
  margin: 2mm 0;
  color: #333;

  .q-shdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-bottom: 2px solid #c0392b !important;
    color: #c0392b !important;
  }

  .q-sig-line,
  .q-noted-line {
    border-bottom: 1px solid #333 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .q-col-hdr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: #c0392b !important;
    color: #fff !important;
  }

  .q-ptbl thead tr {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: #c0392b !important;
  }

  .q-ptbl th {
    color: #fff !important;
  }

  .q-availability {
    border-left: 3px solid #c0392b !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
