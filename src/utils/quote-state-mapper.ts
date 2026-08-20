/**
 * Conversion utilities between QuoteBuilderState (reactive form) and
 * QuotePayload / Quote (database representations).
 *
 * - toQuotePayload: form state → payload for save/update to Supabase
 * - restoreFromQuote: loaded Quote → populates reactive form state
 */

import type { QuoteBuilderState } from '@/composables/useQuoteBuilder'
import type { Quote, QuotePayload, DealType, Letterhead, ToggleableItem } from '@/types'

/**
 * Converts the reactive QuoteBuilderState into a QuotePayload
 * suitable for persisting to Supabase (Requirement 5.15).
 */
export function toQuotePayload(state: QuoteBuilderState): QuotePayload {
  return {
    machine_id: state.machineId || null,
    client_name: state.clientName || null,
    company: state.company || null,
    address: state.address || null,
    contact: state.contact || null,

    // Client info additions (Req 1–4)
    email: state.email || null,
    quote_date: state.quoteDate || null,
    salutation: state.salutation || null,
    opening_line: state.openingLine || null,

    // Machine condition override (Req 5)
    unit_condition_override: state.unitCondition || null,

    deal_type: state.dealType || null,
    contract_price: state.contractPrice ?? null,
    vat_inclusive: state.vatInclusive,
    under_promo: state.underPromo,
    promo_validity: state.promoValidity || null,

    // Delivery & computer set toggles (Req 7–8)
    include_delivery: state.includeDelivery,
    include_computer_set: state.includeComputerSet,
    computer_set_spec: state.computerSetSpec || null,

    // Toggleable item lists serialized as JSON arrays (Req 9–11)
    inclusion_toggles: state.inclusionItems.length > 0
      ? (JSON.parse(JSON.stringify(state.inclusionItems)) as unknown[])
      : [],
    exclusion_toggles: state.exclusionItems.length > 0
      ? (JSON.parse(JSON.stringify(state.exclusionItems)) as unknown[])
      : [],
    addon_toggles: state.addonItems.length > 0
      ? (JSON.parse(JSON.stringify(state.addonItems)) as unknown[])
      : [],

    // Warranty (Req 12)
    warranty_company: state.warrantyCompany || null,
    warranty_supplier: state.warrantySupplier || null,

    availability: state.availability || null,
    collection_payment: state.collectionPayment || null,
    collection_downpayment: state.collectionDownpayment || null,
    collection_amortization: state.collectionAmortization || null,
    ae_name: state.aeName || null,
    client_conforme: state.clientConforme || null,
    noted_by_name: state.notedByName || null,
    noted_by_role: state.notedByRole || null,
    letterhead: state.letterhead || null,
    freebies: state.freebies.length > 0 ? state.freebies : [],
    term_options: state.termOptions.map((opt, index) => ({
      down_payment: opt.downPayment,
      months: opt.months,
      monthly_amortization: opt.monthlyAmortization ?? null,
      sort_order: index,
    })),
    trade_ins: state.tradeIns.map((ti, index) => ({
      description: ti.description,
      value: ti.value,
      sort_order: index,
    })),
    consumable_prices: state.consumablePrices
      .filter((cp) => cp.consumableId && cp.customPrice >= 0)
      .map((cp) => ({
        consumable_id: cp.consumableId,
        custom_price: cp.customPrice,
      })),
  }
}

/**
 * Safely parses a value as a ToggleableItem array.
 * Accepts an already-parsed array (JSONB from Supabase) or a raw JSON string.
 * Returns an empty array if the value is null, undefined, or malformed.
 */
function parseToggleableItems(value: unknown): ToggleableItem[] {
  if (value == null) return []

  let parsed: unknown = value

  // Handle raw JSON strings (e.g., if stored as text rather than JSONB)
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed.filter(
    (item): item is ToggleableItem =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).id === 'string' &&
      typeof (item as Record<string, unknown>).description === 'string' &&
      typeof (item as Record<string, unknown>).enabled === 'boolean' &&
      typeof (item as Record<string, unknown>).isCustom === 'boolean',
  )
}

