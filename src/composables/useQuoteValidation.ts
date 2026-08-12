import type { QuoteBuilderState } from './useQuoteBuilder'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates a quote for completeness before PDF generation or closing docs navigation.
 * Pure function — no side effects.
 */
export function validateQuote(state: QuoteBuilderState): ValidationResult {
  const errors: string[] = []

  if (!state.machineId) {
    errors.push('No machine selected')
  }
  if (state.contractPrice == null || state.contractPrice <= 0) {
    errors.push('No contract price entered')
  }
  if (!state.clientName?.trim()) {
    errors.push('No client name')
  }
  if (!state.dealType) {
    errors.push('No deal type selected')
  }

  return { isValid: errors.length === 0, errors }
}
