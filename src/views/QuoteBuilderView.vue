<script setup lang="ts">
import { provide, watch, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuoteBuilder, QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import { useQuoteStore } from '@/stores/quotes'
import { computeAmortization } from '@/utils/quote-calculations'
import { toQuotePayload, restoreFromQuote } from '@/utils/quote-state-mapper'
import { useExportPDF } from '@/composables/useExportPDF'
import QuoteFormPanel from '@/components/quote/QuoteFormPanel.vue'
import QuotePreviewPanel from '@/components/quote/QuotePreviewPanel.vue'

const route = useRoute()
const router = useRouter()
const quoteStore = useQuoteStore()
const { printQuote, isPrinting } = useExportPDF()

// Create the shared quote builder state and provide it to child components
const quoteState = useQuoteBuilder()
provide(QUOTE_BUILDER_KEY, quoteState)

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
const saving = ref(false)

/** Whether a load operation is in progress */
const loadingQuote = ref(false)

/** Error message to display to the user */
const saveError = ref<string | null>(null)

/** Success message to display temporarily */
const saveSuccess = ref(false)

/** Whether this is an existing quote being edited */
const isEditing = computed(() => quoteId.value !== null)

// ─── Quote Loading (Requirement 5.17) ───────────────────────────────────────────

/**
 * Loads a quote by ID from Supabase and restores all field values
 * into the reactive form state.
 */
async function loadQuoteById(id: string): Promise<void> {
  loadingQuote.value = true
  saveError.value = null

  const result = await quoteStore.loadQuote(id)

  if (result.success && result.quote) {
    quoteId.value = result.quote.id
    restoreFromQuote(quoteState, result.quote)
  } else {
    saveError.value = result.error || 'Failed to load quote. Please try again.'
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

// ─── Quote Saving (Requirement 5.15, 5.16) ──────────────────────────────────────

/**
 * Saves or updates the current quote.
 * - New quotes are created via saveQuote
 * - Existing quotes are updated via updateQuote
 * On failure, retains all form data and shows error (Requirement 5.16).
 */
async function handleSave(): Promise<void> {
  saving.value = true
  saveError.value = null
  saveSuccess.value = false

  const payload = toQuotePayload(quoteState)

  let result: { success: boolean; quote?: any; error?: string }

  if (isEditing.value && quoteId.value) {
    // Update existing quote
    result = await quoteStore.updateQuote(quoteId.value, payload)
  } else {
    // Create new quote
    result = await quoteStore.saveQuote(payload)
  }

  if (result.success) {
    saveSuccess.value = true
    // If this was a new quote, update the route and local ID
    if (!isEditing.value && result.quote?.id) {
      quoteId.value = result.quote.id
      // Navigate to the edit URL without full reload
      router.replace({ name: 'quote-edit', params: { id: result.quote.id } })
    }
    // Clear success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } else {
    // Retain form data, show error (Requirement 5.16)
    saveError.value = result.error || 'Failed to save the quote. Please try again.'
  }

  saving.value = false
}

/**
 * Dismiss the error message.
 */
function dismissError(): void {
  saveError.value = null
}

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
    <!-- Save/Load Status Bar -->
    <div class="quote-builder-view__toolbar">
      <div class="quote-builder-view__toolbar-left">
        <h2 class="quote-builder-view__title">
          {{ isEditing ? 'Edit Quote' : 'New Quote' }}
        </h2>
      </div>
      <div class="quote-builder-view__toolbar-right">
        <button
          type="button"
          class="quote-builder-view__save-btn"
          :disabled="saving"
          @click="handleSave"
        >
          <span v-if="saving" class="quote-builder-view__save-spinner"></span>
          {{ saving ? 'Saving...' : (isEditing ? 'Update Quote' : 'Save Quote') }}
        </button>
      </div>
    </div>

    <!-- Error notification (Requirement 5.16: retain form data, show error) -->
    <div v-if="saveError" class="quote-builder-view__notification quote-builder-view__notification--error" role="alert">
      <span class="quote-builder-view__notification-text">{{ saveError }}</span>
      <button
        type="button"
        class="quote-builder-view__notification-dismiss"
        @click="dismissError"
        aria-label="Dismiss error"
      >
        &times;
      </button>
    </div>

    <!-- Success notification -->
    <div v-if="saveSuccess" class="quote-builder-view__notification quote-builder-view__notification--success" role="status">
      <span class="quote-builder-view__notification-text">Quote saved successfully.</span>
    </div>

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
        <QuoteFormPanel />
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
        @click="printQuote"
        aria-label="Save as PDF"
      >
        {{ isPrinting ? 'Printing...' : 'Save as PDF' }}
      </button>
    </div>
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
  padding: var(--space-3) var(--space-4);
  background: var(--color-white);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

@media screen and (min-width: 768px) {
  .quote-builder-view__toolbar {
    padding: var(--space-3) var(--space-6);
  }
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

/* Desktop: side-by-side panels (60/40 split) */
@media screen and (min-width: 768px) {
  .quote-builder-view__layout {
    flex-direction: row;
  }

  .quote-builder-view__form {
    width: 60%;
    border-right: 1px solid var(--border-color);
  }

  .quote-builder-view__preview {
    width: 40%;
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
</style>
