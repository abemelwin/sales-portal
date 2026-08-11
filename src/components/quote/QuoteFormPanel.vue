<script setup lang="ts">
import { inject, computed, watch, ref } from 'vue'
import MachineSelector from './MachineSelector.vue'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { computeAmortization } from '@/utils/quote-calculations'
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
      // Clear trade-in values for standard deal types
      quoteState.tradeIns = []
    } else if (
      newType === 'Trade-In Cash' ||
      newType === 'Trade-In Terms'
    ) {
      // Ensure at least one trade-in field exists
      if (quoteState.tradeIns.length === 0) {
        quoteState.tradeIns.push({ description: '', value: 0 })
      }
    }
    // Recompute amortizations when deal type changes
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
  quoteState.termOptions.push({
    downPayment: 0,
    months: 1,
    monthlyAmortization: null,
  })
}

function removeTermOption(index: number) {
  if (!canRemoveTermOption.value) return
  quoteState.termOptions.splice(index, 1)
}

/**
 * Clamp months to valid range (1–60) on blur.
 */
function clampMonths(index: number) {
  const opt = quoteState.termOptions[index]
  if (!opt) return
  if (opt.months < 1) opt.months = 1
  if (opt.months > 60) opt.months = 60
}

/**
 * Ensure down payment is not negative on blur.
 */
