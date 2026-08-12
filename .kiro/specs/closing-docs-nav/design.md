# Design Document: closing-docs-nav

## Overview

This feature corrects navigation label mismatches in the ESPMI Sales Portal's NavBar component to match the original application, removes the "Dashboard" nav link, adds a top-level "Closing Docs" entry, and creates a new standalone Closing Docs Index view. The index view lists saved quotes so users can select one and navigate to its closing document generation page without first opening a specific quote.

The changes span three areas:
1. **NavBar configuration** — rename labels, reorder links, remove Dashboard, add Closing Docs
2. **Router** — register the new `/closing-docs` route with auth guard
3. **New view** — `ClosingDocsIndexView.vue` that fetches, filters, and displays quotes for selection

## Architecture

The feature integrates into the existing Vue 3 component architecture without introducing new layers or dependencies.

```mermaid
graph TD
    subgraph Navigation
        NB[NavBar.vue] -->|router-link| CDI[/closing-docs]
    end

    subgraph Router
        R[router/index.ts] -->|route record| CDIV[ClosingDocsIndexView.vue]
        R -->|auth guard| Login[LoginView.vue]
    end

    subgraph ClosingDocsIndex
        CDIV -->|fetchQuotes| QS[useQuoteStore]
        CDIV -->|filter logic| FL[computed filter]
        CDIV -->|click row| CDV[/quotes/:id/closing]
    end

    subgraph Existing
        QS -->|Supabase| DB[(quotes table)]
        CDV --> ECV[ClosingDocsView.vue]
    end
```

**Design decisions:**
- The new view reuses the existing `useQuoteStore` for data fetching rather than creating a separate store. The store already provides `fetchQuotes()` which returns all quotes with sub-records.
- Filtering is implemented as a `computed` property inside the view component, keeping the logic co-located with its only consumer and avoiding store pollution.
- The Dashboard route (`/`) remains registered for backward compatibility (bookmarks, direct URLs) but its link is removed from the NavBar.

## Components and Interfaces

### Modified: `NavBar.vue`

**Changes:**
- `navLinks` array updated:
  - Remove `{ to: '/', label: 'Dashboard' }`
  - Rename labels: "Quote Builder" → "Quote Generator", "Pricelist" → "Machine Pricelist", "Consumables" → "Consumables Pricelist"
  - Add `{ to: '/closing-docs', label: 'Closing Docs' }` between "Consumables Pricelist" and "Product Info"
- `adminLinks` array updated:
  - Rename "Catalog" → "Catalog Editor"
  - Remove "Data Migration" from the admin links array (route remains for direct access)
  - Reorder to: Users, Roles, Catalog Editor

**Final `navLinks`:**
```typescript
const navLinks = [
  { to: '/quotes/new', label: 'Quote Generator' },
  { to: '/pricelist', label: 'Machine Pricelist' },
  { to: '/consumables', label: 'Consumables Pricelist' },
  { to: '/closing-docs', label: 'Closing Docs' },
  { to: '/product-info', label: 'Product Info' },
]
```

**Final `adminLinks`:**
```typescript
const adminLinks = [
  { to: '/users', label: 'Users' },
  { to: '/roles', label: 'Roles' },
  { to: '/catalog', label: 'Catalog Editor' },
]
```

### Modified: `router/index.ts`

**Changes:**
- Add new route record:
```typescript
{
  path: '/closing-docs',
  name: 'closing-docs-index',
  component: () => import('@/views/ClosingDocsIndexView.vue'),
  meta: { requiresAuth: true }
}
```

The existing `beforeEach` guard already handles `requiresAuth`, so no guard changes are needed.

### New: `ClosingDocsIndexView.vue`

**Responsibilities:**
- On mount, calls `quoteStore.fetchQuotes()` to load the full quote list
- Displays each quote as a clickable card/row showing client name, company, and creation date
- Provides a text input for case-insensitive filtering by client name or company
- On row click, navigates to `/quotes/{id}/closing`
- Handles loading, error, and empty states

**Component interface:**

```typescript
// Internal state
const searchQuery = ref('')
const quoteStore = useQuoteStore()

// Computed filtered list
const filteredQuotes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return quoteStore.quotes
  return quoteStore.quotes.filter(q =>
    (q.client_name ?? '').toLowerCase().includes(query) ||
    (q.company ?? '').toLowerCase().includes(query)
  )
})
```

**Props:** None (standalone view)
**Emits:** None
**Slots:** None

## Data Models

No new database tables or store state is required. The feature uses the existing `Quote` interface from `@/types`:

```typescript
// Relevant fields for the index view display
interface Quote {
  id: string
  client_name: string | null
  company: string | null
  created_at: string
  // ... other fields exist but are not displayed in the index
}
```

The `useQuoteStore` already provides:
- `quotes: Ref<Quote[]>` — the full list
- `loading: Ref<boolean>` — fetch in progress
- `error: Ref<string | null>` — fetch error message
- `fetchQuotes(): Promise<void>` — loads all quotes

No new types, payloads, or store actions are introduced.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Prework Analysis

