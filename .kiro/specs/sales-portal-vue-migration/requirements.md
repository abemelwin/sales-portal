# Requirements Document

## Introduction

This document defines the requirements for migrating the ES Print Media Inc. (ESPMI) Sales Portal from a single-file client-side HTML application that uses localStorage to a full-stack web application built on Vue 3 (Composition API) + Vite for the frontend, Supabase (PostgreSQL, Auth, Row Level Security) for the backend and database, and deployed on Cloudflare Pages. The migrated system must support 72 concurrent authenticated users who share the same real-time data, preserve every feature of the existing application, and extend those features with proper multi-user data isolation, server-side persistence, and role-based access control.

---

## Glossary

- **Application**: The migrated ESPMI Sales Portal web application.
- **Auth_Service**: The Supabase Auth module responsible for user authentication and session management.
- **Catalog_Editor**: The administrative interface for creating, editing, and deleting Machine records.
- **Catalog_Service**: The backend module that manages the Machine catalog stored in Supabase PostgreSQL.
- **Closing_Doc**: A printable legal/operational document generated at quote closing — includes Terms & Conditions, Delivery Instructions, Warranty Card, CAC, PDC, and Pullout forms.
- **Consumable**: A supply item (ink, toner, media, etc.) associated with a Machine that has a unit price and a package description.
- **Dashboard**: The landing view shown to users after login, providing a summary of recent activity and quick-access navigation.
- **Deal_Type**: The payment structure of a Quote — one of: Standard Cash, Standard Terms, Trade-In Cash, or Trade-In Terms.
- **Export_Service**: The frontend module responsible for generating PDF and Excel exports.
- **Machine**: A product in the catalog characterized by brand, model, optional sub-model, unit condition, features, consumables, package inclusions, exclusions, and optional add-ons.
- **Pricelist**: A read-only tabular view of all active Machines and their pricing, filterable by brand.
- **Pricelist_Service**: The module that serves pricelist and consumables pricelist views.
- **Product_Info**: A collection of reference documents (datasheets, brochures, links) organized per Machine model.
- **Quote**: A sales proposal document created for a specific customer that contains a Machine selection, pricing structure, payment terms, inclusions, exclusions, consumables pricing, and signatory data.
- **Quote_Builder**: The interactive view where a salesperson creates and previews a Quote in real time.
- **Quote_Service**: The backend module that persists and retrieves Quote records.
- **RLS**: Row Level Security — Supabase PostgreSQL policies that enforce data access rules at the database row level.
- **Role**: A named permission level assigned to a User — either `admin` or `salesperson`.
- **Salesperson**: A User with the `salesperson` Role who can create and export Quotes but cannot manage users, roles, or catalog entries.
- **Admin**: A User with the `admin` Role who has full access to all features including user management, role management, and the Catalog Editor.
- **Session**: An active authenticated context for a User, managed by Auth_Service via JWT.
- **Supabase**: The backend-as-a-service platform providing PostgreSQL, Auth, and Realtime subscriptions.
- **Trade_In**: A unit offered by a customer as partial payment against a new Machine purchase.
- **User**: An authenticated person with a username, password, display name, and assigned Role.
- **User_Management**: The administrative interface for creating, editing, and deactivating User accounts.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to sign in with a username and password, so that I can access the application securely.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Service SHALL authenticate the user and establish a Session within 3 seconds.
2. WHEN a user submits incorrect credentials, THE Auth_Service SHALL return an authentication failure message and SHALL NOT establish a Session.
3. IF a user submits incorrect credentials 5 or more consecutive times, THEN THE Auth_Service SHALL lock the account and SHALL return an error message indicating the account is locked.
4. WHEN a Session expires or is invalid, THE Application SHALL redirect the user to the login page within 3 seconds and SHALL NOT display any protected view.
5. WHEN a user clicks the logout action, THE Auth_Service SHALL invalidate the current Session and THE Application SHALL redirect the user to the login page within 1 second.
6. WHEN a user is authenticated, THE Application SHALL display the user's display name, truncated to a maximum of 50 characters, in the navigation bar.
7. THE Auth_Service SHALL enforce HTTPS for all authentication requests.
8. WHEN a user requests a password change, THE Auth_Service SHALL update the stored password only after the user provides the current password and a new password that is between 8 and 128 characters in length.
9. IF a Session token is absent or malformed on any protected API request, THEN THE Auth_Service SHALL reject the request and return an authentication error response without exposing any protected resource data.

