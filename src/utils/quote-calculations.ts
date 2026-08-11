/**
 * Pure computation functions for quote pricing calculations.
 *
 * Implements the amortization formula per Requirement 5.3:
 * (contractPrice - downPayment - tradeInSum) / months, rounded to 2 decimal places.
 *
 * Implements validation guards per Requirement 5.4:
 * Returns error if months <= 0 or downPayment + tradeInSum >= contractPrice.
 */

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
