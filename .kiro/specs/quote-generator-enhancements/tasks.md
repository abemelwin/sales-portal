# Implementation Plan: Quote Generator Enhancements

## Overview

This plan implements 18 enhancements to achieve full parity with the original ESPMI Sales Portal. The implementation extends the existing `QuoteBuilderState`, adds new form sections to `QuoteFormPanel.vue`, enhances `QuotePreviewPanel.vue` with new preview elements, creates a `useQuoteValidation.ts` composable, enhances `MachineSelector.vue` with sub-model selection, and extends the state mapper for persistence. Property-based tests validate correctness properties defined in the design.

## Tasks

- [x] 1. Extend core types and state interface
  - [x] 1.1 Add `ToggleableItem` interface to `src/types/index.ts`
    - Define the `ToggleableItem` interface with `id`, `description`, `enabled`, `isCustom`, `sortOrder` properties
    - Export it from the types barrel file
    - _Requirements: 9.1, 10.1, 11.1_

  - [x] 1.2 Extend `QuoteBuilderState` interface and defaults in `src/composables/useQuoteBuilder.ts`
    - Add all new properties to the interface: `email`, `quoteDate`, `salutation`, `openingLine`, `selectedSubModel`, `imageKey`, `inclusionItems`, `exclusionItems`, `addonItems`, `includeDelivery`, `includeComputerSet`, `computerSetSpec`, `hasComputerSetOption`, `warrantyCompany`, `warrantySupplier`, `warrantyMachineDuration`, `warrantyPrintheadDuration`, `validationErrors`
    - Set defaults: `quoteDate` to today's ISO string, `salutation` to "Dear Ma'am / Sir,", `openingLine` to standard intro text, toggles to `false`, arrays to `[]`, strings to `''`
    - Import `ToggleableItem` type
    - _Requirements: 1.2, 2.2, 2.4, 3.1, 3.2, 4.1, 4.2, 5.3, 6.3, 7.2, 8.3, 8.4, 9.1, 10.1, 11.1, 12.2, 13.4_

- [x] 2. Create validation composable
  - [x] 2.1 Create `src/composables/useQuoteValidation.ts`
    - Implement `validateQuote(state: QuoteBuilderState): ValidationResult` as a pure function
    - Check: `machineId` non-null, `contractPrice` > 0, `clientName` non-empty after trim, `dealType` non-null
    - Return `{ isValid: boolean, errors: string[] }` with specific error messages per missing field
    - Export `ValidationResult` interface and `validateQuote` function
    - _Requirements: 13.2, 13.4, 16.1, 16.2, 16.4_

  - [ ]* 2.2 Write property tests for validation (Property 1: Validation detects all missing required fields)
    - Install `fast-check` as a dev dependency
    - Create `src/composables/__tests__/useQuoteValidation.spec.ts`
    - **Property 1: Validation detects all missing required fields**
    - Generate random `QuoteBuilderState` variants with missing/invalid fields, verify matching error messages
    - **Validates: Requirements 13.2, 13.4, 16.1, 16.2, 16.4**

  - [ ]* 2.3 Write property test for validation passes (Property 2: Validation passes when all required fields are valid)
    - **Property 2: Validation passes when all required fields are valid**
    - Generate states with all required fields valid, verify `isValid: true` and empty errors
    - **Validates: Requirements 13.3, 16.3**

- [x] 3. Create date formatting utility
  - [x] 3.1 Add `formatQuoteDate` function to `src/utils/quote-calculations.ts`
    - Implement ISO date string (YYYY-MM-DD) to "Month Day, Year" formatting (e.g., "August 11, 2026")
    - Handle edge cases: invalid input returns empty string
    - _Requirements: 18.1, 18.2_

  - [ ]* 3.2 Write property test for date formatting (Property 7: Date formatting correctness)
    - **Property 7: Date formatting correctness**
    - Generate random valid ISO date strings, verify output format matches "[Full Month Name] [Day], [Year]"
    - **Validates: Requirements 18.1, 18.2**

