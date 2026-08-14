<script setup lang="ts">
import { inject, computed, watch, ref } from 'vue'
import MachineSelector from './MachineSelector.vue'
import ClosingDocsPrompt from './ClosingDocsPrompt.vue'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { computeAmortization, addCustomItem, removeCustomItem } from '@/utils/quote-calculations'
import { validateQuote } from '@/composables/useQuoteValidation'
import type { DealType, Letterhead } from '@/types'

const quoteState = inject(QUOTE_BUILDER_KEY)!

const letterheadOptions: Letterhead[] = [
  'ES Print Media Inc.',
  'ACS / Alternative',
]

const dealTypes: DealType[] = [
  'Standard Cash',
  'Standard Terms',
  'Trade-In Cash',
  'Trade-In Terms',
]

// Whether trade-in fields should be visible
const showTradeIns = computed(() => {
  return (
    quoteState.dealType === 'Trade-In Cash' ||
    quoteState.dealType === 'Trade-In Terms'
  )
})

// Sum of all trade-in values
const tradeInSum = computed(() => {
  return quoteState.tradeIns.reduce((sum, ti) => sum + (ti.value || 0), 0)
})

// When deal type changes, handle trade-in field visibility/clearing
watch(
  () => quoteState.dealType,
  (newType) => {
    if (newType === 'Standard Cash' || newType === 'Standard Terms') {
      quoteState.tradeIns = []
    } else if (
      newType === 'Trade-In Cash' ||
      newType === 'Trade-In Terms'
    ) {
      if (quoteState.tradeIns.length === 0) {
        quoteState.tradeIns.push({ description: '', value: 0 })
      }
    }
    recomputeAllAmortizations()
  }
)

// Watch contract price changes to recompute amortizations
watch(
  () => quoteState.contractPrice,
  () => recomputeAllAmortizations()
)

// Watch trade-in changes to recompute amortizations
watch(
  () => quoteState.tradeIns,
  () => recomputeAllAmortizations(),
  { deep: true }
)

// Watch term option changes to recompute amortizations
watch(
  () => quoteState.termOptions,
  () => recomputeAllAmortizations(),
  { deep: true }
)

/**
 * Recompute monthly amortization for all term options.
 */
function recomputeAllAmortizations() {
  const price = quoteState.contractPrice
  if (price === null || price <= 0) {
    quoteState.termOptions.forEach((opt) => {
      opt.monthlyAmortization = null
    })
    return
  }

  const totalTradeIn = tradeInSum.value

  quoteState.termOptions.forEach((opt) => {
    const result = computeAmortization(
      price,
      opt.downPayment,
      totalTradeIn,
      opt.months
    )
    opt.monthlyAmortization = result.value !== undefined ? result.value : null
  })
}

// --- Term Option management ---

const canAddTermOption = computed(() => quoteState.termOptions.length < 5)
const canRemoveTermOption = computed(() => quoteState.termOptions.length > 1)

function addTermOption() {
  if (!canAddTermOption.value) return
  quoteState.termOptions.push({ dealType: "Installment", contractPrice: null, downPayment: 0, months: 12, monthlyAmortization: null })
}

function removeTermOption(index: number) {
  if (!canRemoveTermOption.value) return
  quoteState.termOptions.splice(index, 1)
}

// --- Trade-In management ---

const canAddTradeIn = computed(() => quoteState.tradeIns.length < 3)

function addTradeIn() {
  if (!canAddTradeIn.value) return
  quoteState.tradeIns.push({ description: '', value: 0 })
}

function removeTradeIn(index: number) {
  quoteState.tradeIns.splice(index, 1)
}

function clampTradeInValue(index: number) {
  const ti = quoteState.tradeIns[index]
  if (!ti) return
  if (ti.value < 0) ti.value = 0
}

/**
 * Format a number as currency for display.
 */
function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// --- Freebie management ---

// Money formatting helpers
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
}

const freebieInput = ref('')

function addFreebie() {
  const trimmed = freebieInput.value.trim()
  if (!trimmed) return
  quoteState.freebies.push(trimmed)
  freebieInput.value = ''
}

