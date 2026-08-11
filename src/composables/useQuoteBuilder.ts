import { reactive, type InjectionKey } from 'vue'
import type {
  DealType,
  Letterhead,
  MachineFeature,
  MachineConsumable,
  MachineInclusion,
  MachineExclusion,
  MachineAddon,
} from '@/types'

/**
 * Represents the reactive state of the Quote Builder form.
 * Shared between QuoteFormPanel and QuotePreviewPanel via provide/inject.
 */
export interface QuoteBuilderState {
  // Machine selection
  selectedBrand: string
  selectedModel: string
  machineId: string | null
  unitCondition: string | null
  letterhead: Letterhead

  // Populated from catalog
  features: MachineFeature[]
  consumables: MachineConsumable[]
  inclusions: MachineInclusion[]
  exclusions: MachineExclusion[]
  addons: MachineAddon[]

  // Client info
  clientName: string
  company: string
  address: string
  contact: string

  // Pricing
  contractPrice: number | null
  dealType: DealType | null
  vatInclusive: boolean
  underPromo: boolean
  promoValidity: string
  freebies: string[]

  // Term options
  termOptions: {
    downPayment: number
    months: number
    monthlyAmortization: number | null
  }[]

  // Trade-ins
  tradeIns: {
    description: string
    value: number
  }[]

  // Consumable custom prices
  consumablePrices: {
    consumableId: string
    customPrice: number
  }[]

  // Collection arrangements
  availability: string
  collectionPayment: string
  collectionDownpayment: string
  collectionAmortization: string

  // Signatories
  aeName: string
  clientConforme: string
  notedByName: string
  notedByRole: string

  // Error state
  catalogError: string | null
}

export const QUOTE_BUILDER_KEY: InjectionKey<QuoteBuilderState> = Symbol('quoteBuilder')

/**
 * Creates a new reactive QuoteBuilderState with default values.
 */
export function useQuoteBuilder(): QuoteBuilderState {
  return reactive<QuoteBuilderState>({
    // Machine selection
    selectedBrand: '',
    selectedModel: '',
    machineId: null,
    unitCondition: null,
    letterhead: 'ES Print Media Inc.',

    // Populated from catalog
    features: [],
    consumables: [],
    inclusions: [],
    exclusions: [],
    addons: [],

    // Client info
    clientName: '',
    company: '',
    address: '',
    contact: '',

    // Pricing
    contractPrice: null,
    dealType: null,
    vatInclusive: false,
    underPromo: false,
    promoValidity: '',
    freebies: [],

    // Term options (start with 1)
    termOptions: [{ downPayment: 0, months: 1, monthlyAmortization: null }],

    // Trade-ins
    tradeIns: [],

    // Consumable custom prices
    consumablePrices: [],

    // Collection arrangements
    availability: '',
    collectionPayment: '',
    collectionDownpayment: '',
    collectionAmortization: '',

    // Signatories
    aeName: '',
    clientConforme: '',
    notedByName: '',
    notedByRole: '',

    // Error state
    catalogError: null,
  })
}
