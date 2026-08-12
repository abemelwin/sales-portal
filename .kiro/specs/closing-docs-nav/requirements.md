# Requirements Document

## Introduction

This feature corrects navigation label mismatches between the original ESPMI Sales Portal and the current Vue implementation, and adds a standalone "Closing Docs" page accessible from the top-level navigation. The original app's navigation reads: ESPMI | Quote Generator | Machine Pricelist | Consumables Pricelist | Closing Docs | Product Info | Users | Roles | Catalog Editor. The current Vue NavBar deviates in several labels and lacks the top-level Closing Docs entry entirely.

## Glossary

- **NavBar**: The primary horizontal navigation component rendered at the top of the application for authenticated users (`NavBar.vue`).
- **Closing_Docs_Index**: A new standalone view that lists saved quotes and allows users to select one to generate closing documents.
- **Router**: The vue-router instance that maps URL paths to view components and enforces authentication guards.
- **Quote_Store**: The Pinia store (`quotes.ts`) that manages quote CRUD operations and exposes the list of quotes.
- **Authenticated_User**: A user who has successfully logged in and possesses a valid session.
- **Admin_User**: An authenticated user whose role is "admin", granting access to administrative routes and nav links.

## Requirements

### Requirement 1: Rename "Quote Builder" nav label to "Quote Generator"

**User Story:** As a sales representative, I want the navigation label to read "Quote Generator", so that it matches the original application's terminology.

#### Acceptance Criteria

1. THE NavBar SHALL display the label "Quote Generator" for the link that navigates to `/quotes/new`.
2. WHEN a user views the NavBar on any authenticated page, THE NavBar SHALL render "Quote Generator" instead of "Quote Builder".

---

### Requirement 2: Rename "Pricelist" nav label to "Machine Pricelist"

**User Story:** As a sales representative, I want the navigation to read "Machine Pricelist", so that it clearly distinguishes machine pricing from consumable pricing.

#### Acceptance Criteria

1. THE NavBar SHALL display the label "Machine Pricelist" for the link that navigates to `/pricelist`.
2. WHEN a user views the NavBar on any authenticated page, THE NavBar SHALL render "Machine Pricelist" instead of "Pricelist".

---

### Requirement 3: Rename "Consumables" nav label to "Consumables Pricelist"

**User Story:** As a sales representative, I want the navigation to read "Consumables Pricelist", so that the label matches the original application.

#### Acceptance Criteria

1. THE NavBar SHALL display the label "Consumables Pricelist" for the link that navigates to `/consumables`.
2. WHEN a user views the NavBar on any authenticated page, THE NavBar SHALL render "Consumables Pricelist" instead of "Consumables".

---

### Requirement 4: Rename "Catalog" admin nav label to "Catalog Editor"

**User Story:** As an admin user, I want the navigation to read "Catalog Editor", so that the label matches the original application.

#### Acceptance Criteria

1. THE NavBar SHALL display the label "Catalog Editor" for the admin link that navigates to `/catalog`.
2. WHILE the user's role is "admin", THE NavBar SHALL render "Catalog Editor" instead of "Catalog" in the admin navigation section.

---

### Requirement 5: Remove "Dashboard" nav link

**User Story:** As a sales representative, I want the navigation to match the original app's structure, so that the "Dashboard" link is not present since it does not exist in the original navigation.

#### Acceptance Criteria

1. THE NavBar SHALL NOT include a navigation link labeled "Dashboard".
2. WHEN a user views the NavBar on any authenticated page, THE NavBar SHALL omit any link to the `/` path from the primary navigation list.

---

### Requirement 6: Add "Closing Docs" top-level navigation link

**User Story:** As a sales representative, I want a "Closing Docs" link in the main navigation bar, so that I can access closing documents without first opening a specific quote.

#### Acceptance Criteria

1. THE NavBar SHALL include a navigation link labeled "Closing Docs" that navigates to `/closing-docs`.
2. THE NavBar SHALL position the "Closing Docs" link after "Consumables Pricelist" and before "Product Info" in the navigation order.
3. WHEN an Authenticated_User clicks the "Closing Docs" link, THE Router SHALL navigate to the `/closing-docs` route.

---

### Requirement 7: Create standalone Closing Docs Index route

**User Story:** As a sales representative, I want a standalone page at `/closing-docs` that lets me find and select a quote for closing document generation, so that I do not need to navigate to a quote first.

#### Acceptance Criteria

1. THE Router SHALL register a route at path `/closing-docs` with `meta.requiresAuth: true`.
2. WHEN an Authenticated_User navigates to `/closing-docs`, THE Router SHALL render the Closing_Docs_Index view.
3. WHEN an unauthenticated user navigates to `/closing-docs`, THE Router SHALL redirect to the login page.

---

### Requirement 8: Closing Docs Index page displays list of quotes

**User Story:** As a sales representative, I want to see a list of my saved quotes on the Closing Docs page, so that I can select the quote for which I want to generate closing documents.

#### Acceptance Criteria

1. WHEN the Closing_Docs_Index view mounts, THE Closing_Docs_Index SHALL fetch quotes from the Quote_Store.
2. THE Closing_Docs_Index SHALL display each quote showing the client name, company, and creation date.
3. WHILE the Quote_Store is loading quotes, THE Closing_Docs_Index SHALL display a loading indicator.
4. IF the Quote_Store returns an error, THEN THE Closing_Docs_Index SHALL display a user-friendly error message.
5. IF the Quote_Store returns an empty list, THEN THE Closing_Docs_Index SHALL display a message indicating no quotes are available.

---

### Requirement 9: Closing Docs Index search and filter

**User Story:** As a sales representative, I want to search or filter the quotes list by client name or company, so that I can quickly find the quote I need.

#### Acceptance Criteria

1. THE Closing_Docs_Index SHALL provide a text input for filtering quotes.
2. WHEN the user types in the filter input, THE Closing_Docs_Index SHALL filter the displayed quotes to those whose client name or company contains the entered text (case-insensitive).
3. WHEN the filter input is cleared, THE Closing_Docs_Index SHALL display all quotes.

---

### Requirement 10: Navigate from Closing Docs Index to quote closing documents

**User Story:** As a sales representative, I want to click a quote in the list to open its closing documents, so that I can generate and print closing forms for that deal.

#### Acceptance Criteria

1. THE Closing_Docs_Index SHALL render each quote as a clickable row or card.
2. WHEN the user clicks a quote entry, THE Router SHALL navigate to `/quotes/{quoteId}/closing` where `{quoteId}` is the selected quote's ID.
3. THE Closing_Docs_Index SHALL indicate each quote is interactive via cursor styling and hover state.

---

### Requirement 11: Navigation order matches original application

**User Story:** As a product owner, I want the navigation link order to exactly replicate the original application, so that users have a familiar experience.

#### Acceptance Criteria

1. THE NavBar SHALL render standard navigation links in the following order: "Quote Generator", "Machine Pricelist", "Consumables Pricelist", "Closing Docs", "Product Info".
2. WHILE the user's role is "admin", THE NavBar SHALL render admin navigation links in the following order: "Users", "Roles", "Catalog Editor".
3. THE NavBar SHALL NOT include a "Data Migration" link in the standard navigation section (it may remain as an admin-only link if needed for internal use).