- [x] 4. Implement toggleable items logic and helpers
  - [x] 4.1 Add catalog-to-toggleable mapping helpers in `src/utils/quote-calculations.ts`
    - Implement `mapInclusionsToToggleable(inclusions: MachineInclusion[]): ToggleableItem[]` — defaults `enabled: true`
    - Implement `mapExclusionsToToggleable(exclusions: MachineExclusion[]): ToggleableItem[]` — defaults `enabled: true`
    - Implement `mapAddonsToToggleable(addons: MachineAddon[]): ToggleableItem[]` — defaults `enabled: false`
    - Implement `addCustomItem(items: ToggleableItem[], description: string): ToggleableItem[]`
    - Implement `removeCustomItem(items: ToggleableItem[], id: string): ToggleableItem[]`
    - _Requirements: 9.1, 9.6, 9.7, 10.1, 10.6, 10.7, 11.1_

  - [ ]* 4.2 Write property test for toggle filtering (Property 3: Toggleable item filtering preserves only enabled items in order)
    - **Property 3: Toggleable item filtering preserves only enabled items in order**
    - Generate random `ToggleableItem[]` with arbitrary `enabled` states, filter, verify output matches
    - **Validates: Requirements 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 11.2, 11.3**

  - [ ]* 4.3 Write property test for custom item addition (Property 5: Custom item addition preserves existing items)
    - **Property 5: Custom item addition preserves existing items**
    - Generate random existing list + random description, add custom item, verify all originals unchanged + new item present with `isCustom: true, enabled: true`
    - **Validates: Requirements 9.6, 10.6**

- [x] 5. Implement delivery and computer set toggle logic
  - [x] 5.1 Add delivery and computer set computed helpers in `src/utils/quote-calculations.ts`
    - Implement `getDisplayedInclusions(state: QuoteBuilderState): ToggleableItem[]` — filters enabled items, adds delivery item when `includeDelivery` is true, adds computer set item when `includeComputerSet` is true with spec text
    - Implement `getDisplayedExclusions(state: QuoteBuilderState): ToggleableItem[]` — filters enabled items, includes delivery in exclusions when `includeDelivery` is false
    - _Requirements: 7.3, 7.4, 7.5, 8.3, 8.4_

  - [ ]* 5.2 Write property test for delivery toggle (Property 4: Delivery toggle exclusive placement)
    - **Property 4: Delivery toggle exclusive placement**
    - Generate random quote states with random `includeDelivery` boolean, verify delivery appears in correct list and not the other
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Enhance MachineSelector with sub-model dropdown
  - [x] 7.1 Refactor `src/components/quote/MachineSelector.vue` to split model/sub-model selection
    - Add computed `uniqueModels` — unique model names for selected brand
    - Add computed `subModels` — sub_model values for selected brand+model
    - Add computed `showSubModelDropdown` — true when `subModels.length > 1`
    - Add sub-model dropdown UI (conditionally rendered)
    - Reset sub-model when model changes
    - Populate `state.selectedSubModel` on selection
    - On machine selection, populate `state.imageKey` from catalog `image_key`
    - On machine selection, populate `state.hasComputerSetOption` from catalog data
    - On machine selection, populate `state.warrantyMachineDuration` and `state.warrantyPrintheadDuration` from catalog
    - Map catalog inclusions/exclusions/addons to `ToggleableItem[]` arrays in state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 14.1_

  - [x] 7.2 Add unit condition override dropdown in MachineSelector
    - Add a "Unit Condition" dropdown with options: "Brand New", "Re-certified", "Demo Unit"
    - Pre-populate with catalog value when machine is selected
    - Bind to `state.unitCondition` on change
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Enhance QuoteFormPanel with new client info fields
  - [x] 8.1 Add email, date, salutation, and opening line fields to `src/components/quote/QuoteFormPanel.vue`
    - Add "Email" text input in Client Information grid alongside Contact field, bound to `state.email`
    - Add date picker input labeled "Date" in Client Information grid, bound to `state.quoteDate`
    - Add "Salutation" text input below Client Information with default, bound to `state.salutation`
    - Add "Opening Line" textarea below Salutation with default, bound to `state.openingLine`
    - _Requirements: 1.1, 1.4, 2.1, 3.1, 4.1_