function removeFreebie(index: number) {
  quoteState.freebies.splice(index, 1)
}

// --- Inclusion management ---

const showInclusionInput = ref(false)
const newInclusionText = ref('')

function addInclusion() {
  const trimmed = newInclusionText.value.trim()
  if (!trimmed) return
  quoteState.inclusionItems = addCustomItem(quoteState.inclusionItems, trimmed)
  newInclusionText.value = ''
  showInclusionInput.value = false
}

function removeInclusion(id: string) {
  quoteState.inclusionItems = removeCustomItem(quoteState.inclusionItems, id)
}

// --- Consumable prices sync ---

watch(
  () => quoteState.consumables,
  (newConsumables) => {
    const existingMap = new Map(
      quoteState.consumablePrices.map((cp) => [cp.consumableId, cp.customPrice])
    )
    quoteState.consumablePrices = newConsumables.map((c) => ({
      consumableId: c.id,
      customPrice: existingMap.has(c.id) ? existingMap.get(c.id)! : c.default_price,
    }))
  },
  { immediate: true }
)

// --- Exclusion management ---

const showExclusionInput = ref(false)
const newExclusionText = ref('')

function confirmAddExclusion() {
  const trimmed = newExclusionText.value.trim()
  if (!trimmed) return
  quoteState.exclusionItems = addCustomItem(quoteState.exclusionItems, trimmed)
  newExclusionText.value = ''
  showExclusionInput.value = false
}

function removeExclusionItem(id: string) {
  quoteState.exclusionItems = removeCustomItem(quoteState.exclusionItems, id)
}

// --- Re-certified label ---

const isReCertified = computed(() => quoteState.unitCondition === 'Re-certified')

// --- Closing Documents validation & navigation ---

const showDocsPrompt = ref(false)
const showValidationBox = ref(false)

const liveValidationErrors = computed(() =>
  validateQuote(quoteState).errors
)

function openClosingDocuments() {
  const result = validateQuote(quoteState)
  if (result.isValid) {
    showValidationBox.value = false
    showDocsPrompt.value = true
  } else {
    quoteState.validationErrors = result.errors
    showValidationBox.value = true
  }
}

function handleDocsConfirm(_data: any) {
  showDocsPrompt.value = false
}

const tradeInDescriptions = computed(() =>
  quoteState.tradeIns.map((ti) => ti.description).filter((d) => d.trim() !== '')
)

function dismissValidationBox() {
  showValidationBox.value = false
}
</script>