function clampDownPayment(index: number) {
  const opt = quoteState.termOptions[index]
  if (!opt) return
  if (opt.downPayment < 0) opt.downPayment = 0
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

/**
 * Ensure trade-in value is not negative on blur.
 */
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

// --- Consumable prices sync ---

/**
 * When consumables are populated from catalog, init consumablePrices to match defaults.
 */
watch(
  () => quoteState.consumables,
  (newConsumables) => {
    // Build prices array matching current consumables
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

// --- Re-certified label ---

const isReCertified = computed(() => quoteState.unitCondition === 'Re-certified')
</script>

<template>
  <div class="form-panel" id="form-panel">
    <div class="form-panel__content">
      <!-- Machine Selection (task 10.1) -->
      <MachineSelector />

      <!-- Client Info Section -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Client Information</h3>
        <div class="form-grid">
          <div class="form-field">
            <label for="client-name" class="form-field__label">Client Name</label>
            <input
              id="client-name"
              type="text"
              v-model="quoteState.clientName"
              class="form-field__input"
              placeholder="Full name"
            />
          </div>
          <div class="form-field">
            <label for="client-company" class="form-field__label">Company</label>
            <input
              id="client-company"
              type="text"
              v-model="quoteState.company"
              class="form-field__input"
              placeholder="Company name"
            />
          </div>
          <div class="form-field form-field--full">
            <label for="client-address" class="form-field__label">Address</label>
            <input
              id="client-address"
              type="text"
              v-model="quoteState.address"
              class="form-field__input"
              placeholder="Complete address"
            />
          </div>
          <div class="form-field">
            <label for="client-contact" class="form-field__label">Contact</label>
            <input
              id="client-contact"
              type="text"
              v-model="quoteState.contact"
              class="form-field__input"
              placeholder="Phone / Email"
            />
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Pricing</h3>

        <!-- Re-certified label -->
        <div v-if="isReCertified" class="recertified-badge">RE-CERTIFIED</div>

        <div class="form-grid">
          <div class="form-field">
            <label for="contract-price" class="form-field__label">Contract Price</label>
            <input
              id="contract-price"
              type="number"
              v-model.number="quoteState.contractPrice"
              class="form-field__input"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <!-- Options: VAT & Promo -->
        <div class="form-options">
          <label class="form-options__checkbox">
            <input
              type="checkbox"
              v-model="quoteState.vatInclusive"
              class="form-options__checkbox-input"
            />
            <span class="form-options__checkbox-label">VAT-Inclusive</span>
          </label>
          <label class="form-options__checkbox">
            <input
              type="checkbox"
              v-model="quoteState.underPromo"
              class="form-options__checkbox-input"
            />
            <span class="form-options__checkbox-label">UNDER PROMO</span>
          </label>
        </div>

        <!-- Promo section (visible when UNDER PROMO is checked) -->
        <div v-if="quoteState.underPromo" class="promo-section">
          <div class="form-field">
            <label for="promo-validity" class="form-field__label">Promo Validity</label>
            <input
              id="promo-validity"
              type="text"
              v-model="quoteState.promoValidity"
              class="form-field__input"
              placeholder="e.g., Valid until Dec 31, 2025"
            />
          </div>

          <div class="freebie-list">
            <h4 class="freebie-list__title">Freebies</h4>
            <div class="freebie-list__items">
              <div
                v-for="(freebie, index) in quoteState.freebies"
                :key="index"
                class="freebie-list__item"
              >
                <span class="freebie-list__item-text">{{ freebie }}</span>
                <button
                  type="button"
                  class="freebie-list__remove-btn"
                  @click="removeFreebie(index)"
                  :aria-label="`Remove freebie: ${freebie}`"
                >
                  &times;
                </button>
              </div>
            </div>
            <div class="freebie-list__add">
              <input
                type="text"
                v-model="freebieInput"
                class="freebie-list__input"
                placeholder="Add a freebie item"
                @keyup.enter="addFreebie"
              />
              <button
                type="button"
                class="freebie-list__add-btn"
                @click="addFreebie"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Letterhead Selection -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Letterhead</h3>
        <div class="letterhead-options">
          <label
            v-for="lh in letterheadOptions"
            :key="lh"
            class="letterhead-options__option"
          >
            <input
              type="radio"
              :value="lh"
              v-model="quoteState.letterhead"
              class="letterhead-options__radio"
              name="letterhead"
            />
            <span class="letterhead-options__label-text">{{ lh }}</span>
          </label>
        </div>
      </section>

      <!-- Consumable Prices (visible when consumables are loaded from catalog) -->
      <section v-if="quoteState.consumables.length > 0" class="form-panel__section">
        <h3 class="form-panel__section-title">Consumable Prices</h3>
        <p class="form-panel__hint">Customize pricing per quote. Defaults from catalog.</p>
        <div class="consumable-prices">
          <div
            v-for="(consumable, index) in quoteState.consumables"
            :key="consumable.id"
            class="consumable-prices__item"
          >
            <div class="consumable-prices__info">
              <span class="consumable-prices__name">{{ consumable.item_name }}</span>
              <span class="consumable-prices__package">{{ consumable.package_description }}</span>
            </div>
            <div class="consumable-prices__price-field">
              <label :for="`cons-price-${index}`" class="sr-only">
                Price for {{ consumable.item_name }}
              </label>
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
                class="consumable-prices__input"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Deal Type & Terms Section (task 10.3) -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Deal Type &amp; Terms</h3>

        <!-- Deal Type Selector -->
        <fieldset class="deal-type-fieldset">
          <legend class="deal-type-fieldset__legend">Deal Type</legend>
          <div class="deal-type-fieldset__options">
            <label
              v-for="dt in dealTypes"
              :key="dt"
              class="deal-type-fieldset__option"
            >
              <input
                type="radio"
                :value="dt"
                v-model="quoteState.dealType"
                class="deal-type-fieldset__radio"
                name="deal-type"
              />
              <span class="deal-type-fieldset__label-text">{{ dt }}</span>
            </label>
          </div>
        </fieldset>

        <!-- Term Options Editor -->
        <div class="term-options">
          <div class="term-options__header">
            <h4 class="term-options__title">
              Term Options
              <span class="term-options__count">({{ quoteState.termOptions.length }}/5)</span>
            </h4>
            <button
              type="button"
              class="term-options__add-btn"
              :disabled="!canAddTermOption"
              @click="addTermOption"
              aria-label="Add term option"
            >
              + Add Option
            </button>
          </div>

          <div
            v-for="(option, index) in quoteState.termOptions"
            :key="index"
            class="term-options__item"
          >
            <div class="term-options__item-header">
              <span class="term-options__item-label">Option {{ index + 1 }}</span>
              <button
                v-if="canRemoveTermOption"
                type="button"
                class="term-options__remove-btn"
                @click="removeTermOption(index)"
                :aria-label="`Remove term option ${index + 1}`"
              >
                Remove
              </button>
            </div>

            <div class="term-options__fields">
              <div class="term-options__field">
                <label :for="`dp-${index}`" class="term-options__field-label">
                  Down Payment
                </label>
                <input
                  :id="`dp-${index}`"
                  type="number"
                  v-model.number="option.downPayment"
                  min="0"
                  step="0.01"
                  class="term-options__input"
                  placeholder="0.00"
                  @blur="clampDownPayment(index)"
                />
              </div>

              <div class="term-options__field">
                <label :for="`months-${index}`" class="term-options__field-label">
                  Months
                </label>
                <input
                  :id="`months-${index}`"
                  type="number"
                  v-model.number="option.months"
                  min="1"
                  max="60"
                  step="1"
                  class="term-options__input"
                  placeholder="1"
                  @blur="clampMonths(index)"
                />
              </div>

              <div class="term-options__field term-options__field--computed">
                <span class="term-options__field-label">Monthly Amortization</span>
                <span class="term-options__amortization">
                  {{ formatCurrency(option.monthlyAmortization) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Trade-In Fields (visible when deal type includes "Trade-In") -->
        <div v-if="showTradeIns" class="trade-ins">
          <div class="trade-ins__header">
            <h4 class="trade-ins__title">
              Trade-Ins
              <span class="trade-ins__count">({{ quoteState.tradeIns.length }}/3)</span>
            </h4>
            <button
              type="button"
              class="trade-ins__add-btn"
              :disabled="!canAddTradeIn"
              @click="addTradeIn"
              aria-label="Add trade-in"
            >
              + Add Trade-In
            </button>
          </div>

          <div
            v-for="(tradeIn, index) in quoteState.tradeIns"
            :key="index"
            class="trade-ins__item"
          >
            <div class="trade-ins__item-header">
              <span class="trade-ins__item-label">Trade-In {{ index + 1 }}</span>
              <button
                type="button"
                class="trade-ins__remove-btn"
                @click="removeTradeIn(index)"
                :aria-label="`Remove trade-in ${index + 1}`"
              >
                Remove
              </button>
            </div>

            <div class="trade-ins__fields">
              <div class="trade-ins__field">
                <label :for="`ti-desc-${index}`" class="trade-ins__field-label">
                  Description
                </label>
                <input
                  :id="`ti-desc-${index}`"
                  type="text"
                  v-model="tradeIn.description"
                  class="trade-ins__input"
                  placeholder="Unit description"
                />
              </div>

              <div class="trade-ins__field">
                <label :for="`ti-value-${index}`" class="trade-ins__field-label">
                  Value
                </label>
                <input
                  :id="`ti-value-${index}`"
                  type="number"
                  v-model.number="tradeIn.value"
                  min="0"
                  step="0.01"
                  class="trade-ins__input"
                  placeholder="0.00"
                  @blur="clampTradeInValue(index)"
                />
              </div>
            </div>
          </div>

          <p v-if="tradeInSum > 0" class="trade-ins__total">
            Total Trade-In Value: {{ formatCurrency(tradeInSum) }}
          </p>
        </div>
      </section>

      <!-- Collection Arrangements -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Collection Arrangements</h3>
        <div class="form-grid">
          <div class="form-field form-field--full">
            <label for="availability" class="form-field__label">Availability</label>
            <input
              id="availability"
              type="text"
              v-model="quoteState.availability"
              class="form-field__input"
              placeholder="Unit availability details"
              maxlength="200"
            />
            <span class="form-field__char-count">{{ quoteState.availability.length }}/200</span>
          </div>
          <div class="form-field form-field--full">
            <label for="collection-payment" class="form-field__label">Payment Collection</label>
            <input
              id="collection-payment"
              type="text"
              v-model="quoteState.collectionPayment"
              class="form-field__input"
              placeholder="Payment collection arrangement"
              maxlength="200"
            />
            <span class="form-field__char-count">{{ quoteState.collectionPayment.length }}/200</span>
          </div>
          <div class="form-field form-field--full">
            <label for="collection-downpayment" class="form-field__label">Down Payment Collection</label>
            <input
              id="collection-downpayment"
              type="text"
              v-model="quoteState.collectionDownpayment"
              class="form-field__input"
              placeholder="Down payment collection arrangement"
              maxlength="200"
            />
            <span class="form-field__char-count">{{ quoteState.collectionDownpayment.length }}/200</span>
          </div>
          <div class="form-field form-field--full">
            <label for="collection-amortization" class="form-field__label">Amortization Collection</label>
            <input
              id="collection-amortization"
              type="text"
              v-model="quoteState.collectionAmortization"
              class="form-field__input"
              placeholder="Amortization collection arrangement"
              maxlength="200"
            />
            <span class="form-field__char-count">{{ quoteState.collectionAmortization.length }}/200</span>
          </div>
        </div>
      </section>

      <!-- Signatories -->
      <section class="form-panel__section">
        <h3 class="form-panel__section-title">Signatories</h3>
        <div class="form-grid">
          <div class="form-field">
            <label for="ae-name" class="form-field__label">Account Executive</label>
            <input
              id="ae-name"
              type="text"
              v-model="quoteState.aeName"
              class="form-field__input"
              placeholder="AE name"
              maxlength="100"
            />
            <span class="form-field__char-count">{{ quoteState.aeName.length }}/100</span>
          </div>
          <div class="form-field">
            <label for="client-conforme" class="form-field__label">Client Conforme</label>
            <input
              id="client-conforme"
              type="text"
              v-model="quoteState.clientConforme"
              class="form-field__input"
              placeholder="Client conforme name"
              maxlength="100"
            />
            <span class="form-field__char-count">{{ quoteState.clientConforme.length }}/100</span>
          </div>
          <div class="form-field">
            <label for="noted-by-name" class="form-field__label">Noted By (Name)</label>
            <input
              id="noted-by-name"
              type="text"
              v-model="quoteState.notedByName"
              class="form-field__input"
              placeholder="Noted by name"
              maxlength="100"
            />
            <span class="form-field__char-count">{{ quoteState.notedByName.length }}/100</span>
          </div>
          <div class="form-field">
            <label for="noted-by-role" class="form-field__label">Noted By (Role)</label>
            <input
              id="noted-by-role"
              type="text"
              v-model="quoteState.notedByRole"
              class="form-field__input"
              placeholder="Noted by role"
              maxlength="100"
            />
            <span class="form-field__char-count">{{ quoteState.notedByRole.length }}/100</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.form-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--color-gray-50);
}

.form-panel__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
}

@media screen and (min-width: 768px) {
  .form-panel__content {
    padding: var(--space-6);
  }
}

.form-panel__section {
  padding: var(--space-4);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.form-panel__section-title {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-800);
}

.form-panel__placeholder {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-400);
  font-style: italic;
}

/* --- Deal Type Fieldset --- */
.deal-type-fieldset {
  border: none;
  padding: 0;
  margin: 0 0 var(--space-4);
}

.deal-type-fieldset__legend {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.deal-type-fieldset__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

@media screen and (max-width: 767px) {
  .deal-type-fieldset__options {
    grid-template-columns: 1fr;
  }
}

.deal-type-fieldset__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.deal-type-fieldset__option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.deal-type-fieldset__option:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.deal-type-fieldset__radio {
  min-height: auto;
  min-width: auto;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.deal-type-fieldset__label-text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
}

/* --- Term Options --- */
.term-options {
  margin-bottom: var(--space-4);
}

.term-options__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.term-options__title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-gray-800);
}

