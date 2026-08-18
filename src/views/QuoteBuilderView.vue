<script setup lang="ts">
import { provide, watch, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuoteBuilder, QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { useQuoteStore } from '@/stores/quotes'
import { computeAmortization } from '@/utils/quote-calculations'
import { restoreFromQuote } from '@/utils/quote-state-mapper'
import { useExportPDF } from '@/composables/useExportPDF'
import QuoteFormPanel from '@/components/quote/QuoteFormPanel.vue'
import QuotePreviewPanel from '@/components/quote/QuotePreviewPanel.vue'
import { ClosingDocPaper } from '@/components/closing'
import ClosingDocsPrompt from '@/components/quote/ClosingDocsPrompt.vue'

const route = useRoute()
const quoteStore = useQuoteStore()
const { printQuote, printClosingDoc, isPrinting } = useExportPDF()

// Create the shared quote builder state and provide it to child components
const quoteState = useQuoteBuilder()
provide(QUOTE_BUILDER_KEY, quoteState)

const showDocsPrompt = ref(false)
const promptDetails = ref<any>(null)

function handleDocsConfirm(data: any) {
  promptDetails.value = data
  showDocsPrompt.value = false
}

// Auto-open Closing Docs modal when navigated with ?openDocs=true
onMounted(() => {
  if (route.path === '/closing-docs') {
    setTimeout(() => {
      const btn = document.querySelector('.closing-docs-btn') as HTMLButtonElement
      if (btn) btn.click()
    }, 800)
  }
})


// ─── Mobile Tab Navigation (Requirement 14.2) ───────────────────────────────────

type MobileTab = 'form' | 'preview'

/** Currently active mobile tab */
const activeTab = ref<MobileTab>('form')

/** Whether the viewport is below 768px (mobile mode) */
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

/** Switch mobile tab — form data is preserved because it's reactive state */
function switchTab(tab: MobileTab) {
  activeTab.value = tab   
}

/** Whether to show the form panel */
const showForm = computed(() => !isMobile.value || activeTab.value === 'form')

/** Whether to show the preview panel */
const showPreview = computed(() => !isMobile.value || activeTab.value === 'preview')

/** Whether to show the fixed mobile PDF button */
const showMobilePdfButton = computed(() => isMobile.value && activeTab.value === 'preview')

// ─── Save/Load State ────────────────────────────────────────────────────────────

/** The ID of the currently loaded quote (null for new quotes) */
const quoteId = ref<string | null>(null)

/** Whether a save operation is in progress */

/** Whether a load operation is in progress */
const loadingQuote = ref(false)

/** Error message to display to the user */

/** Success message to display temporarily */

// ─── Quote Loading (Requirement 5.17) ───────────────────────────────────────────

/**
 * Loads a quote by ID from Supabase and restores all field values
 * into the reactive form state.
 */
async function loadQuoteById(id: string): Promise<void> {
  loadingQuote.value = true

  const result = await quoteStore.loadQuote(id)

  if (result.success && result.quote) {
    quoteId.value = result.quote.id
    restoreFromQuote(quoteState, result.quote)
  } else {
  }

  loadingQuote.value = false
}

/**
 * On mount, check if the route contains a quote ID and load it.
 */
onMounted(async () => {
  const id = route.params.id as string | undefined
  if (id) {
    await loadQuoteById(id)
  }
})

/**
 * Handle open-docs event from QuoteFormPanel.
 * Opens the closing docs overlay directly — no save required.
 */
const showClosingDocs = ref(false)
const closingDocTab = ref('tc')

function handleOpenDocs() {
  showClosingDocs.value = true
  closingDocTab.value = 'tc'
}

function closeClosingDocs() {
  showClosingDocs.value = false
}

function exportClosingDoc() {
  printClosingDoc(closingDocTab.value)
}


/**
 * Dismiss the error message.
 */

// ─── Amortization Auto-Computation ──────────────────────────────────────────────

/**
 * Reactively compute monthly amortization for each term option.
 * Watches contractPrice, termOptions (downPayment, months), and trade-in values.
 * Updates are near-instant (pure math, no network call) — well within 300ms.
 */
watch(
  () => ({
    contractPrice: quoteState.contractPrice,
    termOptions: quoteState.termOptions.map((opt) => ({
      downPayment: opt.downPayment,
      months: opt.months,
    })),
    tradeInSum: quoteState.tradeIns.reduce((sum, ti) => sum + (ti.value || 0), 0),
  }),
  ({ contractPrice, termOptions, tradeInSum }) => {
    if (contractPrice == null) {
      // No contract price set — clear all amortization values
      quoteState.termOptions.forEach((opt) => {
        opt.monthlyAmortization = null
      })
      return
    }

    termOptions.forEach((term, index) => {
      const opt = quoteState.termOptions[index]
      if (!opt) return

      const result = computeAmortization(
        contractPrice,
        term.downPayment,
        tradeInSum,
        term.months
      )

      opt.monthlyAmortization =
        result.value !== undefined ? result.value : null
    })
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="quote-builder-view">
    <!-- Loading state when loading an existing quote -->
    <div v-if="loadingQuote" class="quote-builder-view__loading">
      <p>Loading quote...</p>
    </div>

    <!-- Main content -->
    <div v-else class="quote-builder-view__layout">
      <!-- Mobile Tab Bar (Requirement 14.2: two-tab navigation for viewport < 768px) -->
      <div v-if="isMobile" class="mobile-tabs no-print">
        <button
          type="button"
          class="mobile-tabs__tab"
          :class="{ 'mobile-tabs__tab--active': activeTab === 'form' }"
          @click="switchTab('form')"
          aria-label="Show quote form"
        >
          Form
        </button>
        <button
          type="button"
          class="mobile-tabs__tab"
          :class="{ 'mobile-tabs__tab--active': activeTab === 'preview' }"
          @click="switchTab('preview')"
          aria-label="Show quote preview"
        >
          Preview
        </button>
      </div>

      <!-- Left panel: Form -->
      <div v-show="showForm" class="quote-builder-view__form">
        <QuoteFormPanel @save-pdf="() => printQuote(quoteState)" @open-docs="handleOpenDocs" />
      </div>

      <!-- Right panel: Preview -->
      <div v-show="showPreview" class="quote-builder-view__preview">
        <QuotePreviewPanel />
      </div>

      <!-- Fixed mobile "Save as PDF" button (Requirement 14.6) -->
      <button
        v-if="showMobilePdfButton"
        type="button"
        class="mobile-pdf-btn no-print"
        :disabled="isPrinting"
        @click="() => printQuote(quoteState)"
        aria-label="Save as PDF"
      >
        {{ isPrinting ? 'Printing...' : 'Save as PDF' }}
      </button>
    </div>

    <!-- ═══ Closing Documents Overlay ═══ -->
    <div v-if="showClosingDocs" class="closing-overlay">
      <div class="closing-overlay__bar no-print">
        <div class="closing-overlay__tabs">
          <button :class="['co-tab', (closingDocTab === 'tc' || closingDocTab === 'terms-conditions') && 'co-tab--active']" @click="closingDocTab = 'tc'">Terms &amp; Conditions</button>
          <button :class="['co-tab', (closingDocTab === 'di' || closingDocTab === 'delivery-instructions') && 'co-tab--active']" @click="closingDocTab = 'di'">Delivery Instructions</button>
          <button :class="['co-tab', (closingDocTab === 'wc' || closingDocTab === 'warranty-card') && 'co-tab--active']" @click="closingDocTab = 'wc'">Warranty Certificate</button>
          <button :class="['co-tab', closingDocTab === 'cac' && 'co-tab--active']" @click="closingDocTab = 'cac'">Customer Acceptance</button>
          <button :class="['co-tab', closingDocTab === 'pdc' && 'co-tab--active']" @click="closingDocTab = 'pdc'">PDC Schedule</button>
          <button :class="['co-tab', (closingDocTab === 'pull' || closingDocTab === 'pullout') && 'co-tab--active']" @click="closingDocTab = 'pull'">Trade-in Pullout</button>
        </div>
        <div class="closing-overlay__actions">
          <button class="co-btn co-btn--edit" @click="showDocsPrompt = true">
            ✏️ Edit Details
          </button>
          <button class="co-btn co-btn--export" @click="exportClosingDoc" :disabled="isPrinting">
            💾 {{ isPrinting ? 'Exporting...' : 'Save as PDF' }}
          </button>
          <button class="co-btn co-btn--close" @click="closeClosingDocs">
            Close
          </button>
        </div>
      </div>
      <div class="closing-overlay__body">
        <ClosingDocPaper
          :docType="closingDocTab"
          :quoteState="quoteState"
          :promptDetails="promptDetails"
        />
      </div>
    </div>

    <!-- Closing Docs Prompt Modal -->
    <ClosingDocsPrompt
      :open="showDocsPrompt"
      :company="quoteState.company"
      :address="quoteState.address"
      :clientName="quoteState.clientName"
      :clientContact="quoteState.contact"
      :clientConforme="quoteState.clientConforme"
      :aeName="quoteState.aeName"
      :tradeInDescriptions="quoteState.tradeIns.map(t => t.description)"
      @close="showDocsPrompt = false"
      @confirm="handleDocsConfirm"
    />
  </div>
</template>

<style scoped>
.quote-builder-view {
  height: calc(100vh - var(--nav-height));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 100vw;
}

.quote-builder-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  background: var(--color-white);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.quote-builder-view__toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.quote-builder-view__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-800);
}

.quote-builder-view__toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.quote-builder-view__save-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  min-height: 44px;
  min-width: 44px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.quote-builder-view__save-btn:hover:not(:disabled) {
  background: var(--color-primary-dark, #1d4ed8);
}

.quote-builder-view__save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quote-builder-view__save-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Notifications ──────────────────────────────────────────────────────────── */

.quote-builder-view__notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  margin: 0;
  flex-shrink: 0;
}

.quote-builder-view__notification--error {
  background: var(--color-error-light, #fef2f2);
  border-bottom: 1px solid var(--color-error, #ef4444);
  color: var(--color-error, #ef4444);
}

.quote-builder-view__notification--success {
  background: var(--color-success-light, #f0fdf4);
  border-bottom: 1px solid var(--color-success, #22c55e);
  color: var(--color-success, #22c55e);
}

.quote-builder-view__notification-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.quote-builder-view__notification-dismiss {
  padding: var(--space-1) var(--space-2);
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: inherit;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  line-height: 1;
}

.quote-builder-view__notification-dismiss:hover {
  opacity: 0.7;
}

/* ─── Loading State ──────────────────────────────────────────────────────────── */

.quote-builder-view__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-gray-500);
  font-size: var(--font-size-base);
}

/* ─── Layout (Form + Preview) ────────────────────────────────────────────────── */

.quote-builder-view__layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Desktop: fixed form panel + fluid preview panel */
@media screen and (min-width: 768px) {
  .quote-builder-view__layout {
    flex-direction: row;
  }

  .quote-builder-view__form {
    width: 320px;
    min-width: 280px;
    flex-shrink: 0;
    border-right: 1px solid var(--border-color);
  }

  .quote-builder-view__preview {
    flex: 1;
    min-width: 0;
    width: auto;
  }
}

.quote-builder-view__form {
  height: 100%;
  overflow-y: auto;
}

.quote-builder-view__preview {
  height: 100%;
  overflow-y: auto;
}

/* Mobile: stack panels vertically, full height for each */
@media screen and (max-width: 767px) {
  .quote-builder-view {
    height: calc(100vh - var(--nav-height));
    overflow: hidden;
  }

  .quote-builder-view__layout {
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .quote-builder-view__form {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    /* Extra bottom padding when form is shown on mobile to avoid content being cut off */
    padding-bottom: var(--space-4);
  }

  .quote-builder-view__preview {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    /* Extra bottom padding to clear the fixed PDF button */
    padding-bottom: 72px;
  }
}

/* ─── Mobile Tab Bar (Requirement 14.2) ──────────────────────────────────────── */

.mobile-tabs {
  display: flex;
  flex-shrink: 0;
  background: var(--color-white);
  border-bottom: 1px solid var(--border-color);
}

.mobile-tabs__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  min-width: 44px;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-gray-500);
  background: var(--color-white);
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.mobile-tabs__tab:hover {
  color: var(--color-gray-700);
}

.mobile-tabs__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

/* ─── Fixed Mobile PDF Button (Requirement 14.6) ─────────────────────────────── */

.mobile-pdf-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  min-height: 56px;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-top: 1px solid var(--color-primary-hover);
  cursor: pointer;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.mobile-pdf-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.mobile-pdf-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ═══ Closing Documents Overlay ═══ */
.closing-overlay {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
  background: #cccccc;
  display: flex;
  flex-direction: column;
}

.closing-overlay__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #802820;
  border-bottom: 2px solid #561812;
  color: #fff;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.closing-overlay__tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.co-tab {
  padding: 7px 13px;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #c0392b;
  color: #fff;
  transition: all 0.2s;
}

.co-tab:hover {
  background: #a93226;
}

.co-tab--active {
  background: #7b241c !important;
  border-color: #e74c3c;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}

.closing-overlay__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  align-items: center;
}

.co-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.co-btn--edit {
  background: #c0392b;
  color: #fff;
  border: 1px solid #e74c3c;
}

.co-btn--edit:hover {
  background: #a93226;
}

.co-btn--export {
  background: #c0392b;
  color: #fff;
  border: 1px solid #e74c3c;
}

.co-btn--export:hover {
  background: #a93226;
}

.co-btn--close {
  background: #444;
  color: #fff;
}

.co-btn--close:hover {
  background: #222;
}

.closing-overlay__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

@media print {
  .closing-overlay {
    position: static !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    width: 100% !important;
    height: auto !important;
  }

  .closing-overlay__bar {
    display: none !important;
  }

  .closing-overlay__body {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }
}
</style>
