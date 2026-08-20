/**
 * Shared data interface for all closing document tabs.
 * Each tab uses a subset of these fields.
 * All fields are strings to support flexible user editing.
 */
export interface ClosingDocData {
  // Common fields (pre-populated from quote)
  clientName: string
  company: string
  address: string
  contact: string
  machineModel: string
  contractPrice: string
  downPayment: string
  monthlyAmortization: string
  aeName: string
  clientConforme: string
  notedByName: string
  notedByRole: string

  // Terms & Conditions specific
  termsText: string

  // Delivery Instructions specific
  deliveryDate: string
  deliveryTime: string
  specialInstructions: string

  // Warranty Card specific
  serialNumber: string
  warrantyStartDate: string
  warrantyEndDate: string
  warrantyCoverage: string

  // CAC specific
  collectionDate: string
  collectionTime: string

  // PDC specific
  bankName: string
  checkNumbers: string
  numberOfChecks: string
  checkAmount: string

  // Pullout specific
  pulloutDate: string
  pulloutReason: string
  unitConditionAtPullout: string

  // Shared
  remarks: string
}

export type ClosingDocTab =
  | 'terms-conditions'
  | 'delivery-instructions'
  | 'warranty-card'
  | 'cac'
  | 'pdc'
  | 'pullout'

export interface ClosingDocTabConfig {
  id: ClosingDocTab
  label: string
}

export const CLOSING_DOC_TABS: ClosingDocTabConfig[] = [
  { id: 'terms-conditions', label: 'Terms & Conditions' },
  { id: 'delivery-instructions', label: 'Delivery Instructions' },
  { id: 'cac', label: 'CAC' },
  { id: 'pdc', label: 'PDC' },
  { id: 'pullout', label: 'Pullout' },
]

/**
 * Creates a blank ClosingDocData object with all fields as empty strings.
 */
export function createBlankClosingDocData(): ClosingDocData {
  return {
    clientName: '',
    company: '',
    address: '',
    contact: '',
    machineModel: '',
    contractPrice: '',
    downPayment: '',
    monthlyAmortization: '',
    aeName: '',
    clientConforme: '',
    notedByName: '',
    notedByRole: '',
    termsText: '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    serialNumber: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    warrantyCoverage: '',
    collectionDate: '',
    collectionTime: '',
    bankName: '',
    checkNumbers: '',
    numberOfChecks: '',
    checkAmount: '',
    pulloutDate: '',
    pulloutReason: '',
    unitConditionAtPullout: '',
    remarks: '',
  }
}
