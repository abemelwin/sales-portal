import { ref } from 'vue'
import { validateQuote } from './useQuoteValidation'
import type { QuoteBuilderState } from './useQuoteBuilder'

/**
 * Composable for PDF export via browser print dialog.
 *
 * Handles:
 * - Adding `printing-mode` class to body to reset mobile transforms
 * - Triggering window.print() with A4 pre-configuration
 * - Removing the class after print dialog closes
 * - Error notification when print is blocked
 *
 * Requirements: 6.1, 6.2, 6.3, 6.6, 6.8
 */
export function useExportPDF() {
  /** Whether a print operation is currently in progress */
  const isPrinting = ref(false)

  /** Error message if print was blocked or failed */
  const printError = ref<string | null>(null)

  /**
   * Prepares the document for printing by:
   * 1. Adding `printing-mode` class to body (triggers CSS that removes transforms)
   * 2. Optionally setting the active closing doc type for targeted printing
   */
  function preparePrint(closingDocType?: string): void {
    document.body.classList.add('printing-mode')

    if (closingDocType) {
      document.body.setAttribute('data-print-doc', closingDocType)
    }
  }

  /**
   * Cleans up after printing:
   * - Removes `printing-mode` class
   * - Removes data-print-doc attribute
   */
  function cleanupPrint(): void {
    document.body.classList.remove('printing-mode')
    document.body.removeAttribute('data-print-doc')
  }

  /**
   * Triggers the browser's print dialog for the quote preview.
   * The CSS @media print rules hide the form panel and show only the A4 preview.
   *
   * On mobile, the `printing-mode` class ensures the viewport scaling transform
   * is removed so the paper renders at full 210mm x 297mm dimensions.
   *
   * When a `state` object is provided, the quote is validated before printing.
   * If validation fails, `state.validationErrors` is populated and the print is
   * aborted. If validation passes, `state.validationErrors` is cleared before
   * proceeding.
   *
   * Requirement 6.1: Trigger browser print dialog pre-configured for A4.
   * Requirement 6.3: Render at correct print dimensions regardless of viewport width.
   * Requirement 16.1: Validate required fields before PDF generation.
   * Requirement 16.2: Populate validationErrors and abort if invalid.
   * Requirement 16.3: Proceed with generation when all required fields are valid.
   * Requirement 16.5: Clear validation errors once all issues are resolved.
   */
  async function printQuote(state?: QuoteBuilderState): Promise<void> {
    if (isPrinting.value) return

    // Run validation when state is provided (Req 16.1)
    if (state) {
      const result = validateQuote(state)
      if (!result.isValid) {
        // Abort and surface errors to the UI (Req 16.2)
        state.validationErrors = result.errors
        return
      }
      // All required fields valid — clear any stale errors (Req 16.5)
      state.validationErrors = []
    }

    isPrinting.value = true
    printError.value = null

    try {
      preparePrint()

      // Allow the DOM to repaint with printing-mode applied
      await nextFrame()

      window.print()
    } catch (error) {
      // Requirement 6.8: Show error if print dialog is blocked
      printError.value =
        'Export failed. Please check your browser popup/print settings and try again.'
    } finally {
      cleanupPrint()
      isPrinting.value = false
    }
  }

  /**
   * Triggers the browser's print dialog for a specific closing document.
   * Only the active closing document tab content is printed.
   *
   * Sets `data-print-doc` attribute on the body so CSS can hide all content
   * except the active closing document panel + letterhead. The attribute value
   * matches a ClosingDocTab id (e.g., 'terms-conditions', 'cac', 'pdc').
   *
   * Requirement 8.4: Print the active closing document as a standalone A4 PDF.
   * Requirement 8.5: Embed correct letterhead matching quote's letterhead selection.
   *
   * @param docType - The closing document tab identifier (e.g., 'terms-conditions', 'delivery-instructions', 'warranty-card', 'cac', 'pdc', 'pullout')
   */
  async function printClosingDoc(docType: string): Promise<void> {
    if (isPrinting.value) return

    isPrinting.value = true
    printError.value = null

    try {
      preparePrint(docType)

      // Allow the DOM to repaint with printing-mode applied
      await nextFrame()

      window.print()
    } catch (error) {
      // Requirement 6.8: Show error if print dialog is blocked
      printError.value =
        'Export failed. Please check your browser popup/print settings and try again.'
    } finally {
      cleanupPrint()
      isPrinting.value = false
    }
  }

  /**
   * Dismiss the current print error notification.
   */
  function dismissPrintError(): void {
    printError.value = null
  }

  return {
    isPrinting,
    printError,
    printQuote,
    printClosingDoc,
    dismissPrintError,
  }
}

/**
 * Returns a promise that resolves after the next animation frame.
 * Used to ensure CSS class changes are rendered before triggering print.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}