.term-options__count {
  font-weight: 400;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.term-options__add-btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.term-options__add-btn:hover:not(:disabled) {
  background: #c7dbfe;
}

.term-options__add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.term-options__item {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  background: var(--color-gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.term-options__item:last-child {
  margin-bottom: 0;
}

.term-options__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.term-options__item-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.term-options__remove-btn {
  padding: var(--space-1) var(--space-2);
  min-height: auto;
  min-width: auto;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.term-options__remove-btn:hover {
  background: var(--color-error-light);
}

.term-options__fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
}

@media screen and (max-width: 767px) {
  .term-options__fields {
    grid-template-columns: 1fr;
  }
}

.term-options__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.term-options__field--computed {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.term-options__field-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-600);
}

.term-options__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.term-options__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.term-options__amortization {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-primary);
  padding: var(--space-2) 0;
}

/* --- Trade-Ins --- */
.trade-ins {
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}

.trade-ins__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.trade-ins__title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-gray-800);
}

.trade-ins__count {
  font-weight: 400;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.trade-ins__add-btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.trade-ins__add-btn:hover:not(:disabled) {
  background: #c7dbfe;
}

.trade-ins__add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trade-ins__item {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
  background: var(--color-gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.trade-ins__item:last-child {
  margin-bottom: 0;
}

.trade-ins__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.trade-ins__item-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.trade-ins__remove-btn {
  padding: var(--space-1) var(--space-2);
  min-height: auto;
  min-width: auto;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.trade-ins__remove-btn:hover {
  background: var(--color-error-light);
}

.trade-ins__fields {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-3);
}

@media screen and (max-width: 767px) {
  .trade-ins__fields {
    grid-template-columns: 1fr;
  }
}

.trade-ins__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.trade-ins__field-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-600);
}

.trade-ins__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.trade-ins__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.trade-ins__total {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700);
  padding: var(--space-2) var(--space-3);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
}

