# Implementation Plan: ESPMI Sales Portal Vue 3 Migration

## Overview

This plan migrates the ESPMI Sales Portal from a monolithic single-file HTML/localStorage application to a modern full-stack Vue 3 + Supabase application deployed on Cloudflare Pages. Tasks are ordered by dependency — infrastructure first, then core features, then advanced features, then testing and deployment.

## Tasks

- [x] 1. Project scaffolding and tooling setup
  - [x] 1.1 Initialize Vue 3 + TypeScript project with Vite
    - Run `npm create vite@latest` with Vue + TypeScript template
    - Configure `vite.config.ts` with path aliases (`@/` → `src/`)
    - Set up `tsconfig.json` with strict mode, path aliases, and Vue compiler options
    - Install core dependencies: `vue`, `vue-router`, `pinia`, `@supabase/supabase-js`
    - Install dev dependencies: `vitest`, `@vue/test-utils`, `@testing-library/vue`, `fast-check`, `@fast-check/vitest`
    - _Requirements: 13.1, 13.2_

  - [x] 1.2 Create directory structure and base configuration files
    - Create folder structure: `src/assets`, `src/components/common`, `src/components/layout`, `src/composables`, `src/router`, `src/services`, `src/stores`, `src/types`, `src/views`, `src/utils`
    - Create `tests/unit`, `tests/property`, `tests/integration`, `tests/e2e` directories
    - Add `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders
    - Configure Vitest in `vite.config.ts` with test environment settings
    - _Requirements: 13.1, 13.3_

  - [x] 1.3 Set up CSS foundation and print styles
    - Create global stylesheet with CSS custom properties for theming
    - Add `@media print` rules: hide form panel, A4 page size, print-color-adjust
    - Define `@page { size: A4; margin: 8mm; }` rule
    - Add mobile-first responsive breakpoints (375px, 768px, 1024px)
    - Set minimum touch target size of 44×44px for interactive elements
    - Set font size ≥ 16px for inputs to prevent iOS zoom
    - _Requirements: 6.1, 6.2, 6.6, 14.1, 14.4_

- [x] 2. Supabase database schema and security setup
  - [x] 2.1 Create PostgreSQL schema migration files
    - Write SQL migration for `user_profiles` table with role CHECK constraint and unique user_id
    - Write SQL migration for `machines` table with unique (brand, model, sub_model) constraint
    - Write SQL migration for machine sub-tables: `machine_features`, `machine_consumables`, `machine_inclusions`, `machine_exclusions`, `machine_addons`
    - Write SQL migration for `product_info_links` table
    - Write SQL migration for `quotes` table with all fields from design
    - Write SQL migration for quote sub-tables: `quote_term_options`, `quote_trade_ins`, `quote_consumable_prices`
    - Write SQL migration for `migration_status` table
    - Create all performance indexes as defined in design
    - _Requirements: 4.5, 5.7, 5.14, 10.1, 12.1_

  - [x] 2.2 Implement Row Level Security policies
    - Create `get_user_role()` helper function
    - Add RLS policies for `user_profiles`: users read own, admins read/write all
    - Add RLS policies for `machines` and sub-tables: authenticated read, admin write
    - Add RLS policies for `quotes` and sub-tables: users manage own, admins manage all
    - Add RLS policies for `product_info_links`: authenticated read, admin write
    - Add RLS policy for `migration_status`: admin only
    - _Requirements: 2.1, 2.6, 10.6_

  - [x] 2.3 Configure Supabase Auth settings
    - Configure email/password authentication provider
    - Set JWT expiry to 1 hour (Supabase default)
    - Enable refresh token rotation
    - Configure password policy (8–128 characters)
    - _Requirements: 1.1, 1.7, 1.8_

- [x] 3. Core application infrastructure
  - [x] 3.1 Create Supabase client service and TypeScript types
    - Create `src/services/supabase.ts` with typed `createClient<Database>()` singleton
    - Create `src/types/database.ts` with full Database type matching schema
    - Create `src/types/errors.ts` with `AppErrorCode` and `AppError` interface
    - Create `src/types/index.ts` with Machine, Quote, User, and related model interfaces
    - _Requirements: 13.3_

  - [x] 3.2 Set up Vue Router with route definitions and navigation guards
    - Create `src/router/index.ts` with all routes from design (login, dashboard, quotes, pricelist, consumables, product-info, catalog, users, roles, migrate)
    - Add route meta fields: `requiresAuth`, `requiresAdmin`
    - Implement `beforeEach` navigation guard for auth check and role check
    - Add redirect-to-login with return URL query parameter
    - _Requirements: 1.4, 2.3, 2.4, 2.5, 3.1_

  - [x] 3.3 Create Pinia stores — auth store
    - Create `src/stores/auth.ts` with state: user, session, role, isAuthenticated, failedAttempts
    - Implement `login` action with credential validation and account lockout logic (5 attempts)
    - Implement `logout` action that invalidates session
    - Implement `refreshSession` action
    - Implement `changePassword` action with current password verification
    - Set up `onAuthStateChange` listener for TOKEN_REFRESHED, SIGNED_OUT events
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.8_

  - [x] 3.4 Create Pinia stores — catalog, quotes, users, dashboard, productInfo, realtime
    - Create `src/stores/catalog.ts` with machines state, CRUD actions, import action
    - Create `src/stores/quotes.ts` with quotes/currentQuote state, save/load/delete actions
    - Create `src/stores/users.ts` with users state, create/update/deactivate/reactivate actions
    - Create `src/stores/dashboard.ts` with monthlyQuoteCount, activeUserCount, fetch actions
    - Create `src/stores/productInfo.ts` with productLinks state, CRUD actions
    - Create `src/stores/realtime.ts` with connectionStatus and lastSync state
    - _Requirements: 3.2, 3.3, 4.1, 5.15, 10.1_

  - [x] 3.5 Create core composables
    - Create `src/composables/useAuth.ts` wrapping auth store for component use
    - Create `src/composables/useSupabase.ts` exposing singleton client
    - Create `src/composables/useRealtime.ts` with subscribe/unsubscribe and connection status
    - Create `src/composables/useReconnection.ts` with exponential backoff (5s interval, 60 max attempts)
    - Create `src/composables/usePagination.ts` with offset-based pagination and reactive page state
    - _Requirements: 11.4, 11.5, 11.6, 7.1_

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Authentication and session management
  - [x] 5.1 Create LoginView component
    - Build login form with email/password fields, submit handler, and inline error display
    - Display "Account locked" message when lockout threshold reached
    - Redirect to Dashboard (or saved return URL) on successful login
    - Enforce HTTPS via environment configuration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

  - [x] 5.2 Implement session lifecycle and auto-redirect
    - Handle token refresh transparently via `onAuthStateChange`
    - Redirect to `/login` on SIGNED_OUT or invalid/expired token
    - Preserve return URL in redirect for post-login navigation
    - _Requirements: 1.4, 1.5, 1.9_

  - [x] 5.3 Implement password change flow
    - Create password change form (current password + new password)
    - Validate new password length (8–128 characters) client-side
    - Call Supabase `updateUser({ password })` after re-authentication
    - Show success/error feedback
    - _Requirements: 1.8_

  - [x]* 5.4 Write property tests for password validation
    - **Property 2: Password Length Validation**
    - **Validates: Requirements 1.8**

  - [x]* 5.5 Write unit tests for auth store and login flow
    - Test successful login establishes session
    - Test failed login increments attempt counter
    - Test account lockout at 5 failed attempts
    - Test session expiry triggers redirect
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Layout and navigation components
  - [x] 6.1 Create App shell with NavBar and responsive layout
    - Create `src/App.vue` with NavBar, RouterView, and error boundary (`onErrorCaptured`)
    - Create `src/components/layout/NavBar.vue` displaying user display name (truncated to 50 chars), logout button, and role-conditional nav items
    - Show admin nav items (Users, Roles, Catalog) only for admin role
    - Hide admin nav items for salesperson role
    - _Requirements: 1.6, 2.4, 2.5_

  - [x]* 6.2 Write property test for display name truncation
    - **Property 1: Display Name Truncation**
    - **Validates: Requirements 1.6**

  - [x]* 6.3 Write property test for role default assignment
    - **Property 3: Role Default Assignment**
    - **Validates: Requirements 2.1, 2.2**

- [x] 7. Dashboard view
  - [x] 7.1 Implement DashboardView with data cards and navigation shortcuts
    - Display monthly quote count for current user
    - Display active user count for admin role
    - Show "0" when no quotes exist for the month
    - Add navigation shortcuts to Quote Builder, Machine Pricelist, and Consumables Pricelist
    - Implement error state with "Retry" button on data load failure
    - Subscribe to realtime updates for quote count refresh
    - Show stale-data warning when realtime connection is lost
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 8. Machine catalog management
  - [x] 8.1 Create CatalogEditorView with machine CRUD form
    - Build form with all machine fields: brand, model, sub-model, unit condition, letterhead
    - Add dynamic list editors for features, consumables, inclusions, exclusions, add-ons
    - Enforce field constraints (max lengths, price ranges, max 50 items per list)
    - Implement create, update, and soft-delete operations
    - Show success confirmation on save within 2 seconds
    - Display inline validation error on duplicate brand-model-sub_model
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

  - [x] 8.2 Implement atomic catalog updates with rollback
    - Use Supabase transactions (or sequential inserts with manual rollback) for machine + sub-records
    - On sub-record failure, roll back all changes and display error identifying failed sub-record
    - _Requirements: 4.2, 4.3_

  - [x] 8.3 Implement catalog .xlsx import functionality
    - Create `src/composables/useCatalogImport.ts`
    - Parse uploaded .xlsx file using SheetJS
    - Validate file size (≤ 10 MB), row count (≤ 5,000), and column schema
    - Batch insert validated records with ON CONFLICT handling
    - Report counts: added, updated, skipped (with reason per skip)
    - Display rejection errors for invalid files
    - _Requirements: 4.8, 4.9, 4.10_

  - [x]* 8.4 Write property test for machine uniqueness constraint
    - **Property 4: Machine Uniqueness Constraint**
    - **Validates: Requirements 4.7**

- [x] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Quote Builder
  - [x] 10.1 Create QuoteBuilderView with form and preview panels
    - Build two-panel layout: `QuoteFormPanel` (left) and `QuotePreviewPanel` (right)
    - Create `MachineSelector` component that populates features/consumables/inclusions/exclusions/addons from catalog on brand+model selection
    - Display error and block population if catalog service is unavailable
    - _Requirements: 5.1, 5.2_

  - [x] 10.2 Implement quote calculation logic
    - Create `src/utils/quote-calculations.ts` with `computeAmortization(contractPrice, downPayment, tradeInSum, months)` function
    - Implement formula: `(contractPrice - downPayment - tradeInSum) / months` rounded to 2 decimal places
    - Return error for invalid inputs (months=0, down+trade≥price)
    - Wire calculations reactively to update preview within 300ms
    - _Requirements: 5.3, 5.4_

  - [x] 10.3 Implement term options, trade-ins, and deal type logic
    - Support 1–5 term options with independent amortization per option
    - Each term option: down payment (≥0), months (1–60)
    - Display up to 3 trade-in fields for trade-in deal types
    - Handle deal type switching (Standard Cash/Terms, Trade-In Cash/Terms)
    - _Requirements: 5.5, 5.7_

  - [x] 10.4 Implement VAT, promo, consumable pricing, and signatory fields
    - VAT-inclusive toggle moves VAT to inclusions section
    - UNDER PROMO checkbox shows freebie list and promo validity field
    - Per-quote consumable price customization (independent of catalog defaults)
    - Letterhead selection: "ES Print Media Inc." / "ACS / Alternative"
    - "RE-CERTIFIED" label display for re-certified units
    - Availability, collection arrangement fields (max 200 chars each)
    - Signatory fields: AE, Client Conforme, Noted By name/role (max 100 chars each)
    - _Requirements: 5.6, 5.8, 5.10, 5.11, 5.12, 5.13, 5.14_

  - [x] 10.5 Implement A4 quote preview with real-time updates
    - Render quote as A4 paper (210mm × 297mm) with fixed dimensions
    - Update preview within 300ms on any form field change
    - Display correct letterhead image
    - Apply proper formatting for all quote sections
    - _Requirements: 5.9, 5.10, 6.6_

  - [x] 10.6 Implement quote save/load functionality
    - Save full quote payload to Supabase under authenticated user's ID
    - Handle save failure: show error, retain form data for retry
    - Load saved quote by ID and restore all field values exactly
    - _Requirements: 5.15, 5.16, 5.17_

  - [x]* 10.7 Write property tests for amortization calculation
    - **Property 5: Monthly Amortization Calculation**
    - **Validates: Requirements 5.3**

  - [x]* 10.8 Write property test for amortization validation guard
    - **Property 6: Amortization Validation Guard**
    - **Validates: Requirements 5.4**

  - [x]* 10.9 Write property test for term option constraints
    - **Property 7: Term Option Cardinality and Range**
    - **Validates: Requirements 5.7**

  - [x]* 10.10 Write property test for quote round-trip
    - **Property 8: Quote Save/Load Round-Trip**
    - **Validates: Requirements 5.17**

- [x] 11. PDF and Excel export
  - [x] 11.1 Implement PDF export via browser print
    - Create `src/composables/useExportPDF.ts`
    - Trigger `window.print()` with A4 pre-configuration
    - Hide form panel via CSS `@media print` rules
    - Apply `print-color-adjust: exact` for color preservation
    - Handle mobile: temporarily remove viewport scaling for correct A4 dimensions
    - Show error notification if print dialog is blocked
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.8_

  - [x] 11.2 Implement Excel export via SheetJS
    - Create `src/composables/useExportExcel.ts`
    - Install `xlsx` (SheetJS) dependency
    - Generate .xlsx with column headers matching visible table columns
    - Support up to 10,000 rows
    - Show "No data available to export" notification when data is empty
    - Handle generation failure with error notification
    - _Requirements: 6.5, 6.7, 6.8_

  - [x]* 11.3 Write property test for Excel export data integrity
    - **Property 9: Excel Export Data Integrity**
    - **Validates: Requirements 6.5**

- [x] 12. Pricelist and consumables views
  - [x] 12.1 Implement PricelistView with paginated, sortable, filterable table
    - Display all active machines: brand, model, sub-model, unit condition, cost price, sell price, margin
    - Default sort: alphabetical by brand then model
    - Make all columns sortable, brand/model/unit condition filterable
    - Paginate with default page size of 25 rows
    - Apply brand filter within 200ms
    - Add export button triggering Excel export
    - Show error state with retry on data load failure
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [x] 12.2 Implement ConsumablesView with paginated table
    - Display consumables: item name, packaging, price
    - Default sort: alphabetical by item name
    - Make all columns sortable, item name filterable
    - Paginate with default page size of 25 rows
    - Show error state with retry on data load failure
    - _Requirements: 7.3, 7.6_

  - [x] 12.3 Wire realtime updates to pricelist views
    - Subscribe to `machines` and machine sub-table changes
    - Reflect catalog updates within 30 seconds for all active sessions
    - _Requirements: 7.4_

- [x] 13. Closing documents
  - [x] 13.1 Implement ClosingDocsView with tabbed document interface
    - Create tabbed view with 6 document types: Terms & Conditions, Delivery Instructions, Warranty Card, CAC, PDC, Pullout
    - Pre-populate fields from current quote data (client name, company, address, contact, machine model, contract price, down payment, amortization, signatories)
    - Leave fields blank when corresponding quote data is unavailable
    - Retain entered data when switching between tabs
    - Discard all unsaved data on modal close
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 13.2 Implement closing document PDF export
    - Export active tab content as standalone A4 PDF via browser print
    - Embed correct letterhead image matching quote's letterhead selection
    - _Requirements: 8.4, 8.5_

- [x] 14. Product information view
  - [x] 14.1 Implement ProductInfoView with grouped reference links
    - Display links grouped by brand → model (alphabetically sorted)
    - Show display name and document type for each link
    - Open links in new browser tab on click
    - Show "no documents available" message for models with no links
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 14.2 Implement admin product info link management
    - Add/edit/delete reference links (admin only)
    - Validate URL (max 2048 chars) and display name (1–150 chars)
    - Persist and make available to all users within 2 seconds
    - Show error on validation/service failure, preserve form data
    - _Requirements: 9.5, 9.6, 9.7_

- [x] 15. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. User management
  - [x] 16.1 Implement UserManagementView with user table and CRUD
    - Display paginated user table (max 50 rows/page): display name, username, role, status
    - Create user form: username (3–64 chars, alphanumeric + underscores), display name (1–128 chars), initial password (8–128 chars), role selection
    - Provision user within 5 seconds
    - Show validation errors for invalid fields
    - Show duplicate username error
    - _Requirements: 10.1, 10.4, 10.5, 10.7_

  - [x] 16.2 Implement role change, deactivation, and reactivation
    - Change user role (applies on next authenticated request)
    - Deactivate user: invalidate sessions, prevent new logins
    - Enforce minimum 1 active admin — reject deactivation that would leave zero admins
    - Reactivate user: restore prior role, allow new sessions
    - _Requirements: 10.2, 10.3, 10.6, 10.8_

  - [x]* 16.3 Write property test for username validation
    - **Property 10: Username Validation**
    - **Validates: Requirements 10.1**

  - [x]* 16.4 Write property test for minimum admin invariant
    - **Property 11: Minimum Admin Invariant**
    - **Validates: Requirements 10.6**

- [x] 17. Real-time data sharing
  - [x] 17.1 Implement realtime subscriptions across stores
    - Subscribe `useDashboardStore` to `quotes` table changes (recalculate monthly count)
    - Subscribe `useCatalogStore` to `machines` and sub-tables (refresh machine list)
    - Subscribe `useQuoteStore` to `quotes` (update quote list for admins)
    - Subscribe `useUserStore` to `user_profiles` (update user list for admins)
    - Broadcast changes within 10 seconds (quotes) and 30 seconds (catalog)
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 17.2 Implement reconnection logic and UI warnings
    - Display non-blocking connectivity warning on disconnect
    - Attempt reconnection every 5 seconds, max 60 attempts
    - On successful reconnection: refresh data cache within 10 seconds, remove warning
    - After 60 failures: show persistent error, cease retrying until manual refresh
    - _Requirements: 11.4, 11.5, 11.6_

- [x] 18. Data migration utility
  - [x] 18.1 Implement DataMigrationView for localStorage migration
    - Create admin-only `/migrate` route and view
    - Read existing localStorage keys (machine catalog, user list)
    - Map old schema to new PostgreSQL schema
    - Batch insert with ON CONFLICT handling for duplicates
    - Track and display: records found, migrated, skipped (with reason per skip)
    - Write `migration_status` record on completion
    - Retain original localStorage data unmodified
    - Skip re-run if migration already marked complete
    - Show "no data to migrate" when localStorage is empty
    - Handle network/DB errors: stop processing, preserve data, display error with partial progress
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x]* 18.2 Write property test for migration record conservation
    - **Property 12: Migration Record Conservation**
    - **Validates: Requirements 12.2**

- [x] 19. Mobile responsiveness
  - [x] 19.1 Implement mobile-responsive Quote Builder layout
    - Two-tab mobile navigation (form panel / preview panel) for viewport < 768px
    - Preserve form data when switching tabs
    - All form fields accessible, buttons ≥ 44×44px touch targets, no horizontal overflow on 375px+
    - Input font size ≥ 16px to prevent iOS zoom
    - Scale A4 preview to full viewport width maintaining aspect ratio
    - Fixed "Save as PDF" button at bottom of viewport on preview tab (mobile)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 20. Deployment pipeline configuration
  - [x] 20.1 Configure Cloudflare Pages deployment
    - Create `_redirects` file with `/* /index.html 200` for SPA routing
    - Document environment variable setup: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
    - Ensure no credentials in source files or built output
    - Configure build command: `npm run build`, output directory: `dist`
    - Verify Lighthouse performance score ≥ 75 on dashboard view
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 21. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript throughout (frontend and tests)
- Supabase SQL migrations should be stored in a `supabase/migrations/` directory for reproducibility
- All composables follow Vue 3 Composition API patterns with `<script setup>`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "3.5"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3", "6.1"] },
    { "id": 6, "tasks": ["5.4", "5.5", "6.2", "6.3", "7.1"] },
    { "id": 7, "tasks": ["8.1", "10.1", "14.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "10.2", "10.3", "14.2"] },
    { "id": 9, "tasks": ["8.4", "10.4", "10.5"] },
    { "id": 10, "tasks": ["10.6", "10.7", "10.8", "10.9", "12.1", "12.2"] },
    { "id": 11, "tasks": ["10.10", "11.1", "11.2", "12.3", "13.1"] },
    { "id": 12, "tasks": ["11.3", "13.2", "16.1"] },
    { "id": 13, "tasks": ["16.2", "16.3", "16.4", "17.1"] },
    { "id": 14, "tasks": ["17.2", "18.1"] },
    { "id": 15, "tasks": ["18.2", "19.1"] },
    { "id": 16, "tasks": ["20.1"] }
  ]
}
```