<template>
  <div class="form-panel" id="form-panel">
    <!-- Header -->
    <div class="fp-header">
      <div class="fp-header__title">ES PRINT MEDIA INC.</div>
      <div class="fp-header__subtitle">Quotation Generator</div>
    </div>

    <div class="form-panel__content">

      <!-- LETTERHEAD -->
      <h2 class="fp-section-title">Letterhead</h2>
      <div class="fp-sec">
        <label class="fp-lbl" for="letterhead-sel">Select Letterhead</label>
        <select id="letterhead-sel" class="fp-sel" v-model="quoteState.letterhead">
          <option v-for="lh in letterheadOptions" :key="lh" :value="lh">{{ lh }}</option>
        </select>
      </div>

      <hr class="fp-hr" />

      <!-- MACHINE -->
      <h2 class="fp-section-title">Machine</h2>
      <MachineSelector />

      <hr class="fp-hr" />

      <!-- CLIENT INFORMATION -->
      <h2 class="fp-section-title">Client Information</h2>
      <div class="fp-sec">
        <label class="fp-lbl" for="client-name">Client Name</label>
        <input id="client-name" class="fp-in" type="text" v-model="quoteState.clientName" placeholder="Full name" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="client-company">Company</label>
        <input id="client-company" class="fp-in" type="text" v-model="quoteState.company" placeholder="Company name" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="client-address">Address</label>
        <input id="client-address" class="fp-in" type="text" v-model="quoteState.address" placeholder="City / Address" />
      </div>
      <div class="fp-row">
        <div class="fp-sec">
          <label class="fp-lbl" for="client-contact">Contact No.</label>
          <input id="client-contact" class="fp-in" type="tel" inputmode="tel" v-model="quoteState.contact" placeholder="09XX XXX XXXX" @input="quoteState.contact = quoteState.contact.replace(/[^0-9+ ()-]/g, '')" />
        </div>
        <div class="fp-sec">
          <label class="fp-lbl" for="client-email">Email</label>
          <input id="client-email" class="fp-in" type="text" v-model="quoteState.email" placeholder="email@..." />
        </div>
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="quote-date">Date</label>
        <input id="quote-date" class="fp-in" type="date" v-model="quoteState.quoteDate" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="salutation">Salutation</label>
        <input id="salutation" class="fp-in" type="text" v-model="quoteState.salutation" placeholder="Dear Ma'am / Sir," />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="opening-line">Opening Line</label>
        <input id="opening-line" class="fp-in" type="text" v-model="quoteState.openingLine" placeholder="Thank you for your interest..." />
      </div>

      <hr class="fp-hr" />

      <!-- DEAL TYPE -->
      <h2 class="fp-section-title">Deal Type</h2>
      <div class="fp-sec">
        <label class="fp-lbl" for="deal-type-sel">Type of Deal</label>
        <select id="deal-type-sel" class="fp-sel" v-model="quoteState.dealType">
          <option v-for="dt in dealTypes" :key="dt" :value="dt">{{ dt }}</option>
        </select>
      </div>

      <hr class="fp-hr" />

      <!-- PRICING -->
      <h2 class="fp-section-title">Pricing</h2>
      <div v-if="isReCertified" class="recertified-badge">RE-CERTIFIED</div>
      <div class="fp-sec">
        <label class="fp-lbl" for="contract-price">Contract Price (PHP)</label>
        <input
          id="contract-price"
          class="fp-in"
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.contractPrice)"
          @focus="($event.target as HTMLInputElement).value = quoteState.contractPrice ? String(quoteState.contractPrice) : ''"
          @blur="handleMoneyBlur($event, 'contractPrice')"
          placeholder="0"
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
              <label :for="`ti-value-${index}`" class="fp-lbl">Trade-In Value {{ index + 1 }} (PHP)</label>
              <input
                :id="`ti-value-${index}`"
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
              <label :for="`ti-desc-${index}`" class="fp-lbl">Description {{ index + 1 }}</label>
              <input
                :id="`ti-desc-${index}`"
                class="fp-in"
                type="text"
                v-model="tradeIn.description"
                placeholder="Brand, model, heads…"
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
          type="text"
          inputmode="decimal"
          :value="formatMoney(quoteState.downPayment)"
          @focus="($event.target as HTMLInputElement).value = quoteState.downPayment ? String(quoteState.downPayment) : ''"
          @blur="handleMoneyBlur($event, 'downPayment')"
          placeholder="0"
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
              :aria-label="`Remove term option ${index + 1}`"
            >
              &times;
            </button>
          </div>
          <div class="fp-sec">
            <label :for="`deal-type-${index}`" class="fp-lbl">Deal Type</label>
            <select :id="`deal-type-${index}`" class="fp-in" v-model="option.dealType">
              <option value="Installment">Installment</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div class="fp-sec">
            <label :for="`to-price-${index}`" class="fp-lbl">Contract Price</label>
            <input
              :id="`to-price-${index}`"
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
              <label :for="`to-dp-${index}`" class="fp-lbl">Downpayment</label>
              <input
                :id="`to-dp-${index}`"
                class="fp-in"
                type="number"
                v-model.number="option.downPayment"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div class="fp-sec">
              <label :for="`to-months-${index}`" class="fp-lbl">Months</label>
              <input
                :id="`to-months-${index}`"
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
        <label class="fp-lbl" for="collection-payment">Collection — Payment (cash)</label>
        <input id="collection-payment" class="fp-in" type="text" v-model="quoteState.collectionPayment" placeholder="Upon confirmation and before delivery" maxlength="200" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="collection-downpayment">Collection — Downpayment (terms)</label>
        <input id="collection-downpayment" class="fp-in" type="text" v-model="quoteState.collectionDownpayment" placeholder="Upon confirmation and before delivery" maxlength="200" />
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="collection-amortization">Collection — Amortization (terms)</label>
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
              :aria-label="`Remove freebie: ${freebie}`"
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

      <hr class="fp-hr" />

      <!-- Delivery -->
      <h2 class="fp-section-title">Delivery</h2>
      <div class="fp-ck">
        <input type="checkbox" id="chk-delivery" v-model="quoteState.includeDelivery" />
        <label for="chk-delivery">Include Delivery in Package Inclusions</label>
      </div>
      <p class="fp-note">Unchecked = remains under Exclusives (default).</p>

      <!-- Computer Set -->
      <div v-if="quoteState.hasComputerSetOption">
        <hr class="fp-hr" />
        <h2 class="fp-section-title">Computer Set</h2>
        <div class="fp-ck">
          <input type="checkbox" id="chk-computerset" v-model="quoteState.includeComputerSet" />
          <label for="chk-computerset">Include Computer Set in Package</label>
        </div>
        <div v-if="quoteState.includeComputerSet" class="fp-sec" style="margin-top: 5px">
          <label class="fp-lbl" for="computer-set-spec">Spec (optional)</label>
          <input
            id="computer-set-spec"
            class="fp-in"
            type="text"
            v-model="quoteState.computerSetSpec"
            placeholder="e.g. Intel Core i5, 8GB RAM"
          />
        </div>
      </div>

      <!-- Package Inclusions -->
      <div v-if="quoteState.inclusionItems.length > 0">
        <hr class="fp-hr" />
        <h2 class="fp-section-title">Consumables — Prices</h2>
        <p class="fp-note">Edit prices per client arrangement</p>
        <div class="cons-header-row">
          <span class="cons-col-item">ITEM</span>
          <span class="cons-col-pkg">PKG</span>
          <span class="cons-col-price">PRICE</span>
        </div>
        <div
          v-for="(consumable, index) in quoteState.consumables"
          :key="consumable.id"
          class="cons-row"
        >
          <span class="cons-name">{{ consumable.item_name }}</span>
          <span class="cons-pkg">{{ consumable.package_description }}</span>
          <div class="cons-price">
            <label :for="`cons-price-${index}`" class="sr-only">Price for {{ consumable.item_name }}</label>
            <input
              :id="`cons-price-${index}`"
              type="number"
              :value="quoteState.consumablePrices[index]?.customPrice"
              @input="(e: Event) => {
                const val = parseFloat((e.target as HTMLInputElement).value)
                if (quoteState.consumablePrices[index]) {
                  quoteState.consumablePrices[index].customPrice = isNaN(val) ? 0 : val
                }
              }"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <!-- Exclusions -->
      <div v-if="quoteState.exclusionItems.length > 0">
        <hr class="fp-hr" />
        <h2 class="fp-section-title">Package Inclusions</h2>
        <p class="fp-note">Uncheck any item not included in this quote</p>
        <div
          v-for="item in quoteState.inclusionItems"
          :key="item.id"
          class="fp-ck"
        >
          <input :id="`incl-${item.id}`" type="checkbox" v-model="item.enabled" />
          <label :for="`incl-${item.id}`">{{ item.description }}</label>
          <button
            v-if="item.isCustom"
            type="button"
            class="fp-remove-btn fp-remove-btn--inline"
            @click="removeInclusion(item.id)"
            :aria-label="`Remove inclusion: ${item.description}`"
          >&times;</button>
        </div>
        <div class="fp-add-section">
          <button
            v-if="!showInclusionInput"
            type="button"
            class="fp-add-btn"
            @click="showInclusionInput = true"
          >+ Add Inclusion</button>
          <div v-if="showInclusionInput" class="fp-row" style="margin-top: 4px">
            <input
              type="text"
              class="fp-in"
              v-model="newInclusionText"
              placeholder="Custom inclusion"
              @keyup.enter="addInclusion"
            />
            <button type="button" class="fp-add-btn" @click="addInclusion">Add</button>
            <button type="button" class="fp-cancel-btn" @click="showInclusionInput = false; newInclusionText = ''">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Consumable Prices -->
      <div v-if="quoteState.consumables.length > 0">
        <hr class="fp-hr" />
        <h2 class="fp-section-title">Exclusions</h2>
        <p class="fp-note">Uncheck any exclusion that does not apply</p>
        <div
          v-for="item in quoteState.exclusionItems"
          :key="item.id"
          class="fp-ck"
        >
          <input :id="`excl-${item.id}`" type="checkbox" v-model="item.enabled" />
          <label :for="`excl-${item.id}`">{{ item.description }}</label>
          <button
            v-if="item.isCustom"
            type="button"
            class="fp-remove-btn fp-remove-btn--inline"
            @click="removeExclusionItem(item.id)"
            :aria-label="`Remove exclusion: ${item.description}`"
          >&times;</button>
        </div>
        <div class="fp-add-section">
          <button
            v-if="!showExclusionInput"
            type="button"
            class="fp-add-btn"
            @click="showExclusionInput = true"
          >+ Add Exclusion</button>
          <div v-if="showExclusionInput" class="fp-row" style="margin-top: 4px">
            <input
              type="text"
              class="fp-in"
              v-model="newExclusionText"
              placeholder="Custom exclusion"
              @keyup.enter="confirmAddExclusion"
            />
            <button type="button" class="fp-add-btn" @click="confirmAddExclusion">Add</button>
            <button type="button" class="fp-cancel-btn" @click="showExclusionInput = false; newExclusionText = ''">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Optional Add-Ons -->
      <div v-if="quoteState.addonItems.length > 0">
        <hr class="fp-hr" />
        <h2 class="fp-section-title">Optional Add-Ons</h2>
        <div
          v-for="item in quoteState.addonItems"
          :key="item.id"
          class="fp-ck"
        >
          <input :id="`addon-${item.id}`" type="checkbox" v-model="item.enabled" />
          <label :for="`addon-${item.id}`">{{ item.description }}</label>
        </div>
      </div>

      <hr class="fp-hr" />
      <hr class="fp-hr" />

      <!-- WARRANTY -->
      <h2 class="fp-section-title">Warranty</h2>
      <div class="fp-sec">
        <label class="fp-lbl" for="warranty-company">Company Name (confidentiality line)</label>
        <select id="warranty-company" class="fp-sel" v-model="quoteState.warrantyCompany">
          <option value="">Select company...</option>
          <option value="ES Print Media Inc.">ES Print Media Inc.</option>
          <option value="ACS Premium Solutions Inc.">ACS Premium Solutions Inc.</option>
          <option value="ES Concept Group Inc.">ES Concept Group Inc.</option>
          <option value="ES Print Industries Inc.">ES Print Industries Inc.</option>
        </select>
      </div>
      <div class="fp-sec">
        <label class="fp-lbl" for="warranty-supplier">Supplier Name (void-warranty line)</label>
        <input id="warranty-supplier" class="fp-in" type="text" v-model="quoteState.warrantySupplier" placeholder="ESPMI" />
      </div>

      <hr class="fp-hr" />

      <!-- SIGNATORIES -->
      <h2 class="fp-section-title">Signatories</h2>
      <div class="fp-row">
        <div class="fp-sec">
          <label class="fp-lbl" for="ae-name">Account Executive</label>
          <input id="ae-name" class="fp-in" type="text" v-model="quoteState.aeName" placeholder="AE name" maxlength="100" />
        </div>
        <div class="fp-sec">
          <label class="fp-lbl" for="client-conforme">Client Conforme</label>
          <input id="client-conforme" class="fp-in" type="text" v-model="quoteState.clientConforme" placeholder="Client name" maxlength="100" />
        </div>
      </div>
      <div class="fp-row">
        <div class="fp-sec">
          <label class="fp-lbl" for="noted-by-name">Noted By (Name)</label>
          <input id="noted-by-name" class="fp-in" type="text" v-model="quoteState.notedByName" placeholder="Ness Deomano" maxlength="100" />
        </div>
        <div class="fp-sec">
          <label class="fp-lbl" for="noted-by-role">Noted By (Role)</label>
          <input id="noted-by-role" class="fp-in" type="text" v-model="quoteState.notedByRole" placeholder="Area Sales Manager" maxlength="100" />
        </div>
      </div>

      <!-- Validation Error Box -->
      <div
        v-if="showValidationBox"
        class="validation-error-box"
        role="alert"
        aria-live="polite"
      >
        <div class="validation-error-box__header">
          <span>Please fix the following before continuing:</span>
          <button
            type="button"
            class="validation-error-box__dismiss"
            @click="dismissValidationBox"
            aria-label="Dismiss validation errors"
          >&times;</button>
        </div>
        <ul class="validation-error-box__list">
          <li
            v-for="error in liveValidationErrors.length ? liveValidationErrors : quoteState.validationErrors"
            :key="error"
          >{{ error }}</li>
        </ul>
      </div>

      <hr class="fp-hr" />
      <h2 class="fp-section-title">Closing Documents</h2>
      <p class="fp-note" style="margin-bottom:8px">Prepare the delivery & document details, then open the printable closing documents (T&C, Delivery Instructions, Warranty, CAC, PDC, Pullout).</p>

      <!-- Open Closing Documents Button -->
      <button type="button" class="closing-docs-btn" @click="openClosingDocuments">
        OPEN CLOSING DOCUMENTS
      </button>

      <!-- Save as PDF Button -->
      <button type="button" class="save-pdf-btn" @click="$emit('save-pdf')">
        💾 SAVE AS PDF
      </button>
      <p class="fp-note" style="text-align:center;margin-top:4px">Tip: in the print dialog, set Destination to "Save as PDF"</p>


    </div>

    <!-- Closing Docs Prompt Modal -->
    <ClosingDocsPrompt
      :open="showDocsPrompt"
      :company="quoteState.company"
      :address="quoteState.address"
      :client-name="quoteState.clientName"
      :client-contact="quoteState.contact"
      :client-conforme="quoteState.clientConforme"
      :ae-name="quoteState.aeName"
      :trade-in-descriptions="tradeInDescriptions"
      @close="showDocsPrompt = false"
      @confirm="handleDocsConfirm"
    />
  </div>