/* --- Form Grid (shared layout for fields) --- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@media screen and (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field__label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-600);
}

.form-field__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.form-field__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-field__char-count {
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  text-align: right;
}

.form-panel__hint {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* --- Re-certified Badge --- */
.recertified-badge {
  display: inline-block;
  margin-bottom: var(--space-3);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: var(--radius-sm);
}

/* --- Form Options (checkboxes) --- */
.form-options {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.form-options__checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.form-options__checkbox-input {
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  accent-color: var(--color-primary);
}

.form-options__checkbox-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-800);
}

/* --- Promo Section --- */
.promo-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}

/* --- Freebie List --- */
.freebie-list {
  margin-top: var(--space-3);
}

.freebie-list__title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.freebie-list__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.freebie-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.freebie-list__item-text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
}

.freebie-list__remove-btn {
  min-height: auto;
  min-width: auto;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-base);
  font-weight: 700;
  line-height: 1;
  color: var(--color-error);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.freebie-list__remove-btn:hover {
  background: var(--color-error-light);
}

.freebie-list__add {
  display: flex;
  gap: var(--space-2);
}

.freebie-list__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.freebie-list__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.freebie-list__add-btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.freebie-list__add-btn:hover {
  background: #c7dbfe;
}

/* --- Letterhead Options --- */
.letterhead-options {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.letterhead-options__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.letterhead-options__option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.letterhead-options__option:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.letterhead-options__radio {
  min-height: auto;
  min-width: auto;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.letterhead-options__label-text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
}

/* --- Consumable Prices --- */
.consumable-prices {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.consumable-prices__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

@media screen and (max-width: 767px) {
  .consumable-prices__item {
    flex-direction: column;
    align-items: stretch;
  }
}

.consumable-prices__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.consumable-prices__name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.consumable-prices__package {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.consumable-prices__price-field {
  flex-shrink: 0;
  width: 120px;
}

@media screen and (max-width: 767px) {
  .consumable-prices__price-field {
    width: 100%;
  }
}

.consumable-prices__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.consumable-prices__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

/* --- Screen reader only utility --- */
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
</style>