---

### Requirement 2: Role-Based Access Control

**User Story:** As an admin, I want role-based access enforcement, so that salespersons cannot access administrative features.

#### Acceptance Criteria

1. THE Application SHALL enforce one of two Roles for every authenticated User: `admin` or `salesperson`.
2. IF an authenticated User has no recognized Role assigned, THEN THE Application SHALL treat the User as `salesperson` and SHALL restrict access accordingly.
3. WHEN a User with the `salesperson` Role attempts to navigate to the User Management, Role Management, or Catalog Editor views, THE Application SHALL display an access-denied message indicating insufficient permissions and SHALL NOT render the restricted view.
4. WHEN a User with the `admin` Role is authenticated, THE Application SHALL display the Users, Roles, and Catalog Editor navigation items.
5. WHEN a User with the `salesperson` Role is authenticated, THE Application SHALL hide the Users, Roles, and Catalog Editor navigation items.
6. THE RLS policies in Supabase SHALL prevent a `salesperson` user from reading or modifying records in the User, Role, or Machine catalog tables, regardless of frontend enforcement.
7. WHEN a Role is changed for a User, THE Application SHALL apply the updated access control on the next request from that User without requiring application redeployment or manual session invalidation.

---

### Requirement 3: Dashboard

**User Story:** As a user, I want a dashboard view after login, so that I can quickly see recent activity and navigate to key functions.

#### Acceptance Criteria

1. WHEN a User logs in successfully, THE Application SHALL display the Dashboard as the default landing view.
2. THE Dashboard SHALL display the count of Quotes created in the current calendar month by the authenticated User, showing "0" when no Quotes exist for the current month.
3. WHERE the authenticated User has the `admin` Role, THE Dashboard SHALL display the total count of Users whose accounts are not deactivated or suspended in the system.
4. THE Dashboard SHALL provide navigation shortcuts to the Quote Builder, Machine Pricelist, and Consumables Pricelist views.
5. WHEN quote data is updated by any user, THE Dashboard SHALL reflect updated counts within 30 seconds without requiring a page reload.
6. IF the Dashboard fails to retrieve data from the server, THEN THE Application SHALL display an error message indicating that dashboard data could not be loaded and SHALL provide a manual retry option.
7. IF the real-time update connection is lost, THEN THE Dashboard SHALL indicate to the User that displayed data may be outdated and SHALL attempt to reconnect automatically within 60 seconds.

---

### Requirement 4: Machine Catalog Management

**User Story:** As an admin, I want to create, edit, and delete machines in the catalog, so that salespersons always work with current product data.

#### Acceptance Criteria

1. WHEN an Admin submits a new Machine record with a brand, model, and at least one feature, THE Catalog_Service SHALL persist the record in the Supabase database and make it available to all users within 5 seconds.
2. WHEN an Admin submits an edit to an existing Machine record, THE Catalog_Service SHALL update the record and all related sub-records (features, consumables, inclusions, exclusions, optional add-ons) atomically.
3. IF an atomic edit fails for any sub-record, THEN THE Catalog_Service SHALL roll back all changes from that edit operation and display an error message indicating which sub-record caused the failure.
4. WHEN an Admin deletes a Machine record, THE Catalog_Service SHALL mark the record as inactive and SHALL NOT delete historical Quote records that reference that Machine.
5. THE Catalog_Editor SHALL support the following fields per Machine: brand (max 100 characters), model (max 100 characters), sub-model (optional, max 100 characters), unit condition (Brand New / Re-certified / Demo Unit), feature list (max 50 items), consumable list (item name max 150 characters, package description max 300 characters, default price from 0.01 to 999,999,999.99), package inclusion list (max 50 items), exclusion list (max 50 items), optional add-on list (max 50 items), and associated letterhead.
6. WHEN a catalog change is saved, THE Application SHALL display a success confirmation message within 2 seconds.
7. IF a duplicate brand-model-sub-model combination is submitted, THEN THE Catalog_Service SHALL reject the record and return a validation error message indicating the conflicting brand, model, and sub-model values.
8. THE Catalog_Service SHALL support importing Machine records from an uploaded .xlsx file using the same column schema as the existing ESPMI catalog export format, with a maximum file size of 10 MB and a maximum of 5,000 rows per import.
9. WHEN a .xlsx import is processed, THE Catalog_Service SHALL report the count of records added, updated, and skipped due to validation errors.
10. IF an uploaded .xlsx file exceeds 10 MB or 5,000 rows, or contains columns that do not match the expected schema, THEN THE Catalog_Service SHALL reject the file and display an error message indicating the reason for rejection.

