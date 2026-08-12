<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuoteStore } from '@/stores/quotes'
import { useExportPDF } from '@/composables/useExportPDF'
import {
  TermsConditions,
  DeliveryInstructions,
  WarrantyCard,
  CACForm,
  PDCForm,
  PulloutForm,
} from '@/components/closing'
import {
  CLOSING_DOC_TABS,
  createBlankClosingDocData,
  type ClosingDocTab,
  type ClosingDocData,
} from '@/components/closing/types'
import letterheadEspmi from '@/assets/letterhead-espmi.svg'
import letterheadAcs from '@/assets/letterhead-acs.svg'

const route = useRoute()
const router = useRouter()
const quoteStore = useQuoteStore()
const { printClosingDoc, isPrinting, printError, dismissPrintError } = useExportPDF()

// Active tab
const activeTab = ref<ClosingDocTab>('terms-conditions')

// Per-tab data storage — retains data across tab switches (Requirement 8.3)
const tabData = reactive<Record<ClosingDocTab, ClosingDocData>>({
  'terms-conditions': createBlankClosingDocData(),
  'delivery-instructions': createBlankClosingDocData(),
  'warranty-card': createBlankClosingDocData(),
  'cac': createBlankClosingDocData(),
  'pdc': createBlankClosingDocData(),
  'pullout': createBlankClosingDocData(),
})

// Loading and error states
const loading = ref(false)
const error = ref<string | null>(null)

// The letterhead from the quote (used in export, passed along for task 13.2)
const letterhead = ref<string>('ES Print Media Inc.')

// Whether this view is shown as a modal overlay or a standalone page
const isOpen = ref(true)

/**
 * Pre-populate fields from quote data (Requirement 8.1).
 * Leaves fields blank when corresponding quote data is unavailable.
 */
function populateFromQuote() {
  const quote = quoteStore.currentQuote
  if (!quote) return

  letterhead.value = quote.letterhead ?? 'ES Print Media Inc.'

  // Determine first term option values for down payment and amortization
  const firstTerm = quote.term_options?.[0]
  const downPayment = firstTerm?.down_payment != null
    ? String(firstTerm.down_payment)
    : ''
  const monthlyAmortization = firstTerm?.monthly_amortization != null
    ? String(firstTerm.monthly_amortization)
    : ''

  // Build the machine model display string
  const machineModel = quote.machine_id ? '' : '' // Will be populated if machine data available

  // Common pre-populated values
  const commonData: Partial<ClosingDocData> = {
    clientName: quote.client_name ?? '',
    company: quote.company ?? '',
    address: quote.address ?? '',
    contact: quote.contact ?? '',
    machineModel,
    contractPrice: quote.contract_price != null ? String(quote.contract_price) : '',
    downPayment,
    monthlyAmortization,
    aeName: quote.ae_name ?? '',
    clientConforme: quote.client_conforme ?? '',
    notedByName: quote.noted_by_name ?? '',
    notedByRole: quote.noted_by_role ?? '',
  }

  // Apply common data to all tabs
  for (const tabId of Object.keys(tabData) as ClosingDocTab[]) {
    Object.assign(tabData[tabId], commonData)
  }
}

/**
 * Handle field update from a tab component.
 * Updates only the current tab's data so each tab maintains independent state.
 */
function handleUpdate(field: keyof ClosingDocData, value: string) {
  tabData[activeTab.value][field] = value
}

/**
 * Close the closing docs view — discard all unsaved data (Requirement 8.6).
 */
function handleClose() {
  // Reset all tab data
  for (const tabId of Object.keys(tabData) as ClosingDocTab[]) {
    Object.assign(tabData[tabId], createBlankClosingDocData())
  }
  isOpen.value = false
  // Navigate back to the quote
  const quoteId = route.params.id as string
  router.push({ name: 'quote-edit', params: { id: quoteId } })
}

/**
 * Export/print the currently active document tab as PDF (Requirement 8.4, 8.5).
 * Uses useExportPDF composable which manages body class and data attribute for print CSS.
 */
function handleExport() {
  printClosingDoc(activeTab.value)
}

// Active tab's component
const activeTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'terms-conditions': return TermsConditions
    case 'delivery-instructions': return DeliveryInstructions
    case 'warranty-card': return WarrantyCard
    case 'cac': return CACForm
    case 'pdc': return PDCForm
    case 'pullout': return PulloutForm
    default: return TermsConditions
  }
})

// Active tab's data
const activeTabData = computed(() => tabData[activeTab.value])

// Letterhead image source based on quote's letterhead selection (Requirement 8.5)
const letterheadSrc = computed(() => {
  return letterhead.value === 'ACS / Alternative' ? letterheadAcs : letterheadEspmi
})

// Letterhead alt text
const letterheadAlt = computed(() => {
  return letterhead.value === 'ACS / Alternative'
    ? 'ACS / Alternative letterhead'
    : 'ES Print Media Inc. letterhead'
})