/**
 * Restores a QuoteBuilderState from a loaded Quote object (Requirement 5.17).
 * Mutates the provided reactive state in-place to match the saved quote data.
 */
export function restoreFromQuote(state: QuoteBuilderState, quote: Quote): void {
  // Machine selection
  state.machineId = quote.machine_id || null
  state.letterhead = (quote.letterhead as Letterhead) || 'ES Print Media Inc.'

  // Client info
  state.clientName = quote.client_name || ''
  state.company = quote.company || ''
  state.address = quote.address || ''
  state.contact = quote.contact || ''

  // Client info additions (Req 1–4)
  state.email = quote.email || ''
  state.quoteDate = quote.quote_date || new Date().toISOString().slice(0, 10)
  state.salutation = quote.salutation || "Dear Ma'am / Sir,"
  state.openingLine =
    quote.opening_line ||
    'Thank you for your interest in our products and services. Below is our quote as per your inquiry:'

  // Pricing
  state.contractPrice = quote.contract_price ?? null
  state.dealType = (quote.deal_type as DealType) || null
  state.vatInclusive = quote.vat_inclusive ?? false
  state.underPromo = quote.under_promo ?? false
  state.promoValidity = quote.promo_validity || ''
  state.freebies = Array.isArray(quote.freebies) ? (quote.freebies as string[]) : []

  // Machine condition override (Req 5)
  state.unitCondition = quote.unit_condition_override || null

  // Delivery and computer set toggles (Req 7–8)
  state.includeDelivery = quote.include_delivery ?? false
  state.includeComputerSet = quote.include_computer_set ?? false
  state.computerSetSpec = quote.computer_set_spec || ''

  // Toggleable package items (Req 9–11)
  state.inclusionItems = parseToggleableItems(quote.inclusion_toggles)
  state.exclusionItems = parseToggleableItems(quote.exclusion_toggles)
  state.addonItems = parseToggleableItems(quote.addon_toggles)

  // Warranty (Req 12)
  state.warrantyCompany = quote.warranty_company || ''
  state.warrantySupplier = quote.warranty_supplier || 'ESPMI'
  state.serviceFee = (quote as any).service_fee ?? null

  // Term options
  if (quote.term_options && quote.term_options.length > 0) {
    state.termOptions = quote.term_options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((opt) => ({
        dealType: 'Installment' as string,
        contractPrice: null as number | null,
        downPayment: opt.down_payment,
        months: opt.months,
        monthlyAmortization: opt.monthly_amortization ?? null,
      }))
  } else {
    state.termOptions = [{ dealType: "Installment", contractPrice: null, downPayment: 0, months: 1, monthlyAmortization: null }]
  }

  // Trade-ins
  if (quote.trade_ins && quote.trade_ins.length > 0) {
    state.tradeIns = quote.trade_ins
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ti) => ({
        description: ti.description,
        value: ti.value,
      }))
  } else {
    state.tradeIns = []
  }

  // Consumable prices
  if (quote.consumable_prices && quote.consumable_prices.length > 0) {
    state.consumablePrices = quote.consumable_prices.map((cp) => ({
      consumableId: cp.consumable_id,
      customPrice: cp.custom_price,
    }))
  } else {
    state.consumablePrices = []
  }

  // Collection arrangements
  state.availability = quote.availability || ''
  state.collectionPayment = quote.collection_payment || ''
  state.collectionDownpayment = quote.collection_downpayment || ''
  state.collectionAmortization = quote.collection_amortization || ''

  // Signatories
  state.aeName = quote.ae_name || ''
  state.clientConforme = quote.client_conforme || ''
  state.notedByName = quote.noted_by_name || ''
  state.notedByRole = quote.noted_by_role || ''
}
