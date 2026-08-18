/**
 * Pure computation functions for quote pricing calculations.
 *
 * Implements the amortization formula per Requirement 5.3:
 * (contractPrice - downPayment - tradeInSum) / months, rounded to 2 decimal places.
 *
 * Implements validation guards per Requirement 5.4:
 * Returns error if months <= 0 or downPayment + tradeInSum >= contractPrice.
 */

import type { ToggleableItem, MachineInclusion, MachineExclusion, MachineAddon } from '@/types'
import type { QuoteBuilderState } from '@/composables/useQuoteBuilder'

export interface AmortizationSuccess {
  value: number
  error?: undefined
}

export interface AmortizationError {
  value?: undefined
  error: string
}

export type AmortizationResult = AmortizationSuccess | AmortizationError

/**
 * Computes the monthly amortization for a quote term option.
 *
 * Formula: (contractPrice - downPayment - tradeInSum) / months
 * Result is rounded to 2 decimal places.
 *
 * @param contractPrice - The total contract price
 * @param downPayment - The down payment amount
 * @param tradeInSum - The sum of all trade-in values
 * @param months - The number of months for amortization
 * @returns An object with either a `value` (number) or an `error` (string)
 */
export function computeAmortization(
  contractPrice: number,
  downPayment: number,
  tradeInSum: number,
  months: number
): AmortizationResult {
  if (months <= 0) {
    return { error: 'Number of months must be greater than zero' }
  }

  if (downPayment + tradeInSum >= contractPrice) {
    return { error: 'Down payment plus trade-in value equals or exceeds contract price' }
  }

  const value = Math.round(((contractPrice - downPayment - tradeInSum) / months) * 100) / 100
  return { value }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Formats an ISO date string (YYYY-MM-DD) to "Month Day, Year" format.
 * Returns empty string for invalid or empty input.
 */
export function formatQuoteDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return ''
  const year = parseInt(parts[0] ?? '', 10)
  const month = parseInt(parts[1] ?? '', 10)
  const day = parseInt(parts[2] ?? '', 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return ''
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

// ─── Catalog-to-Toggleable Mapping Helpers ──────────────────────────────────────

/**
 * Maps catalog inclusions to toggleable items (default enabled: true).
 * Requirements: 9.1, 10.1
 */
export function mapInclusionsToToggleable(inclusions: MachineInclusion[]): ToggleableItem[] {
  return inclusions.map((inc, i) => ({
    id: inc.id,
    description: inc.description,
    enabled: true,
    isCustom: false,
    sortOrder: i,
  }))
}

/**
 * Maps catalog exclusions to toggleable items (default enabled: true).
 * Requirements: 10.1
 */
export function mapExclusionsToToggleable(exclusions: MachineExclusion[]): ToggleableItem[] {
  return exclusions.map((exc, i) => ({
    id: exc.id,
    description: exc.description,
    enabled: true,
    isCustom: false,
    sortOrder: i,
  }))
}

/**
 * Maps catalog add-ons to toggleable items (default enabled: false — user opts in).
 * Requirements: 11.1
 */
export function mapAddonsToToggleable(addons: MachineAddon[]): ToggleableItem[] {
  return addons.map((addon, i) => ({
    id: addon.id,
    description: addon.description,
    enabled: false,
    isCustom: false,
    sortOrder: i,
  }))
}

/**
 * Adds a custom user-defined item to a toggleable list.
 * Returns a new array (does not mutate the original).
 * Requirements: 9.6, 10.6
 */
export function addCustomItem(items: ToggleableItem[], description: string): ToggleableItem[] {
  const maxSort = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) : -1
  return [
    ...items,
    {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description,
      enabled: true,
      isCustom: true,
      sortOrder: maxSort + 1,
    },
  ]
}

/**
 * Removes a custom item by id. Returns a new array.
 * Only removes items where isCustom is true.
 * Requirements: 9.7, 10.7
 */
export function removeCustomItem(items: ToggleableItem[], id: string): ToggleableItem[] {
  return items.filter(item => !(item.id === id && item.isCustom))
}

// ─── Delivery & Computer Set Display Helpers ────────────────────────────────────

/**
 * Returns the list of inclusions to display on the quote paper.
 * Filters to only enabled items, and conditionally adds delivery and computer set.
 * Requirements: 7.3, 7.5, 8.3
 */
export function getDisplayedInclusions(state: QuoteBuilderState): ToggleableItem[] {
  const items = state.inclusionItems.filter(item => item.enabled)
  if (state.includeDelivery) {
    const hasDelivery = items.some(item => /^\s*delivery/i.test(item.description))
    if (!hasDelivery) {
      items.unshift({
        id: 'delivery-toggle',
        description: 'Delivery and Installation',
        enabled: true,
        isCustom: false,
        sortOrder: -1,
      })
    }
  }
  if (state.includeComputerSet && state.computerSetSpec) {
    items.push({
      id: 'computer-set-toggle',
      description: `Computer Set (${state.computerSetSpec})`,
      enabled: true,
      isCustom: false,
      sortOrder: 998,
    })
  }
  return items
}

/**
 * Returns the list of exclusions to display on the quote paper.
 * Filters to only enabled items. Delivery appears here when NOT included in package.
 * Requirements: 7.4, 7.5
 */
export function getDisplayedExclusions(state: QuoteBuilderState): ToggleableItem[] {
  let items = state.exclusionItems.filter(item => item.enabled)
  if (state.includeDelivery) {
    items = items.filter(
      item =>
        !(
          /^\s*delivery/i.test(item.description) ||
          (/freight/i.test(item.description) && /installation/i.test(item.description))
        )
    )
  }
  return items
}
