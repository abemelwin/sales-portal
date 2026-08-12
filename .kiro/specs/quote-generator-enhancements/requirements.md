# Requirements Document

## Introduction

This specification covers the missing features in the Vue 3 Quote Generator page that must be added to achieve full parity with the original ESPMI Sales Portal HTML application. The scope includes additional client info fields, machine section enhancements, toggleable package inclusions/exclusions/add-ons, delivery and computer set toggles, warranty section, validation logic, quote preview enhancements, and a closing documents navigation button.

## Glossary

- **Quote_Form**: The left-side panel (QuoteFormPanel.vue) where the sales user fills in quote details
- **Quote_Preview**: The right-side panel (QuotePreviewPanel.vue) that renders a live A4 paper preview of the quote
- **Quote_Builder_State**: The shared reactive state object (useQuoteBuilder.ts) injected into both panels
- **Machine_Selector**: The component (MachineSelector.vue) responsible for brand/model/sub-model selection and catalog data population
- **Catalog**: The Supabase-backed machine catalog containing features, consumables, inclusions, exclusions, add-ons, and image references
- **Inclusion_Item**: A package inclusion entry from the catalog or custom-added by the user, toggleable on/off per quote
- **Exclusion_Item**: A package exclusion entry from the catalog or custom-added by the user, toggleable on/off per quote
- **Addon_Item**: An optional add-on entry from the catalog, toggleable on/off per quote
- **Closing_Documents**: A separate page/view for generating closing documents related to a finalized quote
- **Validation_Engine**: Logic that checks required fields before allowing PDF generation or navigation to closing documents
- **Unit_Condition**: The condition label for a machine — "Brand New", "Re-certified", or "Demo Unit"
- **Warranty_Section**: A section on the quote paper displaying warranty terms, confidentiality clauses, and void-warranty lines

## Requirements

### Requirement 1: Separate Email Field

**User Story:** As a salesperson, I want a dedicated email input field separate from the phone contact field, so that I can record the client's email address independently.

#### Acceptance Criteria

1. THE Quote_Form SHALL display a separate "Email" text input field in the Client Information section
2. THE Quote_Builder_State SHALL store the email value in a dedicated `email` property
3. WHEN a valid email is entered, THE Quote_Preview SHALL display the email in the client information area of the quote paper
4. THE Quote_Form SHALL render the Email field alongside the existing Contact (phone) field in the form grid

---

### Requirement 2: Quote Date Field

**User Story:** As a salesperson, I want to set a quote date, so that the printed quotation shows when it was prepared.

#### Acceptance Criteria

1. THE Quote_Form SHALL display a date picker input labeled "Date" in the Client Information section
2. THE Quote_Builder_State SHALL store the quote date in a `quoteDate` property as a string (ISO date format)
3. WHEN a date is selected, THE Quote_Preview SHALL display the formatted date in the letterhead meta area (e.g., "Date: August 11, 2026")
4. THE Quote_Form SHALL default the date picker to today's date when a new quote is started

---

### Requirement 3: Salutation Field

**User Story:** As a salesperson, I want an editable salutation text, so that the quote paper addresses the client appropriately.

#### Acceptance Criteria

1. THE Quote_Form SHALL display an editable text input labeled "Salutation" with a default value of "Dear Ma'am / Sir,"
2. THE Quote_Builder_State SHALL store the salutation in a `salutation` property
3. WHEN a salutation value exists, THE Quote_Preview SHALL render the salutation text below the client information block on the quote paper
4. WHEN the salutation field is cleared, THE Quote_Preview SHALL omit the salutation line from the quote paper

---

### Requirement 4: Opening Line Field

**User Story:** As a salesperson, I want an editable opening line, so that the quote paper includes a professional introductory statement.

#### Acceptance Criteria