</template>

<style scoped>
/* ── Form Panel Shell ── */
.form-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  border-right: 2px solid #c0392b;
}

/* ── Header ── */
.fp-header {
  text-align: center;
  padding: 10px 0 4px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.fp-header__title {
  font-size: 14px;
  font-weight: 700;
  color: #c0392b;
}

.fp-header__subtitle {
  font-size: 10px;
  color: #999;
}

/* ── Content area ── */
.form-panel__content {
  padding: 12px 12px 24px;
}

/* ── Section headers ── */
.fp-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #c0392b;
  border-bottom: 1.5px solid #c0392b;
  padding-bottom: 3px;
  margin: 10px 0 7px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

/* ── Section wrapper ── */
.fp-sec {
  margin-bottom: 8px;
}

/* ── Labels ── */
.fp-lbl {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #666;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: .3px;
}

/* ── Inputs & selects ── */
.fp-in,
.fp-sel {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #222;
  background: #fafafa;
  font-family: inherit;
  box-sizing: border-box;
}

.fp-in:focus,
.fp-sel:focus {
  outline: none;
  border-color: #c0392b;
  background: #fff;
}

/* Prevent iOS auto-zoom */
@media screen and (max-width: 768px) {
  .fp-in,
  .fp-sel {
    font-size: 16px;
    padding: 8px;
  }
}

/* ── Divider ── */
.fp-hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 8px 0;
}

