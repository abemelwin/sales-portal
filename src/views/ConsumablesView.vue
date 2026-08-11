<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { usePagination } from '@/composables/usePagination'
import { useRealtime } from '@/composables/useRealtime'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsumableRow {
  id: string
  item_name: string
  package_description: string | null
  default_price: number
}

type SortColumn = 'item_name' | 'package_description' | 'default_price'
type SortDirection = 'asc' | 'desc'

// ─── State ────────────────────────────────────────────────────────────────────

const consumables = ref<ConsumableRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filterText = ref('')
const sortColumn = ref<SortColumn>('item_name')
const sortDirection = ref<SortDirection>('asc')

// ─── Pagination ───────────────────────────────────────────────────────────────

const { currentPage, pageSize, totalPages, totalCount, nextPage, prevPage, goToPage, setTotalCount } =
  usePagination({ pageSize: 25 })

// ─── Realtime Subscription ────────────────────────────────────────────────────
// Subscribe to machine_consumables table changes so that catalog updates
// are reflected within 30 seconds for all active sessions (Requirement 7.4)

const { subscribe: subscribeConsumables } = useRealtime('machine_consumables', () => {
  fetchConsumables()
})

// ─── Computed ─────────────────────────────────────────────────────────────────

/** Filter consumables by item name */
const filteredConsumables = computed(() => {
  const filter = filterText.value.trim().toLowerCase()
  if (!filter) return consumables.value
  return consumables.value.filter((c) =>
    c.item_name.toLowerCase().includes(filter)
  )
})

/** Sort filtered consumables */
const sortedConsumables = computed(() => {
  const items = [...filteredConsumables.value]
  const col = sortColumn.value
  const dir = sortDirection.value

  items.sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''

    if (col === 'item_name') {
      aVal = a.item_name.toLowerCase()
      bVal = b.item_name.toLowerCase()
    } else if (col === 'package_description') {
      aVal = (a.package_description ?? '').toLowerCase()
      bVal = (b.package_description ?? '').toLowerCase()
    } else if (col === 'default_price') {
      aVal = a.default_price
      bVal = b.default_price
    }

    if (aVal < bVal) return dir === 'asc' ? -1 : 1
    if (aVal > bVal) return dir === 'asc' ? 1 : -1
    return 0
  })

  return items
})

/** Paginated slice of sorted consumables */
const paginatedConsumables = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedConsumables.value.slice(start, end)
})

// ─── Watchers ─────────────────────────────────────────────────────────────────

// Update total count whenever filtered list changes
watch(sortedConsumables, (items) => {
  setTotalCount(items.length)
}, { immediate: true })

// Reset to first page when filter changes
watch(filterText, () => {
  goToPage(1)
})

// ─── Actions ──────────────────────────────────────────────────────────────────

async function fetchConsumables(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('machine_consumables')
      .select('id, item_name, package_description, default_price')
      .order('item_name', { ascending: true })

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    consumables.value = (data as ConsumableRow[]) ?? []
  } catch (err) {
    error.value = 'An unexpected error occurred while loading consumables data.'
  } finally {
    loading.value = false
  }
}

function toggleSort(column: SortColumn): void {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getSortIndicator(column: SortColumn): string {
  if (sortColumn.value !== column) return ''
  return sortDirection.value === 'asc' ? ' ▲' : ' ▼'
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchConsumables()
  // Activate realtime subscription for live updates
  subscribeConsumables()
})
</script>

<template>
  <div class="consumables-view">
    <h1>Consumables Pricelist</h1>

    <!-- Filter bar -->
    <div class="toolbar">
      <div class="filter-group">
        <label for="item-filter">Filter by item name:</label>
        <input
          id="item-filter"
          v-model="filterText"
          type="text"
          placeholder="Search consumables..."
          class="filter-input"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="state-message loading-state">
      <p>Loading consumables data...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="state-message error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchConsumables">Retry</button>
    </div>

    <!-- Data table -->
    <div v-else>
      <div v-if="sortedConsumables.length === 0" class="state-message empty-state">
        <p>No consumables found{{ filterText ? ' matching your filter' : '' }}.</p>
      </div>

      <div v-else class="table-container">
        <table class="consumables-table">
          <thead>
            <tr>
              <th
                class="sortable"
                @click="toggleSort('item_name')"
                role="columnheader"
                aria-sort="none"
              >
                Item Name{{ getSortIndicator('item_name') }}
              </th>
              <th
                class="sortable"
                @click="toggleSort('package_description')"
                role="columnheader"
                aria-sort="none"
              >
                Packaging{{ getSortIndicator('package_description') }}
              </th>
              <th
                class="sortable"
                @click="toggleSort('default_price')"
                role="columnheader"
                aria-sort="none"
              >
                Price{{ getSortIndicator('default_price') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consumable in paginatedConsumables" :key="consumable.id">
              <td>{{ consumable.item_name }}</td>
              <td>{{ consumable.package_description ?? '—' }}</td>
              <td class="price-cell">{{ formatPrice(consumable.default_price) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination controls -->
        <div class="pagination">
          <button
            class="pagination-btn"
            :disabled="currentPage <= 1"
            @click="prevPage"
          >
            Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }} ({{ totalCount }} items)
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage >= totalPages"
            @click="nextPage"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.consumables-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.consumables-view h1 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 4px;
  font-size: 1rem;
  min-width: 220px;
  min-height: 44px;
}

.filter-input:focus {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 1px;
}

.state-message {
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
}

.loading-state {
  color: var(--color-text-muted, #6b7280);
}

.error-state {
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border, #fecaca);
  color: var(--color-error, #dc2626);
}

.error-state p {
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1.25rem;
  background: var(--color-primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.retry-btn:hover {
  background: var(--color-primary-hover, #1d4ed8);
}

.empty-state {
  color: var(--color-text-muted, #6b7280);
}

.table-container {
  overflow-x: auto;
}

.consumables-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.consumables-table th,
.consumables-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.consumables-table thead th {
  background: var(--color-table-header-bg, #f9fafb);
  font-weight: 600;
  position: sticky;
  top: 0;
  white-space: nowrap;
}

.consumables-table th.sortable {
  cursor: pointer;
  user-select: none;
  min-height: 44px;
}

.consumables-table th.sortable:hover {
  background: var(--color-table-header-hover, #f3f4f6);
}

.consumables-table tbody tr:hover {
  background: var(--color-row-hover, #f9fafb);
}

.price-cell {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 4px;
  background: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-table-header-bg, #f9fafb);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
}

@media (max-width: 768px) {
  .consumables-view {
    padding: 1rem;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-input {
    min-width: unset;
    width: 100%;
  }
}
</style>