1. THE Quote_Form SHALL display an editable textarea labeled "Opening Line" with a default value of "Thank you for your interest in our products and services. Below is our quote as per your inquiry:"
2. THE Quote_Builder_State SHALL store the opening line in an `openingLine` property
3. WHEN an opening line value exists, THE Quote_Preview SHALL render the opening line text below the salutation on the quote paper
4. WHEN the opening line field is cleared, THE Quote_Preview SHALL omit the opening line from the quote paper

---

### Requirement 5: Unit Condition Override Dropdown

**User Story:** As a salesperson, I want to manually override the unit condition populated from the catalog, so that I can adjust the condition label for special scenarios.

#### Acceptance Criteria

1. WHEN a machine is selected, THE Machine_Selector SHALL display a "Unit Condition" dropdown pre-populated with the catalog value (Brand New, Re-certified, or Demo Unit)
2. THE Unit Condition dropdown SHALL allow the user to select any of the three condition options regardless of the catalog default
3. WHEN the user changes the unit condition, THE Quote_Builder_State SHALL update the `unitCondition` property to the user-selected value
4. THE Quote_Preview SHALL display the selected unit condition label prominently below the machine title — "BRAND NEW" in green, "RE-CERTIFIED" in red, "DEMO UNIT" in a distinct color

---

### Requirement 6: Sub-Model / Variant Selector

**User Story:** As a salesperson, I want a sub-model selector that appears when a machine has variants, so that I can select the exact variant for the quote.

#### Acceptance Criteria

1. WHEN the selected model has associated sub-models in the Catalog, THE Machine_Selector SHALL display a third dropdown labeled "Sub-Model / Variant"
2. WHEN the selected model has no sub-models, THE Machine_Selector SHALL hide the sub-model dropdown
3. WHEN a sub-model is selected, THE Machine_Selector SHALL populate the Quote_Builder_State with the data specific to that sub-model variant
4. WHEN the model selection changes, THE Machine_Selector SHALL reset the sub-model dropdown

---

### Requirement 7: Delivery Toggle

**User Story:** As a salesperson, I want a checkbox to include or exclude delivery from the package inclusions, so that I can adjust the quote based on delivery arrangements.

#### Acceptance Criteria

1. THE Quote_Form SHALL display a checkbox labeled "Include Delivery in Package Inclusions" with helper text "Unchecked = remains under Exclusions (default)"
2. THE checkbox SHALL default to unchecked (delivery stays in exclusions)
3. WHEN the checkbox is checked, THE Quote_Builder_State SHALL move the delivery-related item from the exclusions list to the inclusions list for display purposes
4. WHEN the checkbox is unchecked, THE Quote_Builder_State SHALL keep the delivery-related item in the exclusions list
5. THE Quote_Preview SHALL reflect the current placement of the delivery item based on the toggle state

---

### Requirement 8: Computer Set Toggle

**User Story:** As a salesperson, I want a checkbox to include a computer set in the package, so that I can add computer specifications when the machine requires one.

#### Acceptance Criteria

1. WHEN the selected machine has a computer set option in its Catalog data, THE Quote_Form SHALL display a checkbox labeled "Include Computer Set in Package"
2. WHEN the checkbox is checked, THE Quote_Form SHALL display a text input for custom computer specifications (e.g., "Intel Core i5, 8GB RAM")
3. WHEN the checkbox is checked, THE Quote_Builder_State SHALL add "Computer Set" (with spec text) to the active inclusions list
4. WHEN the checkbox is unchecked, THE Quote_Builder_State SHALL remove the computer set entry from the inclusions
5. WHEN the machine does not have a computer set option in the Catalog, THE Quote_Form SHALL hide the computer set checkbox entirely

---

### Requirement 9: Toggleable Package Inclusions

**User Story:** As a salesperson, I want to toggle individual package inclusions on/off and add custom ones, so that I can customize which inclusions appear on the final quote.

#### Acceptance Criteria