/* ── Side-by-side rows ── */
.fp-row {
  display: flex;
  gap: 6px;
}

.fp-row .fp-sec {
  flex: 1;
}

/* ── Checkboxes ── */
.fp-ck {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.fp-ck input[type="checkbox"] {
  width: 14px;
  height: 14px;
  min-width: 14px;
  min-height: 14px;
  accent-color: #c0392b;
  cursor: pointer;
}

.fp-ck label {
  font-size: 12px;
  color: #333;
  cursor: pointer;
  flex: 1;
}

/* ── Computed / amortization display ── */
.fp-computed {
  background: #fff8f8;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 11px;
  color: #c0392b;
  font-weight: 700;
  margin-top: 3px;
}

/* ── Small note text ── */
.fp-note {
  font-size: 10px;
  color: #aaa;
  margin: 1px 0 6px;
}

/* ── Add / Remove buttons ── */
.fp-add-btn {
  padding: 5px 10px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.fp-add-btn:hover:not(:disabled) {
  background: #fdecea;
}

.fp-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fp-add-btn--inline {
  padding: 3px 8px;
  font-size: 11px;
}

.fp-cancel-btn {
  padding: 5px 8px;
  background: #f5f5f5;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
}

.fp-cancel-btn:hover {
  background: #eee;
}

.fp-remove-btn {
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #c0392b;
  background: transparent;
  border: 1px solid #c0392b;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 2px;
  font-family: inherit;
}

.fp-remove-btn:hover {
  background: #fdecea;
}

.fp-remove-btn--inline {
  margin-top: 0;
  margin-left: auto;
  flex-shrink: 0;
}

/* ── Add section (for inclusions/exclusions) ── */
.fp-add-section {
  margin-top: 4px;
}

/* ── Term option row ── */
.fp-term-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.to-row {
  border: 1px solid #e5c9c5;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 6px;
  background: #fffafa;
}

.to-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #c0392b;
  margin-bottom: 3px;
}

.to-del {
  border: 1px solid #ddd;
  background: #fff;
  color: #c0392b;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  width: 22px;
  height: 22px;
  line-height: 1;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.to-del:hover {
  background: #fdecea;
}

/* ── Trade-in rows ── */
.trade-in-row {
  margin-bottom: 6px;
}

/* ── Freebie items ── */
.freebie-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 12px;
  color: #444;
  margin-bottom: 3px;
}

/* ── Re-certified badge ── */
.recertified-badge {
  display: inline-block;
  margin-bottom: 6px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 3px;
}

/* ── Consumables table ── */
.cons-header-row {
  display: flex;
  padding: 2px 0;
  margin-bottom: 3px;
  border-bottom: 1px solid #f0f0f0;
}

.cons-header-row span {
  font-size: 10px;
  font-weight: 600;
  color: #aaa;
}

.cons-col-item {
  flex: 1;
}

.cons-col-pkg {
  width: 68px;
  text-align: right;
}

.cons-col-price {
  width: 70px;
  text-align: right;
}

.cons-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  border-bottom: 1px solid #f5f5f5;
}