// Load quote on mount
onMounted(async () => {
  const quoteId = route.params.id as string
  if (!quoteId) {
    error.value = 'No quote ID provided.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await quoteStore.loadQuote(quoteId)
    if (!result.success) {
      error.value = result.error ?? 'Failed to load quote data.'
      return
    }
    populateFromQuote()
  } catch (err) {
    error.value = 'An unexpected error occurred while loading quote data.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="isOpen" class="closing-docs-view">
    <!-- Header -->
    <header class="closing-docs-header no-print">
      <h1>Closing Documents</h1>
      <div class="header-actions">
        <button
          class="btn btn-primary"
          @click="handleExport"
          :disabled="loading || isPrinting"
        >
          {{ isPrinting ? 'Exporting...' : 'Export PDF' }}
        </button>
        <button
          class="btn btn-secondary"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </header>

    <!-- Print error notification -->
    <div v-if="printError" class="print-error-banner no-print" role="alert">
      <p>{{ printError }}</p>
      <button class="btn btn-secondary" @click="dismissPrintError">Dismiss</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading quote data...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="btn btn-secondary" @click="handleClose">Go Back</button>
    </div>

    <!-- Main content -->
    <div v-else class="closing-docs-content">
      <!-- Tab navigation -->
      <nav class="tab-nav no-print" role="tablist" aria-label="Closing document types">
        <button
          v-for="tab in CLOSING_DOC_TABS"
          :key="tab.id"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`panel-${tab.id}`"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Tab panel -->
      <div
        :id="`panel-${activeTab}`"
        role="tabpanel"
        :aria-label="CLOSING_DOC_TABS.find(t => t.id === activeTab)?.label"
        class="tab-panel"
      >
        <div class="a4-paper closing-doc-paper">
          <!-- Letterhead image (Requirement 8.5) — displays at top of each closing doc -->
          <div class="closing-doc-letterhead">
            <img
              :src="letterheadSrc"
              :alt="letterheadAlt"
              class="closing-doc-letterhead__img"
            />
          </div>

          <component
            :is="activeTabComponent"
            :data="activeTabData"
            @update="handleUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.closing-docs-view {
  padding: var(--space-6);
}

.closing-docs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.closing-docs-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

/* Buttons */
.btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-secondary:hover {
  background-color: var(--color-gray-300);
}

/* Loading and Error states */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.error-message {
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

/* Tab navigation */
.tab-nav {
  display: flex;
  gap: var(--space-1);
  border-bottom: 2px solid var(--border-color);
  margin-bottom: var(--space-6);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  padding: var(--space-3) var(--space-4);
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.tab-button:hover {
  color: var(--color-gray-700);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* Tab panel and A4 paper */
.tab-panel {
  display: flex;
  justify-content: center;
}

.closing-doc-paper {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  background: var(--color-white);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
}

/* Responsive: on mobile, scale paper to fit viewport */
@media screen and (max-width: 767px) {
  .closing-docs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .tab-nav {
    gap: 0;
  }

  .tab-button {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
  }

  .closing-doc-paper {
    width: 100%;
    min-height: auto;
    padding: var(--space-4);
    box-shadow: none;
    border: none;
  }
}

/* Letterhead styling */
.closing-doc-letterhead {
  margin-bottom: var(--space-6);
  text-align: center;
}

.closing-doc-letterhead__img {
  max-width: 100%;
  height: auto;
  max-height: 80px;
}

/* Print error banner */
.print-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error);
}

.print-error-banner p {
  margin: 0;
  font-size: var(--font-size-sm);
}

/* Print styles specific to closing docs */
@media print {
  .closing-docs-view {
    padding: 0;
    margin: 0;
    max-width: none;
  }

  .closing-doc-paper {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    box-shadow: none;
    border: none;
    margin: 0;
  }

  .closing-doc-letterhead {
    margin-bottom: 10mm;
  }

  .closing-doc-letterhead__img {
    max-height: 60px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>

<style>
/* Global styles for closing doc forms (unscoped so child components inherit) */
.closing-doc-form .doc-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--color-gray-200);
}

.closing-doc-form .form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.closing-doc-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.closing-doc-form .form-group.full-width {
  grid-column: 1 / -1;
}

.closing-doc-form .form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-600);
}

.closing-doc-form .form-group input,
.closing-doc-form .form-group textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color var(--transition-fast);
  min-height: 44px;
}

.closing-doc-form .form-group input:focus,
.closing-doc-form .form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.closing-doc-form .form-group textarea {
  resize: vertical;
  min-height: 80px;
}

@media screen and (max-width: 767px) {
  .closing-doc-form .form-grid {
    grid-template-columns: 1fr;
  }

  .closing-doc-form .form-group.full-width {
    grid-column: 1;
  }
}

/* Print — show form values as text */
@media print {
  .closing-doc-form .form-group input,
  .closing-doc-form .form-group textarea {
    border: none;
    padding: var(--space-1) 0;
    background: transparent;
    box-shadow: none;
    border-bottom: 1px solid var(--color-gray-300);
  }
}
</style>