---

### Requirement 5: Quote Builder

**User Story:** As a salesperson, I want to build a quote for a customer in real time, so that I can present accurate pricing and terms during or after a sales call.

#### Acceptance Criteria

1. WHEN a User selects a Machine brand and model in the Quote Builder, THE Quote_Builder SHALL populate the features, consumables, package inclusions, exclusions, and optional add-ons from the Catalog_Service.
2. IF the Catalog_Service is unavailable or returns an error when a User selects a Machine brand and model, THEN THE Quote_Builder SHALL display an error message indicating that catalog data could not be loaded and SHALL prevent quote field population until a successful retry.
3. WHEN a User enters a contract price, THE Quote_Builder SHALL compute and display the monthly amortization amount using the formula: (contract price − down payment − sum of trade-in values) ÷ number of months, rounded to two decimal places, and update the displayed value within 300 milliseconds.
4. IF the number of months is zero, or the down payment plus sum of trade-in values equals or exceeds the contract price, THEN THE Quote_Builder SHALL display a validation error message indicating the invalid input and SHALL NOT compute the monthly amortization.
5. WHEN the Deal_Type is set to a trade-in variant, THE Quote_Builder SHALL display up to three Trade_In fields (description and value each), and SHALL include the sum of trade-in values in the payment calculation.
6. WHEN the VAT-inclusive checkbox is checked, THE Quote_Builder SHALL move the VAT line item into the Package Inclusions section and recalculate displayed totals accordingly.
7. THE Quote_Builder SHALL support a minimum of 1 and a maximum of 5 term options in a single Quote, where each term option specifies a down payment amount (minimum 0) and number of months (minimum 1, maximum 60), and the monthly amortization is computed independently for each term option.
8. WHEN the UNDER PROMO checkbox is checked, THE Quote_Builder SHALL display a freebie entry list and a promo validity field, and SHALL include freebie items in the quote preview.
9. WHEN a User modifies any field in the Quote Builder form, THE Quote_Builder SHALL update the A4 quote preview within 300 milliseconds without a page reload.
10. THE Quote_Builder SHALL support two selectable letterheads: "ES Print Media Inc." and "ACS / Alternative", and SHALL display the correct letterhead image in the quote preview.
11. WHEN a User selects a unit condition of "Re-certified", THE Quote_Builder SHALL display a "RE-CERTIFIED" label in the quote preview's machine title section.
12. THE Quote_Builder SHALL allow a User to customize per-quote consumable prices independently of the catalog default prices.
13. THE Quote_Builder SHALL provide separate text fields for: availability (maximum 200 characters), collection arrangement for payment (maximum 200 characters), collection arrangement for down payment (maximum 200 characters), and collection arrangement for amortization (maximum 200 characters).
14. THE Quote_Builder SHALL include signatory fields for Account Executive, Client Conforme, Noted By name, and Noted By role, each with a maximum length of 100 characters.
15. WHEN a Quote is saved, THE Quote_Service SHALL persist the full Quote payload including all field values under the authenticated User's account in Supabase.
16. IF saving a Quote fails due to a network or server error, THEN THE Quote_Service SHALL display an error message indicating the save was unsuccessful and SHALL retain all entered data in the form so the User can retry without data loss.
17. WHEN a User opens a previously saved Quote, THE Quote_Builder SHALL restore all field values exactly as saved.