.cons-name {
  flex: 1;
  font-size: 11px;
  color: #444;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cons-pkg {
  font-size: 10px;
  color: #999;
  width: 68px;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cons-price {
  width: 70px;
  flex-shrink: 0;
}

.cons-price input {
  width: 100%;
  padding: 3px 4px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  font-size: 11px;
  text-align: right;
  background: #fafafa;
  font-family: inherit;
  box-sizing: border-box;
}

.cons-price input:focus {
  outline: none;
  border-color: #c0392b;
  background: #fff;
}

/* ── Validation error box ── */
.validation-error-box {
  padding: 8px 10px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #c0392b;
  margin-bottom: 8px;
}

.validation-error-box__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
}

.validation-error-box__dismiss {
  background: transparent;
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: #c0392b;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}

.validation-error-box__dismiss:hover {
  opacity: 0.7;
}

.validation-error-box__list {
  margin: 0;
  padding-left: 16px;
}

.validation-error-box__list li {
  font-size: 11px;
  line-height: 1.5;
}

/* ── Closing documents button ── */
.closing-docs-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  letter-spacing: .5px;
  margin-top: 12px;
  font-family: inherit;
}

.closing-docs-btn:hover {
  background: #a93226;
}

/* ── Screen reader only ── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.save-pdf-btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}

.save-pdf-btn:hover {
  background: #a93226;
}
</style>
