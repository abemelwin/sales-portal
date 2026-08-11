<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { usePagination } from '@/composables/usePagination'
import { useExportExcel } from '@/composables/useExportExcel'
import { useRealtime } from '@/composables/useRealtime'
import type { Machine, PricelistRow } from '@/types'

// ─── Store & Composables ────────────────────────────────────────────────────

const catalogStore = useCatalogStore()
const pagination = usePagination({ pageSize: 25 })
const { exportToExcel } = useExportExcel()

// ─── Realtime Subscriptions ─────────────────────────────────────────────────
// Subscribe to machines table changes so that catalog updates from any admin
// are reflected within 30 seconds for all active sessions (Requirement 7.4)

const { subscribe: subscribeMachines } = useRealtime('machines', () => {
  catalogStore.fetchMachines({ is_active: true })
})

const { subscribe: subscribeFeatures } = useRealtime('machine_features', () => {
  catalogStore.fetchMachines({ is_active: true })
})

const { subscribe: subscribeConsumables } = useRealtime('machine_consumables', () => {
  catalogStore.fetchMachines({ is_active: true })
})

const { subscribe: subscribeInclusions } = useRealtime('machine_inclusions', () => {
  catalogStore.fetchMachines({ is_active: true })
})

const { subscribe: subscribeExclusions } = useRealtime('machine_exclusions', () => {
  catalogStore.fetchMachines({ is_active: true })
})

const { subscribe: subscribeAddons } = useRealtime('machine_addons', () => {
  catalogStore.fetchMachines({ is_active: true })
})

// ─── Filter State ───────────────────────────────────────────────────────────

const brandFilter = ref('')
const modelFilter = ref('')
const unitConditionFilter = ref('')

// ─── Sort State ─────────────────────────────────────────────────────────────

type SortColumn = 'brand' | 'model' | 'sub_model' | 'unit_condition' | 'cost_price' | 'sell_price' | 'margin'
type SortDirection = 'asc' | 'desc'

const sortColumn = ref<SortColumn>('brand')
const sortDirection = ref<SortDirection>('asc')

// ─── Error & Notification State ─────────────────────────────────────────────

const exportError = ref<string | null>(null)
const exportSuccess = ref(false)

// ─── Derived Data ───────────────────────────────────────────────────────────

/** Map machines to pricelist rows with computed pricing fields */
function machineToPricelistRow(machine: Machine): PricelistRow {
  // Compute cost_price from consumables default prices sum (or 0 if none)
  // In a real scenario, cost/sell/margin would come from dedicated DB columns.
  // For this implementation, we use placeholder values since the Machine type
  // doesn't have explicit cost/sell/margin fields — these would typically be added
  // to the machines table or computed from a pricing table.
  return {
    id: machine.id,
    brand: machine.brand,
    model: machine.model,
    sub_model: machine.sub_model,
    unit_condition: machine.unit_condition,
    cost_price: undefined,
    sell_price: undefined,
    margin: undefined,
  }
}

/** Unique filter options derived from loaded machines */
const brandOptions = computed(() => {
  const brands = [...new Set(catalogStore.machines.map((m) => m.brand))]
  return brands.sort()
})

const modelOptions = computed(() => {
  let machines = catalogStore.machines
  if (brandFilter.value) {
    machines = machines.filter((m) => m.brand === brandFilter.value)
  }
  const models = [...new Set(machines.map((m) => m.model))]
  return models.sort()
})

const unitConditionOptions = computed(() => {
  const conditions = [...new Set(catalogStore.machines.map((m) => m.unit_condition))]
  return conditions.sort()
})

/** Filtered rows — applies brand, model, and unit condition filters */
const filteredRows = computed<PricelistRow[]>(() => {
  let rows = catalogStore.machines.map(machineToPricelistRow)

  if (brandFilter.value) {
    rows = rows.filter((r) => r.brand === brandFilter.value)
  }
  if (modelFilter.value) {
    rows = rows.filter((r) => r.model === modelFilter.value)
  }
  if (unitConditionFilter.value) {
    rows = rows.filter((r) => r.unit_condition === unitConditionFilter.value)
  }

  return rows
})

