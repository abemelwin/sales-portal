/**
 * Application domain model interfaces.
 * These represent the shaped data used throughout the application,
 * often combining data from multiple database tables.
 */

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database'
export { AppErrorCode } from './errors'
export type { AppError } from './errors'

// ─── User Models ────────────────────────────────────────────────────────────────

export type Role = 'superadmin' | 'product_manager' | 'sales_admin_manager' | 'sales_admin_supervisor' | 'sales_admin_assistant' | 'area_sales_manager' | 'account_executive' | 'sales_assistant' | 'user'

export interface User {
  id: string
  user_id: string
  display_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserInput {
  username: string
  display_name: string
  password: string
  role: Role
}

// ─── Machine Models ─────────────────────────────────────────────────────────────

export type UnitCondition = 'Brand New' | 'Re-certified' | 'Demo Unit'
export type Letterhead = 'ES Print Media Inc.' | 'ACS / Alternative'

export interface MachineFeature {
  id: string
  machine_id: string
  description: string
  sort_order: number
}

export interface MachineConsumable {
  id: string
  machine_id: string
  item_name: string
  package_description: string | null
  default_price: number
  sort_order: number
}

export interface MachineInclusion {
  id: string
  machine_id: string
  description: string
  sort_order: number
}

export interface MachineExclusion {
  id: string
  machine_id: string
  description: string
  sort_order: number
}

export interface MachineAddon {
  id: string
  machine_id: string
  description: string
  sort_order: number
}

export interface Machine {
  id: string
  brand: string
  model: string
  sub_model: string | null
  unit_condition: UnitCondition
  letterhead: Letterhead
  image_key: string | null
  has_computer_set_option: boolean
  warranty_machine_duration: string | null
  warranty_printhead_duration: string | null
  srp: number
  lbp: number
  cash_price: number
  machine_warranty_months: number
  printhead_warranty: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  features: MachineFeature[]
  consumables: MachineConsumable[]
  inclusions: MachineInclusion[]
  exclusions: MachineExclusion[]
  addons: MachineAddon[]
}

export interface MachineInput {
  brand: string
  model: string
  sub_model?: string | null
  unit_condition: UnitCondition
  letterhead?: Letterhead
  features: Omit<MachineFeature, 'id' | 'machine_id'>[]
  consumables: Omit<MachineConsumable, 'id' | 'machine_id'>[]
  inclusions: Omit<MachineInclusion, 'id' | 'machine_id'>[]
  exclusions: Omit<MachineExclusion, 'id' | 'machine_id'>[]
  addons: Omit<MachineAddon, 'id' | 'machine_id'>[]
}

export interface MachineUpdate extends Partial<MachineInput> {
  is_active?: boolean
}

export interface MachineFilter {
  brand?: string
  model?: string
  unit_condition?: UnitCondition
  is_active?: boolean
}

// ─── Toggleable Item Model ───────────────────────────────────────────────────────

/** An item (inclusion, exclusion, or add-on) that can be toggled on/off per quote */
export interface ToggleableItem {
  id: string
  description: string
  enabled: boolean
  isCustom: boolean
  sortOrder: number
}

// ─── Product Info Models ────────────────────────────────────────────────────────

export interface ProductInfoLink {
  id: string
  machine_id: string
  display_name: string
  url: string
  document_type: string
  created_at: string
}

// ─── Quote Models ───────────────────────────────────────────────────────────────

export type DealType = 'Standard Cash' | 'Standard Terms' | 'Trade-In Cash' | 'Trade-In Terms'

export interface QuoteTermOption {
  id: string
  quote_id: string
  down_payment: number
  months: number
  monthly_amortization: number | null
  sort_order: number
}

export interface QuoteTradeIn {
  id: string
  quote_id: string
  description: string
  value: number
  sort_order: number
}

export interface QuoteConsumablePrice {
  id: string
  quote_id: string
  consumable_id: string
  custom_price: number
}

export interface Quote {
  id: string
  user_id: string
  machine_id: string | null
  client_name: string | null
  company: string | null
  address: string | null
  contact: string | null
  email: string | null
  quote_date: string | null
  salutation: string | null
  opening_line: string | null
  unit_condition_override: string | null
  deal_type: DealType | null
  contract_price: number | null
  vat_inclusive: boolean
  under_promo: boolean
  promo_validity: string | null
  include_delivery: boolean
  include_computer_set: boolean
  computer_set_spec: string | null
  inclusion_toggles: unknown[] | null
  exclusion_toggles: unknown[] | null
  addon_toggles: unknown[] | null
  warranty_company: string | null
  warranty_supplier: string | null
  availability: string | null
  collection_payment: string | null
  collection_downpayment: string | null
  collection_amortization: string | null
  ae_name: string | null
  client_conforme: string | null
  noted_by_name: string | null
  noted_by_role: string | null
  letterhead: string | null
  freebies: unknown[]
  created_at: string
  updated_at: string
  term_options: QuoteTermOption[]
  trade_ins: QuoteTradeIn[]
  consumable_prices: QuoteConsumablePrice[]
}

export interface QuotePayload {
  machine_id?: string | null
  client_name?: string | null
  company?: string | null
  address?: string | null
  contact?: string | null
  email?: string | null
  quote_date?: string | null
  salutation?: string | null
  opening_line?: string | null
  unit_condition_override?: string | null
  deal_type?: DealType | null
  contract_price?: number | null
  vat_inclusive?: boolean
  under_promo?: boolean
  promo_validity?: string | null
  include_delivery?: boolean
  include_computer_set?: boolean
  computer_set_spec?: string | null
  inclusion_toggles?: unknown[] | null
  exclusion_toggles?: unknown[] | null
  addon_toggles?: unknown[] | null
  warranty_company?: string | null
  warranty_supplier?: string | null
  availability?: string | null
  collection_payment?: string | null
  collection_downpayment?: string | null
  collection_amortization?: string | null
  ae_name?: string | null
  client_conforme?: string | null
  noted_by_name?: string | null
  noted_by_role?: string | null
  letterhead?: string | null
  freebies?: unknown[]
  term_options?: Omit<QuoteTermOption, 'id' | 'quote_id'>[]
  trade_ins?: Omit<QuoteTradeIn, 'id' | 'quote_id'>[]
  consumable_prices?: Omit<QuoteConsumablePrice, 'id' | 'quote_id'>[]
}

// ─── Migration Models ───────────────────────────────────────────────────────────

export type MigrationStatusType = 'in_progress' | 'completed' | 'failed'

export interface MigrationRecord {
  id: string
  migrated_by: string
  records_found: number
  records_migrated: number
  records_skipped: number
  skipped_details: unknown[]
  status: MigrationStatusType
  error_message: string | null
  started_at: string
  completed_at: string | null
}

// ─── Import Models ──────────────────────────────────────────────────────────────

export interface ImportResult {
  added: number
  updated: number
  skipped: number
  errors: string[]
}

// ─── Pricelist Models ───────────────────────────────────────────────────────────

export interface PricelistRow {
  id: string
  brand: string
  model: string
  sub_model: string | null
  srp: number
  lbp: number
  cash_price: number
  machine_warranty_months: number
  printhead_warranty: string | null
}