---

### Requirement 6: PDF and Excel Export

**User Story:** As a salesperson, I want to export quotes as PDF and download pricelist data as Excel, so that I can share professional documents with customers.

#### Acceptance Criteria

1. WHEN a User clicks "Save as PDF", THE Export_Service SHALL trigger the browser's print dialog pre-configured for A4 paper size, with the form panel hidden, yielding a print-ready PDF.
2. WHEN the A4 quote preview is printed or exported, THE Export_Service SHALL preserve all colors, background fills, and table header colors in the output using CSS print-color-adjust settings.
3. WHEN a User clicks "Save as PDF" on a mobile device, THE Export_Service SHALL render the A4 quote paper at correct print dimensions (210mm × 297mm) regardless of the device's viewport width.
4. WHEN a User accesses the Closing Documents view and clicks save, THE Export_Service SHALL print the active closing document (T&C, Delivery Instructions, Warranty Card, CAC, PDC, or Pullout) as a standalone A4-formatted PDF.
5. WHEN a User triggers an Excel export from the Machine Pricelist view, THE Export_Service SHALL generate and download an .xlsx file containing all visible pricelist rows (up to 10,000 rows) with column headers matching the visible table columns, using the SheetJS library.
6. THE Export_Service SHALL generate PDF outputs that are visually consistent with the on-screen quote preview, with a maximum visual deviation of 2mm per element position on A4.
7. IF the Excel export is triggered when no pricelist rows are visible, THEN THE Export_Service SHALL display a notification indicating that there is no data available to export and SHALL NOT generate a file.
8. IF the browser blocks the print dialog or the Excel file generation fails, THEN THE Export_Service SHALL display an error notification informing the User that the export could not be completed and provide guidance to retry.

---

### Requirement 7: Pricelist and Consumables Views

**User Story:** As a salesperson, I want to view the machine pricelist and consumables pricelist, so that I can quickly reference pricing without building a full quote.

#### Acceptance Criteria

1. THE Pricelist_Service SHALL display all active Machines in a paginated table with a default page size of 25 rows, showing columns for brand, model, sub-model, unit condition, cost price, sell price, and margin, sorted alphabetically by brand then model by default, with all displayed columns sortable and the brand, model, and unit condition columns filterable.
2. WHEN a User selects a brand filter in the Pricelist view, THE Pricelist_Service SHALL filter the displayed rows to only show Machines of the selected brand within 200 milliseconds.
3. THE Pricelist_Service SHALL display the Consumables Pricelist as a paginated table with a default page size of 25 rows, showing columns for item name, packaging, and price per consumable, sorted alphabetically by item name by default, with all displayed columns sortable and the item name column filterable.
4. WHEN the Machine catalog is updated by an Admin, THE Pricelist_Service SHALL reflect the updated data within 30 seconds for all active sessions.
5. THE Pricelist view SHALL include an export button that triggers the Excel export described in Requirement 6, Criterion 5.
6. IF the Pricelist_Service fails to load Machine or Consumables data, THEN THE Pricelist_Service SHALL display an error message indicating the data could not be retrieved and provide a retry option that re-attempts the data load on user activation.

---

### Requirement 8: Closing Documents

**User Story:** As a salesperson, I want to generate closing documents from quote data, so that I can prepare legal and delivery paperwork without re-entering information.

#### Acceptance Criteria

1. WHEN a User opens the Closing Documents modal, THE Application SHALL pre-populate editable fields (client name, company, address, contact, machine model, contract price, down payment, monthly amortization, signatory names) from the current Quote data, and SHALL leave any field blank if the corresponding Quote data is not available.
2. THE Application SHALL support the following six Closing_Doc types within a single tabbed view: Terms & Conditions, Delivery Instructions, Warranty Card, Collection Agreement Confirmation (CAC), Post-Dated Checks (PDC), and Pullout Form.
3. WHEN a User switches between Closing_Doc tabs, THE Application SHALL retain all entered data for previously visited tabs until the Closing Documents modal is closed.
4. WHEN a User clicks the export button for the currently active Closing_Doc tab, THE Export_Service SHALL generate a PDF document formatted to A4 page size containing only the content of that active tab.
5. THE Closing_Doc templates SHALL embed the letterhead image (ESPMI or ACS) matching the letterhead selected in the associated Quote.
6. IF a User closes the Closing Documents modal without exporting, THEN THE Application SHALL discard all unsaved changes and not persist any entered data.

