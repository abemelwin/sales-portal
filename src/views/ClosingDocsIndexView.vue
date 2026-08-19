<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuoteStore } from '@/stores/quotes'

const router = useRouter()
const quoteStore = useQuoteStore()

// ─── State ──────────────────────────────────────────────────────────────────────

const searchQuery = ref('')

// ─── Computed ───────────────────────────────────────────────────────────────────

const filteredQuotes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return quoteStore.quotes
  return quoteStore.quotes.filter(q =>
    (q.client_name ?? '').toLowerCase().includes(query) ||
    (q.company ?? '').toLowerCase().includes(query)
  )
})

// ─── Actions ────────────────────────────────────────────────────────────────────

function navigateToClosing(quoteId: string) {
  router.push(`/quotes/${quoteId}/closing`)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────────

onMounted(() => {
  quoteStore.fetchQuotes()
})
</script>

<template>
  <div class="closing-docs-index">
    <h2 class="closing-docs-index__title">Closing Docs</h2>

    <div class="closing-docs-index__search">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Filter by client or company..."
        class="closing-docs-index__search-input"
      />
    </div>

    <!-- Loading -->
    <div v-if="quoteStore.loading" class="closing-docs-index__loading" role="status">
      Loading quotes...
    </div>

    <!-- Error -->
    <div v-else-if="quoteStore.error" class="closing-docs-index__error" role="alert">
      <p>{{ quoteStore.error }}</p>
      <button @click="quoteStore.fetchQuotes()">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredQuotes.length === 0" class="closing-docs-index__empty">
      No quotes available.
    </div>

    <!-- Quote List -->
    <div v-else class="closing-docs-index__list">
      <div
        v-for="quote in filteredQuotes"
        :key="quote.id"
        class="closing-docs-index__card"
        @click="navigateToClosing(quote.id)"
        @keydown.enter="navigateToClosing(quote.id)"
        @keydown.space.prevent="navigateToClosing(quote.id)"
        tabindex="0"
        role="button"
      >
        <span class="closing-docs-index__client">{{ quote.client_name || '—' }}</span>
        <span class="closing-docs-index__company">{{ quote.company || '—' }}</span>
        <span class="closing-docs-index__date">{{ formatDate(quote.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page container */
.closing-docs-index {
  padding: var(--space-6);
}

/* Heading */
.closing-docs-index__title {
  font-size: var(--font-size-2xl);
  color: var(--color-gray-900);
  margin-bottom: var(--space-6);
}

/* Search wrapper */
.closing-docs-index__search {
  margin-bottom: var(--space-6);
}

/* Search input */
.closing-docs-index__search-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.closing-docs-index__search-input::placeholder {
  color: var(--color-gray-400);
}

.closing-docs-index__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

/* Loading state */
.closing-docs-index__loading {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

/* Error state */
.closing-docs-index__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  text-align: center;
}

.closing-docs-index__error p {
  color: var(--color-error);
  font-size: var(--font-size-base);
  margin: 0;
}

.closing-docs-index__error button {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.closing-docs-index__error button:hover {
  background-color: var(--color-primary-hover);
}

/* Empty state */
.closing-docs-index__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-gray-500);
  font-size: var(--font-size-base);
}

/* Quote list container */
.closing-docs-index__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Quote card/row */
.closing-docs-index__card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.closing-docs-index__card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.closing-docs-index__card:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-light);
  border-color: var(--color-primary);
}

/* Client name — primary text */
.closing-docs-index__client {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Company — secondary muted text */
.closing-docs-index__company {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Date — aligned right */
.closing-docs-index__date {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  white-space: nowrap;
  margin-left: auto;
}

/* Mobile responsiveness */
@media screen and (max-width: 767px) {
  .closing-docs-index {
    padding: var(--space-4);
  }

  .closing-docs-index__search-input {
    font-size: 16px;
    padding: 10px 12px;
  }

  .closing-docs-index__card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    min-height: 44px;
  }

  .closing-docs-index__date {
    margin-left: 0;
  }
}
</style>