/** Sorted rows — applies current sort column and direction */
const sortedRows = computed<PricelistRow[]>(() => {
  const rows = [...filteredRows.value]
  const col = sortColumn.value
  const dir = sortDirection.value

  rows.sort((a, b) => {
    let aVal = a[col] ?? ''
    let bVal = b[col] ?? ''

    // Secondary sort by model when primary sort is brand
    if (col === 'brand' && aVal === bVal) {
      aVal = a.model
      bVal = b.model
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    if (aStr < bStr) return dir === 'asc' ? -1 : 1
    if (aStr > bStr) return dir === 'asc' ? 1 : -1
    return 0
  })

  return rows
})

/** Paginated rows — slices sorted data for current page */
const paginatedRows = computed<PricelistRow[]>(() => {
  const start = pagination.offset.value
  const end = start + pagination.pageSize.value
  return sortedRows.value.slice(start, end)
})

// ─── Watchers ───────────────────────────────────────────────────────────────

// Update total count when filtered data changes
watch(filteredRows, (rows) => {
  pagination.setTotalCount(rows.length)
}, { immediate: true })

// Reset to page 1 when filters change
watch([brandFilter, modelFilter, unitConditionFilter], () => {
  pagination.goToPage(1)
})

// Reset model filter when brand changes (model options are dependent on brand)
watch(brandFilter, () => {
  modelFilter.value = ''
})

// ─── Actions ────────────────────────────────────────────────────────────────

async function loadData() {
  await catalogStore.fetchMachines({ is_active: true })
}

function toggleSort(column: SortColumn) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getSortIndicator(column: SortColumn): string {
  if (sortColumn.value !== column) return ''
  return sortDirection.value === 'asc' ? ' \u25B2' : ' \u25BC'
}

function handleExport() {
  exportError.value = null
  exportSuccess.value = false

  const exportData = filteredRows.value.map((row) => ({
    Brand: row.brand,
    Model: row.model,
    'Sub-Model': row.sub_model ?? '',
    'Unit Condition': row.unit_condition,
    'Cost Price': row.cost_price ?? '',
    'Sell Price': row.sell_price ?? '',
    Margin: row.margin ?? '',
  }))

  const result = exportToExcel(exportData, {
    filename: 'Machine_Pricelist',
    sheetName: 'Pricelist',
  })

  if (!result.success) {
    exportError.value = result.error ?? 'Export failed'
  } else {
    exportSuccess.value = true
    setTimeout(() => { exportSuccess.value = false }, 3000)
  }
}

function clearFilters() {
  brandFilter.value = ''
  modelFilter.value = ''
  unitConditionFilter.value = ''
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  loadData()
  // Activate realtime subscriptions for live updates
  subscribeMachines()
  subscribeFeatures()
  subscribeConsumables()
  subscribeInclusions()
  subscribeExclusions()
  subscribeAddons()
})
</script>