Acceptance Criteria Testing Prework:

1.1 THE NavBar SHALL display the label "Quote Generator" for the link that navigates to `/quotes/new`.
  Thoughts: This is a static label configuration. Either the label is correct or it isn't.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting rendered nav contains "Quote Generator" text with correct href.

1.2 WHEN a user views the NavBar on any authenticated page, THE NavBar SHALL render "Quote Generator" instead of "Quote Builder".
  Thoughts: Same as 1.1, redundant acceptance criteria for the same requirement.
  Classification: EXAMPLE
  Test Strategy: Covered by 1.1 test.

2.1 THE NavBar SHALL display the label "Machine Pricelist" for the link that navigates to `/pricelist`.
  Thoughts: Static label check.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting rendered nav contains "Machine Pricelist" with correct href.

2.2 Same as 2.1 — redundant criteria.
  Classification: EXAMPLE

3.1 THE NavBar SHALL display the label "Consumables Pricelist" for the link that navigates to `/consumables`.
  Classification: EXAMPLE
  Test Strategy: Unit test on rendered label text.

3.2 Same as 3.1.
  Classification: EXAMPLE

4.1 THE NavBar SHALL display the label "Catalog Editor" for the admin link that navigates to `/catalog`.
  Classification: EXAMPLE
  Test Strategy: Unit test with admin role asserting "Catalog Editor" label.

4.2 Same as 4.1.
  Classification: EXAMPLE

5.1 THE NavBar SHALL NOT include a navigation link labeled "Dashboard".
  Thoughts: Absence check — verify no "Dashboard" text in rendered nav.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting "Dashboard" does not appear in rendered nav links.

5.2 THE NavBar SHALL omit any link to the `/` path from the primary navigation list.
  Thoughts: Same intent as 5.1 but checking href instead of text.
  Classification: EXAMPLE
  Test Strategy: Covered by 5.1 test (check both text and href).

6.1 THE NavBar SHALL include a navigation link labeled "Closing Docs" that navigates to `/closing-docs`.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting "Closing Docs" link exists with correct href.

6.2 THE NavBar SHALL position the "Closing Docs" link after "Consumables Pricelist" and before "Product Info".
  Thoughts: Order verification. Could be a property across all possible nav configurations, but there's only one fixed configuration — not meaningful to randomize.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting link order matches expected array.

6.3 WHEN an Authenticated_User clicks the "Closing Docs" link, THE Router SHALL navigate to the `/closing-docs` route.
  Classification: EXAMPLE
  Test Strategy: Integration test with router mock verifying navigation.

7.1 THE Router SHALL register a route at path `/closing-docs` with `meta.requiresAuth: true`.
  Classification: SMOKE
  Test Strategy: Unit test asserting route exists in router config with correct meta.

7.2 WHEN an Authenticated_User navigates to `/closing-docs`, THE Router SHALL render the Closing_Docs_Index view.
  Classification: EXAMPLE
  Test Strategy: Integration test navigating to route and checking mounted component.

7.3 WHEN an unauthenticated user navigates to `/closing-docs`, THE Router SHALL redirect to the login page.
  Classification: EXAMPLE
  Test Strategy: Integration test with unauthenticated state asserting redirect to login.

8.1 WHEN the Closing_Docs_Index view mounts, THE Closing_Docs_Index SHALL fetch quotes from the Quote_Store.
  Thoughts: One-time behavior on mount. Not input-varying.
  Classification: EXAMPLE
  Test Strategy: Unit test verifying fetchQuotes is called on mount.

8.2 THE Closing_Docs_Index SHALL display each quote showing the client name, company, and creation date.
  Thoughts: For any quote in the list, the rendered output should contain these three fields. This varies with input (different quotes produce different display). However, it's really testing rendering, which is better as a snapshot or example test.
  Classification: EXAMPLE
  Test Strategy: Unit test with mock quote data verifying all three fields are rendered.

8.3 WHILE the Quote_Store is loading quotes, THE Closing_Docs_Index SHALL display a loading indicator.
  Classification: EXAMPLE
  Test Strategy: Unit test setting loading=true and asserting loading indicator is visible.

8.4 IF the Quote_Store returns an error, THEN THE Closing_Docs_Index SHALL display a user-friendly error message.
  Classification: EXAMPLE
  Test Strategy: Unit test setting error state and asserting error message is displayed.

8.5 IF the Quote_Store returns an empty list, THEN THE Closing_Docs_Index SHALL display a message indicating no quotes are available.
  Classification: EXAMPLE
  Test Strategy: Unit test with empty quotes array asserting empty state message.

9.1 THE Closing_Docs_Index SHALL provide a text input for filtering quotes.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting filter input element exists.

9.2 WHEN the user types in the filter input, THE Closing_Docs_Index SHALL filter the displayed quotes to those whose client name or company contains the entered text (case-insensitive).
  Thoughts: This is the one property-testable criterion. The filter function is a pure function: given any list of quotes and any search string, the output should only contain quotes where client_name or company (lowercased) includes the search string (lowercased). This holds for ALL possible inputs. Behavior varies meaningfully with input. 100 iterations would catch edge cases (null fields, special characters, unicode).
  Classification: PROPERTY
  Test Strategy: Generate random quote lists and random search strings. Verify all returned quotes match the filter criterion, and all non-returned quotes do NOT match.