1. THE Quote_Form SHALL display each catalog-sourced inclusion as a checkbox item that defaults to checked (enabled)
2. WHEN a user unchecks an inclusion item, THE Quote_Preview SHALL exclude that item from the Package Inclusions section on the quote paper
3. WHEN a user re-checks an inclusion item, THE Quote_Preview SHALL include that item in the Package Inclusions section
4. THE Quote_Form SHALL display an "+ Add Inclusion" button below the catalog inclusions list
5. WHEN the user clicks "+ Add Inclusion", THE Quote_Form SHALL display a text input for entering a custom inclusion description
6. WHEN the user confirms a custom inclusion, THE Quote_Builder_State SHALL add the custom item to the inclusions list in a checked (enabled) state
7. THE user SHALL be able to remove custom-added inclusions via a remove/delete action

---

### Requirement 10: Toggleable Package Exclusions

**User Story:** As a salesperson, I want to toggle individual package exclusions on/off and add custom ones, so that I can customize which exclusions appear on the final quote.

#### Acceptance Criteria

1. THE Quote_Form SHALL display each catalog-sourced exclusion as a checkbox item that defaults to checked (enabled)
2. WHEN a user unchecks an exclusion item, THE Quote_Preview SHALL exclude that item from the Package Exclusions section on the quote paper
3. WHEN a user re-checks an exclusion item, THE Quote_Preview SHALL include that item in the Package Exclusions section
4. THE Quote_Form SHALL display an "+ Add Exclusion" button below the catalog exclusions list
5. WHEN the user clicks "+ Add Exclusion", THE Quote_Form SHALL display a text input for entering a custom exclusion description
6. WHEN the user confirms a custom exclusion, THE Quote_Builder_State SHALL add the custom item to the exclusions list in a checked (enabled) state
7. THE user SHALL be able to remove custom-added exclusions via a remove/delete action

---

### Requirement 11: Toggleable Optional Add-Ons

**User Story:** As a salesperson, I want to toggle individual optional add-ons on/off, so that only selected add-ons appear on the quote paper.

#### Acceptance Criteria

1. THE Quote_Form SHALL display each catalog-sourced add-on as a checkbox item that defaults to unchecked (disabled)
2. WHEN a user checks an add-on item, THE Quote_Preview SHALL display that item in the "Optional Add-ons" section on the quote paper with a checked checkbox marker (☑)
3. WHEN a user unchecks an add-on item, THE Quote_Preview SHALL remove that item from the "Optional Add-ons" section
4. THE Quote_Preview SHALL render enabled add-ons with a ☑ marker and disabled ones with a ☐ marker when a "show all add-ons" display mode is used, OR show only checked add-ons depending on the original app behavior

---

### Requirement 12: Warranty Section Form Fields

**User Story:** As a salesperson, I want to configure warranty details on the form, so that the quote paper renders accurate warranty clauses.

#### Acceptance Criteria

1. THE Quote_Form SHALL display a "Warranty" section with the following fields:
   - A "Company Name" dropdown with options: "ES Print Media Inc.", "ACS Premium Solutions Inc.", "ES Concept Group Inc.", "ES Print Industries Inc."
   - A "Supplier Name" text input defaulting to "ESPMI"
2. THE Quote_Builder_State SHALL store `warrantyCompany` and `warrantySupplier` properties
3. THE Quote_Preview SHALL render warranty clauses on the quote paper including:
   - Machine warranty duration line (from catalog data)
   - Printhead/Laser tube warranty line (when applicable from catalog)
   - Service fee after warranty statement
   - Confidentiality line: "The unit is exclusive to [warrantyCompany]..."
   - Void warranty line: "...without the consent of [warrantySupplier]..."
4. WHEN no warranty company is selected, THE Quote_Preview SHALL omit the warranty section from the quote paper

---

### Requirement 13: Closing Documents Button with Validation

**User Story:** As a salesperson, I want a button to navigate to closing documents after the quote is complete, so that I can proceed with the sales process.

#### Acceptance Criteria

