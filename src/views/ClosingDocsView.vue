<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuoteStore } from '@/stores/quotes'
import { useExportPDF } from '@/composables/useExportPDF'
import { ClosingDocPaper, CLOSING_DOC_TABS, type ClosingDocTab } from '@/components/closing'
import ClosingDocsPrompt from '@/components/quote/ClosingDocsPrompt.vue'

const route = useRoute()
const router = useRouter()
const quoteStore = useQuoteStore()
const { printClosingDoc, isPrinting, printError, dismissPrintError } = useExportPDF()

// Active tab
const activeTab = ref<ClosingDocTab>('terms-conditions')

// Details prompt modal state
const showDocsPrompt = ref(false)
const promptDetails = ref<any>(null)

function handleDocsConfirm(data: any) {
  promptDetails.value = data
  showDocsPrompt.value = false
}

// Loading and error states
const loading = ref(false)
const error = ref<string | null>(null)

// Whether this view is shown as a modal overlay or a standalone page
const isOpen = ref(true)

const currentQuote = computed(() => quoteStore.currentQuote)

/**
 * Close the closing docs view.
 */
function handleClose() {
  isOpen.value = false
  const quoteId = route.params.id as string
  router.push({ name: 'quote-edit', params: { id: quoteId } })
}

/**
 * Export/print the currently active document tab as PDF.
 */
function handleExport() {
  printClosingDoc(activeTab.value)
}

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
  } catch (err) {
    error.value = 'An unexpected error occurred while loading quote data.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="isOpen" class="closing-docs-view">
    <div class="closing-overlay__bar no-print">
      <div class="closing-overlay__tabs">
        <button
          v-for="tab in CLOSING_DOC_TABS"
          :key="tab.id"
          :class="['co-tab', { 'co-tab--active': activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="closing-overlay__actions">
        <button class="co-btn co-btn--edit" @click="showDocsPrompt = true">
          ✏️ Edit Details
        </button>
        <button class="co-btn co-btn--export" @click="handleExport" :disabled="loading || isPrinting">
          💾 {{ isPrinting ? 'Exporting...' : 'Save as PDF' }}
        </button>
        <button class="co-btn co-btn--close" @click="handleClose">
          Close
        </button>
      </div>
    </div>

    <!-- Print error notification -->
    <div v-if="printError" class="print-error-banner no-print" role="alert">
      <p>{{ printError }}</p>
      <button class="co-btn co-btn--close" @click="dismissPrintError">Dismiss</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading quote data...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="co-btn co-btn--close" @click="handleClose">Go Back</button>
    </div>

    <!-- Main content -->
    <div v-else class="closing-docs-content">
      <ClosingDocPaper
        :docType="activeTab"
        :quoteState="currentQuote"
        :promptDetails="promptDetails"
      />
    </div>

    <!-- Details Prompt Modal -->
    <ClosingDocsPrompt
      v-if="currentQuote"
      :open="showDocsPrompt"
      :company="currentQuote.company || ''"
      :address="currentQuote.address || ''"
      :clientName="currentQuote.client_name || ''"
      :clientContact="currentQuote.contact || ''"
      :clientConforme="currentQuote.client_conforme || ''"
      :aeName="currentQuote.ae_name || ''"
      :tradeInDescriptions="(currentQuote.trade_ins || []).map((t: any) => t.description || t.desc || '')"
      @close="showDocsPrompt = false"
      @confirm="handleDocsConfirm"
    />
  </div>
</template>

<style scoped>
.closing-docs-view {
  min-height: calc(100vh - var(--nav-height, 40px));
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

.closing-docs-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
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

@media print {
  .closing-docs-view {
    min-height: 0 !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .closing-overlay__bar {
    display: none !important;
  }

  .closing-docs-content {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }
}
</style>