9.3 WHEN the filter input is cleared, THE Closing_Docs_Index SHALL display all quotes.
  Thoughts: This is the identity case of 9.2 — when search string is empty, all quotes are returned. This is subsumed by the property in 9.2 (empty string is included in "for all search strings").
  Classification: EDGE_CASE
  Test Strategy: Covered by the property test for 9.2 when the generator produces an empty string.

10.1 THE Closing_Docs_Index SHALL render each quote as a clickable row or card.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting quotes are rendered as interactive elements.

10.2 WHEN the user clicks a quote entry, THE Router SHALL navigate to `/quotes/{quoteId}/closing`.
  Classification: EXAMPLE
  Test Strategy: Unit test with router mock verifying navigation to correct path on click.

10.3 THE Closing_Docs_Index SHALL indicate each quote is interactive via cursor styling and hover state.
  Thoughts: CSS styling verification — not a functional property.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting the clickable element has appropriate class/role.

11.1 THE NavBar SHALL render standard navigation links in the following order: "Quote Generator", "Machine Pricelist", "Consumables Pricelist", "Closing Docs", "Product Info".
  Classification: EXAMPLE
  Test Strategy: Unit test extracting rendered link texts in order and comparing to expected array.

11.2 WHILE the user's role is "admin", THE NavBar SHALL render admin navigation links in the following order: "Users", "Roles", "Catalog Editor".
  Classification: EXAMPLE
  Test Strategy: Unit test with admin role extracting admin link texts and comparing to expected array.

11.3 THE NavBar SHALL NOT include a "Data Migration" link in the standard navigation section.
  Classification: EXAMPLE
  Test Strategy: Unit test asserting "Data Migration" does not appear in standard nav (only admin section if at all).

### Analysis Summary

Only one criterion (9.2) qualifies as a property. Criterion 9.3 is subsumed by 9.2 (empty string is a valid input to the universal quantifier). No redundancy to eliminate.

### Property 1: Filter correctness

*For any* list of quotes and *for any* search string, the filtered result SHALL contain exactly those quotes where `client_name` (lowercased) or `company` (lowercased) contains the search string (lowercased), and no others.

**Validates: Requirements 9.2, 9.3**

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Quote fetch fails (network/Supabase error) | Display error message from store with option to retry |
| Quote list is empty | Display "No quotes available" message with guidance |
| Quote has null `client_name` and `company` | Treat as empty string for display and filtering; show "—" placeholder in UI |
| Router navigation to `/closing-docs` while unauthenticated | Redirect to login page (handled by existing `beforeEach` guard) |
| Invalid quote ID when navigating to closing docs | Handled by existing `ClosingDocsView.vue` error state |

No new error types or error boundaries are needed. The existing store error pattern (`error: Ref<string | null>`) is sufficient.

## Testing Strategy

### Unit Tests (Example-Based)

**NavBar tests:**
- Assert each standard nav link renders with correct label and href
- Assert link order matches: "Quote Generator", "Machine Pricelist", "Consumables Pricelist", "Closing Docs", "Product Info"
- Assert "Dashboard" link is absent
- Assert admin links render correctly for admin role: "Users", "Roles", "Catalog Editor"
- Assert admin links are hidden for non-admin role

**Router tests:**
- Assert `/closing-docs` route exists with `requiresAuth: true`
- Assert unauthenticated access redirects to login
- Assert authenticated access renders the index view

**ClosingDocsIndexView tests:**
- Assert `fetchQuotes` is called on mount
- Assert quotes are displayed with client name, company, and formatted date
- Assert loading indicator appears when `loading` is true
- Assert error message appears when `error` is non-null
- Assert empty state message appears when quotes array is empty
- Assert filter input is rendered
- Assert clicking a quote row navigates to `/quotes/{id}/closing`

### Property-Based Tests

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (standard PBT library for TypeScript/JavaScript)

**Configuration:** Minimum 100 iterations per property test.

**Property 1: Filter correctness**
- Tag: **Feature: closing-docs-nav, Property 1: For any list of quotes and for any search string, the filtered result SHALL contain exactly those quotes where client_name or company contains the search string (case-insensitive)**
- Generator: Produce arrays of `{ client_name: string | null, company: string | null }` objects and arbitrary search strings
- Assertion: Every quote in the filtered result has `client_name.toLowerCase().includes(query)` OR `company.toLowerCase().includes(query)`. Every quote NOT in the result has neither match.

### Why PBT is Limited Here

Most requirements in this feature are static UI configuration (label text, link order, route registration) or simple integration (fetch on mount, navigate on click). These are deterministic and do not vary meaningfully with input. Only the filter logic (Requirement 9) operates over a variable input space, making it the sole candidate for property-based testing. The remaining requirements are best covered by example-based unit tests.
