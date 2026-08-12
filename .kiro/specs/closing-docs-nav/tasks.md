# Implementation Plan: Closing Docs Navigation

## Overview

This implementation corrects navigation labels in the NavBar to match the original ESPMI application, removes the Dashboard link, adds a top-level "Closing Docs" entry, registers the new `/closing-docs` route, and creates the `ClosingDocsIndexView.vue` component with quote listing, filtering, and navigation to closing documents.

## Tasks

- [x] 1. Update NavBar labels, order, and links
  - [x] 1.1 Rename nav labels and reorder standard links in `NavBar.vue`
    - Remove the `{ to: '/', label: 'Dashboard' }` entry from `navLinks`
    - Rename "Quote Builder" to "Quote Generator"
    - Rename "Pricelist" to "Machine Pricelist"
    - Rename "Consumables" to "Consumables Pricelist"
    - Add `{ to: '/closing-docs', label: 'Closing Docs' }` between "Consumables Pricelist" and "Product Info"
    - Final order: Quote Generator, Machine Pricelist, Consumables Pricelist, Closing Docs, Product Info
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2, 6.1, 6.2, 11.1_

  - [x] 1.2 Update admin links in `NavBar.vue`
    - Rename "Catalog" to "Catalog Editor"
    - Remove "Data Migration" from `adminLinks`
    - Reorder to: Users, Roles, Catalog Editor
    - _Requirements: 4.1, 4.2, 11.2, 11.3_

- [x] 2. Register `/closing-docs` route
  - [x] 2.1 Add route record in `src/router/index.ts`
    - Add route with path `/closing-docs`, name `closing-docs-index`, lazy-imported component `@/views/ClosingDocsIndexView.vue`, and `meta: { requiresAuth: true }`
    - Place the route after the `/consumables` route and before `/product-info` for readability
    - The existing `beforeEach` guard already handles auth redirection — no guard changes needed
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Checkpoint - Verify NavBar and route changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement ClosingDocsIndexView component
  - [x] 4.1 Create `src/views/ClosingDocsIndexView.vue` with core structure
    - Create the Vue 3 SFC with `<script setup lang="ts">`
    - Import `useQuoteStore` from `@/stores/quotes` and `useRouter` from `vue-router`
    - Call `quoteStore.fetchQuotes()` on mount via `onMounted`
    - Define `searchQuery` ref for the filter input
    - Implement `filteredQuotes` computed property: if `searchQuery` is empty return all quotes; otherwise filter where `client_name` or `company` (lowercased, treating null as empty string) includes the lowercased query
    - Implement `navigateToClosing(quoteId: string)` that calls `router.push(`/quotes/${quoteId}/closing`)`
    - _Requirements: 8.1, 9.1, 9.2, 9.3, 10.2_

  - [x] 4.2 Implement the template with loading, error, empty, and list states
    - Add a page heading "Closing Docs"
    - Add the search/filter text input with placeholder text (e.g., "Filter by client or company...")
    - Show a loading indicator when `quoteStore.loading` is true
    - Show an error message when `quoteStore.error` is non-null, with a retry button that calls `fetchQuotes()` again
    - Show an empty-state message ("No quotes available") when quotes array is empty and not loading/error
    - Render each quote as a clickable card/row displaying `client_name`, `company`, and formatted `created_at` date
    - Add cursor pointer styling and hover state to indicate interactivity
    - Wire click handler to `navigateToClosing(quote.id)`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 10.1, 10.3_

  - [x] 4.3 Add scoped styles for ClosingDocsIndexView
    - Style the page container, heading, search input, quote cards/rows, loading indicator, error and empty states
    - Ensure hover/cursor styling on quote rows for interactivity indication
    - Follow existing project CSS patterns (CSS custom properties, responsive design)
    - _Requirements: 10.3_

- [x] 5. Checkpoint - Verify full feature works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Write tests for NavBar and ClosingDocsIndexView
  - [ ]* 6.1 Write unit tests for NavBar link labels and order
    - Test that standard nav links render in correct order: "Quote Generator", "Machine Pricelist", "Consumables Pricelist", "Closing Docs", "Product Info"
    - Test that "Dashboard" link is absent
    - Test that admin links render "Users", "Roles", "Catalog Editor" for admin role
    - Test that admin links are hidden for non-admin role
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 6.2, 11.1, 11.2, 11.3_

  - [ ]* 6.2 Write unit tests for ClosingDocsIndexView states
    - Test that `fetchQuotes` is called on mount
    - Test loading indicator visibility when `loading` is true
    - Test error message display when `error` is non-null
    - Test empty state message when quotes is empty
    - Test that quotes render with client name, company, and date
    - Test that clicking a quote navigates to `/quotes/{id}/closing`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_

  - [ ]* 6.3 Write property-based test for filter correctness using fast-check
    - **Property 1: Filter correctness**
    - **Validates: Requirements 9.2, 9.3**
    - Install `fast-check` as a dev dependency if not already present
    - Generate random arrays of `{ client_name: string | null, company: string | null }` objects and random search strings
    - Assert: every quote in the filtered result has `client_name.toLowerCase().includes(query)` OR `company.toLowerCase().includes(query)`
    - Assert: every quote NOT in the filtered result has neither match
    - Assert: when query is empty, all quotes are returned
    - Configure minimum 100 iterations

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses TypeScript throughout — all code examples and implementation use TypeScript/Vue 3 SFC syntax
- The existing `useQuoteStore` is reused as-is; no new store actions or types are needed
- The Dashboard route (`/`) remains registered in the router for backward compatibility but is removed from NavBar only
- Property test validates the universal filter correctness property; unit tests cover static configuration and UI states

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["4.1"] },
    { "id": 2, "tasks": ["4.2"] },
    { "id": 3, "tasks": ["4.3"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3"] }
  ]
}
```