1. THE Quote_Form SHALL display an "OPEN CLOSING DOCUMENTS" button at the bottom of the form
2. WHEN the button is clicked, THE Validation_Engine SHALL check all required fields for completeness
3. IF validation passes, THEN THE Quote_Form SHALL navigate to the closing documents page, passing the current quote context
4. IF validation fails, THEN THE Quote_Form SHALL display a red validation error box listing all missing or invalid fields (e.g., "No machine selected", "No contract price")
5. THE validation error box SHALL be dismissible and update in real-time as the user corrects missing fields

---

### Requirement 14: Machine Image on Quote Preview

**User Story:** As a salesperson, I want the machine image displayed on the quote paper, so that the client can visually identify the quoted product.

#### Acceptance Criteria

1. WHEN a machine is selected and has an `image_key` in the Catalog, THE Quote_Preview SHALL display the machine image in a hero layout — image on the left (approximately 70mm wide) with the features list on the right
2. IF the machine image fails to load or the `image_key` is missing, THEN THE Quote_Preview SHALL display a placeholder message or fallback graphic
3. THE machine image SHALL be rendered at a resolution suitable for print output (high-quality, no pixelation at A4 scale)
4. THE layout SHALL gracefully adapt if only features exist without an image (features take full width)

---

### Requirement 15: Quote Preview — Closing Text and Signature Formatting

**User Story:** As a salesperson, I want the quote paper to include professional closing text and properly formatted signature blocks matching the original app layout.

#### Acceptance Criteria

1. THE Quote_Preview SHALL render a closing paragraph before the signature section: "Trusting that the above quotation will receive your favorable consideration and assuring you of our best service at all times. Thank you very much."
2. THE Quote_Preview SHALL display "Very truly yours," above the Account Executive signature block
3. THE Quote_Preview SHALL display "Conforme:" above the Client Conforme signature block
4. THE Quote_Preview SHALL render "Signature over Printed Name" sub-labels below each signature line
5. THE closing text and signature formatting SHALL match the original ESPMI Sales Portal layout

---

### Requirement 16: Pre-PDF Validation

**User Story:** As a salesperson, I want the system to validate all required fields before generating a PDF, so that incomplete quotes are not accidentally saved.

#### Acceptance Criteria

1. WHEN the user triggers PDF generation (save/export), THE Validation_Engine SHALL check for: machine selection, contract price, client name, and deal type at minimum
2. IF any required field is missing or invalid, THEN THE Validation_Engine SHALL display a red validation box listing each specific issue (e.g., "No machine selected", "No contract price entered", "No client name")
3. IF all required fields are present, THEN THE system SHALL proceed with PDF generation
4. THE validation error messages SHALL be specific and actionable, identifying exactly which field needs attention
5. THE validation box SHALL disappear once all listed issues are resolved

---

### Requirement 17: Unit Condition Display on Quote Preview

**User Story:** As a salesperson, I want the unit condition to display prominently and with color-coding on the quote paper, so that the client clearly sees the machine's condition status.

#### Acceptance Criteria

1. WHEN the unit condition is "Brand New", THE Quote_Preview SHALL display "BRAND NEW" in green text/badge below the machine title
2. WHEN the unit condition is "Re-certified", THE Quote_Preview SHALL display "RE-CERTIFIED" in red text/badge below the machine title
3. WHEN the unit condition is "Demo Unit", THE Quote_Preview SHALL display "DEMO UNIT" in a distinct color (e.g., orange/amber) below the machine title
4. THE condition label SHALL be rendered in uppercase, bold, and clearly visible on the quote paper

---

### Requirement 18: Quote Date Display on Preview

**User Story:** As a salesperson, I want the quote date visible on the printed quotation in the header area, so that the recipient knows when the quote was issued.

#### Acceptance Criteria

1. WHEN a quote date is set, THE Quote_Preview SHALL display "Date: [formatted date]" in the letterhead meta area (near the top of the quote paper)
2. THE date SHALL be formatted in a human-readable format (e.g., "August 11, 2026")
3. WHEN no date is set, THE Quote_Preview SHALL omit the date line from the letterhead area