<template>
  <div class="pricelist-view">
    <!-- Header -->
    <div class="pricelist-header">
      <h1>Machine Pricelist</h1>
      <button
        class="btn btn-primary"
        :disabled="filteredRows.length === 0"
        @click="handleExport"
      >
        Export to Excel
      </button>
    </div>

    <!-- Export notifications -->
    <div v-if="exportError" class="notification notification-error" role="alert">
      {{ exportError }}
      <button class="notification-close" @click="exportError = null">&times;</button>
    </div>
    <div v-if="exportSuccess" class="notification notification-success" role="status">
      Pricelist exported successfully.
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label for="filter-brand" class="filter-label">Brand</label>
        <select id="filter-brand" v-model="brandFilter" class="filter-select">
          <option value="">All Brands</option>
          <option v-for="brand in brandOptions" :key="brand" :value="brand">
            {{ brand }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-model" class="filter-label">Model</label>
        <select id="filter-model" v-model="modelFilter" class="filter-select">
          <option value="">All Models</option>
          <option v-for="model in modelOptions" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-condition" class="filter-label">Unit Condition</label>
        <select id="filter-condition" v-model="unitConditionFilter" class="filter-select">
          <option value="">All Conditions</option>
          <option v-for="cond in unitConditionOptions" :key="cond" :value="cond">
            {{ cond }}
          </option>
        </select>
      </div>

      <button
        v-if="brandFilter || modelFilter || unitConditionFilter"
        class="btn btn-text"
        @click="clearFilters"
      >
        Clear Filters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="catalogStore.loading" class="state-card state-loading" role="status">
      <p>Loading pricelist data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="catalogStore.error" class="state-card state-error" role="alert">
      <p>{{ catalogStore.error }}</p>
      <button class="btn btn-primary" @click="loadData">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredRows.length === 0" class="state-card state-empty">
      <p>No machines found matching the current filters.</p>
    </div>

    <!-- Data Table -->
    <div v-else class="table-wrapper">
      <table class="data-table" aria-label="Machine Pricelist">
        <thead>
          <tr>
            <th
              class="sortable-header"
              @click="toggleSort('brand')"
              aria-sort="none"
            >
              Brand{{ getSortIndicator('brand') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('model')"
            >
              Model{{ getSortIndicator('model') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('sub_model')"
            >
              Sub-Model{{ getSortIndicator('sub_model') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('unit_condition')"
            >
              Unit Condition{{ getSortIndicator('unit_condition') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('cost_price')"
            >
              Cost Price{{ getSortIndicator('cost_price') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('sell_price')"
            >
              Sell Price{{ getSortIndicator('sell_price') }}
            </th>
            <th
              class="sortable-header"
              @click="toggleSort('margin')"
            >
              Margin{{ getSortIndicator('margin') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedRows" :key="row.id">
            <td>{{ row.brand }}</td>
            <td>{{ row.model }}</td>
            <td>{{ row.sub_model ?? '—' }}</td>
            <td>{{ row.unit_condition }}</td>
            <td class="cell-numeric">{{ row.cost_price != null ? row.cost_price.toLocaleString() : '—' }}</td>
            <td class="cell-numeric">{{ row.sell_price != null ? row.sell_price.toLocaleString() : '—' }}</td>
            <td class="cell-numeric">{{ row.margin != null ? row.margin.toLocaleString() : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!catalogStore.loading && !catalogStore.error && filteredRows.length > 0" class="pagination-bar">
      <span class="pagination-info">
        Showing {{ pagination.offset.value + 1 }}–{{ Math.min(pagination.offset.value + pagination.pageSize.value, filteredRows.length) }}
        of {{ filteredRows.length }} machines
      </span>
      <div class="pagination-controls">
        <button
          class="btn btn-sm"
          :disabled="pagination.currentPage.value <= 1"
          @click="pagination.prevPage()"
        >
          Previous
        </button>
        <span class="pagination-page">
          Page {{ pagination.currentPage.value }} of {{ pagination.totalPages.value }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="pagination.currentPage.value >= pagination.totalPages.value"
          @click="pagination.nextPage()"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pricelist-view {
  padding: var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.pricelist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.pricelist-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
}

/* ─── Buttons ──────────────────────────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  min-height: 36px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
}

.btn-text:hover {
  text-decoration: underline;
}

/* ─── Notifications ────────────────────────────────────────────────────────── */

.notification {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.notification-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.notification-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.notification-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: 0 var(--space-2);
  min-height: auto;
  min-width: auto;
  line-height: 1;
}

/* ─── Filters ──────────────────────────────────────────────────────────────── */

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.filter-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
  min-width: 160px;
  cursor: pointer;
}

.filter-select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* ─── State Cards ──────────────────────────────────────────────────────────── */

.state-card {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.state-card p {
  margin-bottom: var(--space-4);
  color: var(--color-gray-600);
}

.state-error p {
  color: var(--color-error);
}

/* ─── Table ────────────────────────────────────────────────────────────────── */

.table-wrapper {
  overflow-x: auto;
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table thead {
  background-color: var(--color-gray-50);
  border-bottom: 2px solid var(--border-color);
}

.data-table th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-700);
  white-space: nowrap;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--color-gray-800);
}

.data-table tbody tr:hover {
  background-color: var(--color-gray-50);
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.sortable-header:hover {
  color: var(--color-primary);
}

.cell-numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ─── Pagination ───────────────────────────────────────────────────────────── */

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.pagination-page {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  font-weight: 500;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */

@media screen and (max-width: 767px) {
  .pricelist-view {
    padding: var(--space-4);
  }

  .pricelist-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    min-width: 100%;
  }

  .pagination-bar {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
  }
}
</style>