---

### Requirement 9: Product Information View

**User Story:** As a salesperson, I want to browse product information files per machine model, so that I can quickly locate brochures and datasheets to share with customers.

#### Acceptance Criteria

1. THE Application SHALL display a Product Info view with reference links grouped by Machine brand, then by Machine model within each brand, with brands and models each sorted alphabetically.
2. WHEN a User selects a Machine model in the Product Info view, THE Application SHALL display all associated reference links (brochures, datasheets, specification sheets) for that model, showing each link's display name and document type.
3. IF a User selects a Machine model that has no associated reference links, THEN THE Application SHALL display a message indicating that no product information documents are available for that model.
4. WHEN a User clicks a reference link, THE Application SHALL open the linked resource in a new browser tab.
5. WHERE the authenticated User has the `admin` Role, THE Application SHALL allow adding, editing, and deleting reference links per Machine model, requiring a valid URL (maximum 2048 characters) and a display name (between 1 and 150 characters).
6. WHEN an Admin saves a Product Info link, THE Catalog_Service SHALL validate the URL format and display name constraints, persist the link URL and display name, and make them available to all active users within 2 seconds of a successful save.
7. IF saving a Product Info link fails due to validation errors or a service error, THEN THE Application SHALL display an error message indicating the reason for failure and preserve the Admin's entered data in the form.

---

### Requirement 10: User Management

**User Story:** As an admin, I want to create and manage user accounts, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN an Admin creates a new User with a unique username (3–64 characters, alphanumeric and underscores only), a display name (1–128 characters), and an initial password (8–128 characters), THE Auth_Service SHALL provision the User account and assign the specified Role within 5 seconds.
2. WHEN an Admin changes a User's Role, THE Application SHALL apply the new Role on the User's next authenticated request.
3. WHEN an Admin deactivates a User account, THE Auth_Service SHALL invalidate any active Sessions for that User and SHALL prevent new Sessions from being established for that account.
4. THE User_Management view SHALL display a paginated table (maximum 50 rows per page) of all Users with columns for display name, username, Role, and account status.
5. IF an Admin attempts to create a User with a username that already exists, THEN THE Auth_Service SHALL reject the request and display an error message indicating the username is already taken.
6. THE Application SHALL enforce a minimum of one active `admin` User at all times; THE User_Management view SHALL reject a deactivation request that would leave zero active Admin users.
7. IF an Admin submits a user creation request with missing required fields or values that violate the username, display name, or password constraints, THEN THE Auth_Service SHALL reject the request and display an error message identifying each field that failed validation.
8. WHEN an Admin reactivates a previously deactivated User account, THE Auth_Service SHALL restore the User's prior Role and allow new Sessions to be established for that account.

---

### Requirement 11: Real-Time Data Sharing

**User Story:** As a user, I want data changes made by other users to appear automatically, so that the team always works from the same current information.

#### Acceptance Criteria

1. WHEN any User saves or updates a Quote, THE Application SHALL broadcast the change via Supabase Realtime and reflect it in any other active session's Quote list within 10 seconds.
2. WHEN an Admin updates the Machine catalog, THE Application SHALL propagate the catalog change to all active sessions within 30 seconds via Supabase Realtime.
3. WHILE up to 72 concurrent authenticated users are connected and Supabase services are available with network latency below 200 ms, THE Application SHALL maintain read and write response times at or below 2 seconds.
4. WHEN the Supabase Realtime connection is interrupted, THE Application SHALL display a non-blocking connectivity warning to the user and SHALL automatically attempt reconnection every 5 seconds for a maximum of 60 attempts.
5. IF a Realtime reconnection attempt succeeds, THEN THE Application SHALL refresh the local data cache within 10 seconds and remove the connectivity warning.
6. IF all 60 reconnection attempts are exhausted without success, THEN THE Application SHALL display a persistent error notification indicating loss of real-time updates and SHALL cease further automatic reconnection attempts until the user manually triggers a page refresh.

