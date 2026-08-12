import { reactive, type InjectionKey } from 'vue'
import type {
  DealType,
  Letterhead,
  MachineFeature,
  MachineConsumable,
  MachineInclusion,
  MachineExclusion,
  MachineAddon,
  ToggleableItem,
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

  // Client info additions (Req 1–4)
  email: string
  quoteDate: string
  salutation: string
  openingLine: string

  // Machine section (Req 5–6, 14)
  selectedSubModel: string
  imageKey: string | null

  // Toggleable package items (Req 7–11)
  inclusionItems: ToggleableItem[]
  exclusionItems: ToggleableItem[]
  addonItems: ToggleableItem[]
  includeDelivery: boolean
  includeComputerSet: boolean
  computerSetSpec: string
  hasComputerSetOption: boolean

  // Warranty (Req 12)
  warrantyCompany: string
  warrantySupplier: string
  warrantyMachineDuration: string
  warrantyPrintheadDuration: string

  // Validation (Req 13, 16)
  validationErrors: string[]
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

    // Client info additions
    email: '',
    quoteDate: new Date().toISOString().slice(0, 10),
    salutation: 'Dear Ma\'am / Sir,',
    openingLine: 'Thank you for your interest in our products and services. Below is our quote as per your inquiry:',

    // Machine section
    selectedSubModel: '',
    imageKey: null,

    // Toggleable package items
    inclusionItems: [],
    exclusionItems: [],
    addonItems: [],
    includeDelivery: false,
    includeComputerSet: false,
    computerSetSpec: '',
    hasComputerSetOption: false,

    // Warranty
    warrantyCompany: '',
    warrantySupplier: 'ESPMI',
    warrantyMachineDuration: '',
    warrantyPrintheadDuration: '',

    // Validation
    validationErrors: [],
  })
}