- [x] 9. Enhance QuoteFormPanel with package option toggles
  - [x] 9.1 Add delivery and computer set toggles to QuoteFormPanel
    - Add "Include Delivery in Package Inclusions" checkbox with helper text, bound to `state.includeDelivery`
    - Add "Include Computer Set in Package" checkbox (conditional on `state.hasComputerSetOption`), bound to `state.includeComputerSet`
    - Add text input for computer set specs (conditional on `includeComputerSet` checked), bound to `state.computerSetSpec`
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.5_

  - [x] 9.2 Add toggleable inclusions list to QuoteFormPanel
    - Render each `state.inclusionItems` as a checkbox item, bound to `item.enabled`
    - Add "+ Add Inclusion" button that shows a text input for custom inclusion description
    - On confirm, call `addCustomItem` and update `state.inclusionItems`
    - Add remove button for custom items (where `isCustom: true`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 9.3 Add toggleable exclusions list to QuoteFormPanel
    - Render each `state.exclusionItems` as a checkbox item, bound to `item.enabled`
    - Add "+ Add Exclusion" button that shows a text input for custom exclusion description
    - On confirm, call `addCustomItem` and update `state.exclusionItems`
    - Add remove button for custom items (where `isCustom: true`)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 9.4 Add toggleable add-ons list to QuoteFormPanel
    - Render each `state.addonItems` as a checkbox item (defaults unchecked), bound to `item.enabled`
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 10. Add warranty section and closing docs button to QuoteFormPanel
  - [x] 10.1 Add warranty section to QuoteFormPanel
    - Add "Warranty" section with "Company Name" dropdown (4 options from design) bound to `state.warrantyCompany`
    - Add "Supplier Name" text input defaulting to "ESPMI" bound to `state.warrantySupplier`
    - _Requirements: 12.1, 12.2_

  - [x] 10.2 Add "OPEN CLOSING DOCUMENTS" button with validation to QuoteFormPanel
    - Add button at bottom of form
    - On click, call `validateQuote(state)` from `useQuoteValidation`
    - If valid, navigate to closing documents route with quote context
    - If invalid, display red validation error box listing all errors
    - Make error box dismissible and reactive (updates as fields are corrected)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Enhance QuotePreviewPanel with new display sections
  - [x] 12.1 Add date, email, salutation, and opening line to `src/components/quote/QuotePreviewPanel.vue`
    - Render "Date: [formatted date]" in letterhead meta area using `formatQuoteDate`
    - Render email in client info block
    - Render salutation below client info (conditional: non-empty trimmed value)
    - Render opening line below salutation (conditional: non-empty trimmed value)
    - _Requirements: 1.3, 2.3, 3.3, 3.4, 4.3, 4.4, 18.1, 18.2, 18.3_

  - [ ]* 12.2 Write property test for conditional text display (Property 6: Conditional text field display)
    - **Property 6: Conditional text field display**
    - Generate random strings, apply trim check, verify render/omit decision matches
    - **Validates: Requirements 3.3, 3.4, 4.3, 4.4**

  - [x] 12.3 Add unit condition badge and machine image to QuotePreviewPanel
    - Render unit condition as colored uppercase badge: "BRAND NEW" green, "RE-CERTIFIED" red, "DEMO UNIT" orange/amber
    - Load machine image from Supabase Storage using `state.imageKey`
    - Implement two-column hero layout: image left (~70mm), features right
    - When no image, features take full width
    - Add `@error` handler for image load failures with placeholder fallback
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 17.1, 17.2, 17.3, 17.4_

  - [x] 12.4 Add filtered inclusions, exclusions, and add-ons display to QuotePreviewPanel
    - Use `getDisplayedInclusions` and `getDisplayedExclusions` computed helpers for rendering
    - Render only enabled items in inclusions/exclusions sections
    - Render add-ons with checkbox markers (checked/unchecked based on enabled state)
    - _Requirements: 9.2, 9.3, 10.2, 10.3, 11.2, 11.3, 11.4_

  - [x] 12.5 Add warranty clauses and closing text to QuotePreviewPanel
    - Render warranty section (conditional on `warrantyCompany` being set): machine warranty duration, printhead warranty (when applicable), service fee statement, confidentiality line with company name, void warranty line with supplier name
    - Render closing paragraph: "Trusting that the above quotation..."
    - Render "Very truly yours," above AE signature block
    - Render "Conforme:" above client signature block
    - Render "Signature over Printed Name" sub-labels below signature lines
    - _Requirements: 12.3, 12.4, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 13. Extend state persistence mapper
  - [x] 13.1 Extend `toQuotePayload` in `src/utils/quote-state-mapper.ts`
    - Add all new fields to payload: `email`, `quote_date`, `salutation`, `opening_line`, `unit_condition_override`, `include_delivery`, `include_computer_set`, `computer_set_spec`, `inclusion_toggles` (JSON), `exclusion_toggles` (JSON), `addon_toggles` (JSON), `warranty_company`, `warranty_supplier`
    - Serialize `ToggleableItem[]` arrays as JSON for toggle columns
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 7.3, 8.3, 9.1, 10.1, 11.1, 12.2_

  - [x] 13.2 Extend `restoreFromQuote` in `src/utils/quote-state-mapper.ts`
    - Restore all new fields from saved quote data
    - Deserialize JSONB columns back to `ToggleableItem[]` arrays
    - Set sensible defaults for missing fields (backward compatibility with existing quotes)
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 7.3, 8.3, 9.1, 10.1, 11.1, 12.2_

  - [x] 13.3 Update `QuotePayload` and `Quote` types in `src/types/index.ts` or `src/types/database.ts`
    - Add new column types to the `QuotePayload` interface
    - Add new column types to the `Quote` interface for restoration
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 7.3, 8.3, 9.1, 10.1, 11.1, 12.2_

- [x] 14. Add pre-PDF validation hook
  - [x] 14.1 Integrate validation into PDF export flow in `src/composables/useExportPDF.ts`
    - Before generating PDF, call `validateQuote(state)`
    - If invalid, set `state.validationErrors` and abort PDF generation
    - If valid, proceed with existing PDF export logic
    - _Requirements: 16.1, 16.2, 16.3, 16.5_

- [x] 15. Create database migration
  - [x] 15.1 Create Supabase migration file for new columns on `quotes` table
    - Add columns: `email` (text), `quote_date` (date), `salutation` (text), `opening_line` (text), `unit_condition_override` (text), `include_delivery` (boolean default false), `include_computer_set` (boolean default false), `computer_set_spec` (text), `inclusion_toggles` (jsonb), `exclusion_toggles` (jsonb), `addon_toggles` (jsonb), `warranty_company` (text), `warranty_supplier` (text)
    - All new columns nullable to preserve backward compatibility with existing rows
    - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.3, 7.3, 8.3, 9.1, 10.1, 11.1, 12.2_

- [ ] 16. Write remaining property tests
  - [ ]* 16.1 Write property test for amortization formula (Property 8: Amortization formula correctness)
    - **Property 8: Amortization formula correctness**
    - Generate random valid contract price > 0, down payment >= 0, trade-in sum >= 0, months > 0 where (downPayment + tradeInSum) < contractPrice
    - Verify result equals `Math.round(((contractPrice - downPayment - tradeInSum) / months) * 100) / 100`
    - **Validates: Requirements 16.1**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Vue 3 + TypeScript + Vite + Supabase
- `fast-check` library is used for property-based testing
- All new state fields default to empty/false values to ensure backward compatibility with existing quotes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.2", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.2", "4.3", "5.1"] },
    { "id": 3, "tasks": ["5.2", "7.1", "7.2", "13.3"] },
    { "id": 4, "tasks": ["8.1", "9.1", "9.2", "9.3", "9.4"] },
    { "id": 5, "tasks": ["10.1", "10.2", "12.1", "12.2"] },
    { "id": 6, "tasks": ["12.3", "12.4", "12.5"] },
    { "id": 7, "tasks": ["13.1", "13.2", "14.1"] },
    { "id": 8, "tasks": ["15.1", "16.1"] }
  ]
}
```
