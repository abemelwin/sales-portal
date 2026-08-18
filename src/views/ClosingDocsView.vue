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
    <!-- Header -->
    <header class="closing-docs-header no-print">
      <h1>Closing Documents</h1>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          @click="showDocsPrompt = true"
        >
          ✏️ Edit Details
        </button>
        <button
          class="btn btn-primary"
          @click="handleExport"
          :disabled="loading || isPrinting"
        >
          {{ isPrinting ? 'Exporting...' : 'Save as PDF' }}
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
        <ClosingDocPaper
          :docType="activeTab"
          :quoteState="currentQuote"
          :promptDetails="promptDetails"
        />
      </div>
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