---

### Requirement 12: Data Migration

**User Story:** As an admin, I want existing localStorage data migrated to Supabase, so that no historical data is lost during the transition.

#### Acceptance Criteria

1. THE Application SHALL provide a one-time migration utility that reads the existing localStorage machine catalog and user list and writes the records to the Supabase database.
2. WHEN the migration utility is executed, THE Application SHALL report the total number of records found in localStorage, the count of records successfully migrated, and the count of records skipped due to duplicate key conflicts or schema validation failures, with each skipped record accompanied by a reason indicating the type of failure.
3. WHEN the migration completes successfully, THE Application SHALL mark the migration as complete in Supabase, SHALL retain the original localStorage data unmodified, and SHALL NOT re-run the migration automatically on subsequent application loads.
4. THE migration utility SHALL be accessible only to Users with the `admin` Role.
5. IF the migration encounters a network or database error during execution, THEN THE Application SHALL stop processing, SHALL NOT mark the migration as complete, SHALL preserve all original localStorage data, and SHALL display an error message indicating the failure and the number of records successfully migrated before the failure.
6. IF the admin invokes the migration utility and localStorage contains no machine catalog or user list data, THEN THE Application SHALL display a message indicating that no data is available to migrate and SHALL NOT mark the migration as complete.

---

### Requirement 13: Deployment and Infrastructure

**User Story:** As a developer, I want the application deployed on Cloudflare Pages, so that it is globally available with fast load times and zero server maintenance.

#### Acceptance Criteria

1. THE Application SHALL be deployable to Cloudflare Pages via a Git-connected build pipeline using `vite build` as the build command and `dist` as the output directory.
2. THE Application SHALL serve all frontend assets over HTTPS with an initial page load time under 1 second as measured by Lighthouse navigation mode on desktop with simulated throttling disabled and an empty browser cache.
3. THE Application SHALL store Supabase project URL and anon key as Cloudflare Pages environment variables and SHALL NOT hard-code credentials in source files, such that no credential strings appear in the built output within the `dist` directory.
4. WHEN Cloudflare Pages deploys a new build, THE Application SHALL remain available to users without a service interruption window exceeding 30 seconds.
5. THE Application SHALL pass a Lighthouse performance score of at least 75 when measured in navigation mode on desktop with simulated throttling disabled against the authenticated Dashboard view.
6. IF the Cloudflare Pages build pipeline fails, THEN THE Application SHALL retain the previous successful deployment and serve the last successfully built version to users without interruption.

---

### Requirement 14: Mobile Responsiveness

**User Story:** As a salesperson on a mobile device, I want to use the quote builder, so that I can create quotes during on-site client visits.

#### Acceptance Criteria

1. THE Application SHALL render the Quote Builder on screens with a viewport width of 375px or greater, with all form fields accessible, all buttons tappable with a minimum touch target of 44×44px, and no horizontal overflow requiring scrolling.
2. WHILE the Application is viewed on a screen with a viewport width less than 768px, THE Application SHALL display a two-tab mobile navigation that switches between the quote form panel and the A4 preview panel.
3. WHEN a User switches between the quote form tab and the preview tab, THE Application SHALL preserve all previously entered form data without loss.
4. WHEN a User on a mobile device taps an input field, THE Application SHALL use a font size of at least 16px for text input elements to prevent iOS automatic zoom behavior.
5. WHEN a User on a mobile device views the A4 quote preview, THE Application SHALL scale the 210mm-wide quote paper to fit the full width of the viewport with no horizontal scrollbar, while maintaining the A4 aspect ratio (210mm × 297mm) so that printed output matches A4 dimensions.
6. WHILE the Application is viewed on a screen with a viewport width less than 768px and the preview tab is active, THE Application SHALL display a "Save as PDF" button fixed to the bottom of the viewport, remaining visible regardless of scroll position.
