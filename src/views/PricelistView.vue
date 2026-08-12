<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useRealtime } from '@/composables/useRealtime'
import type { PricelistRow } from '@/types'

// --- Store & Realtime ---
const catalogStore = useCatalogStore()

const { subscribe: subscribeMachines } = useRealtime('machines', () => {
  catalogStore.fetchMachines({ is_active: true })
})
const { subscribe: subscribeConsumables } = useRealtime('machine_consumables', () => {
  catalogStore.fetchMachines({ is_active: true })
})
const { subscribe: subscribeAddons } = useRealtime('machine_addons', () => {
  catalogStore.fetchMachines({ is_active: true })
})

// --- Filter ---
const brandFilter = ref('')

// --- Derived Data ---
const brandOptions = computed(() => {
  const counts: Record<string, number> = {}
  catalogStore.machines.forEach((m) => {
    counts[m.brand] = (counts[m.brand] || 0) + 1
  })
  return Object.keys(counts).sort().map((b) => ({ brand: b, count: counts[b] }))
})

const totalCount = computed(() => catalogStore.machines.length)

const filteredMachines = computed(() => {
  let machines = [...catalogStore.machines]
  if (brandFilter.value) {
    machines = machines.filter((m) => m.brand === brandFilter.value)
  }
  machines.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
  return machines
})

const filteredCount = computed(() => filteredMachines.value.length)

// --- Pricelist rows ---
const pricelistRows = computed<PricelistRow[]>(() => {
  return filteredMachines.value.map((m) => ({
    id: m.id,
    brand: m.brand,
    model: m.model,
    sub_model: m.sub_model,
    srp: m.srp ?? 0,
    lbp: m.lbp ?? 0,
    cash_price: m.cash_price ?? 0,
    machine_warranty_months: m.machine_warranty_months ?? 0,
    printhead_warranty: m.printhead_warranty ?? null,
  }))
})

// --- Consumables rows ---
interface ConsumableRow {
  brand: string
  model: string
  item: string
  pkg: string
  price: number
}

const consumableRows = computed<ConsumableRow[]>(() => {
  const rows: ConsumableRow[] = []
  filteredMachines.value.forEach((m) => {
    ;(m.consumables || []).forEach((c) => {
      rows.push({
        brand: m.brand,
        model: m.model,
        item: c.item_name,
        pkg: c.package_description || '',
        price: c.default_price,
      })
    })
  })
  return rows
})

// --- Add-Ons rows ---
interface AddonRow {
  brand: string
  model: string
  addon: string
}

const addonRows = computed<AddonRow[]>(() => {
  const rows: AddonRow[] = []
  filteredMachines.value.forEach((m) => {
    ;(m.addons || []).forEach((a) => {
      rows.push({
        brand: m.brand,
        model: m.model,
        addon: a.description,
      })
    })
  })
  return rows
})

// --- Helpers ---
function peso(n: number): string {
  if (!n || n <= 0) return '\u2014'
  return '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function warr(v: number | string | null | undefined): string {
  if (v === '' || v == null) return '\u2014'
  const s = String(v).trim()
  if (/^\d+$/.test(s)) return s + ' mo.'
  return s
}

// Brand banding helper — returns true/false for alternating brand groups
function getBandClass(rows: { brand: string }[], idx: number): string {
  let band = false
  let prev = ''
  for (let i = 0; i <= idx; i++) {
    if (rows[i]!.brand !== prev) {
      band = !band
      prev = rows[i]!.brand
    }
  }
  return band ? 'band' : ''
}

// --- Lifecycle ---
onMounted(() => {
  catalogStore.fetchMachines({ is_active: true })
  subscribeMachines()
  subscribeConsumables()
  subscribeAddons()
})
</script>

<template>
  <div class="pricelist-view">
    <!-- Header -->
    <div class="pl-head">
      <h2>Machine Price List</h2>
      <select v-model="brandFilter" class="pl-brand-select">
        <option value="">All Brands ({{ totalCount }})</option>
        <option v-for="b in brandOptions" :key="b.brand" :value="b.brand">
          {{ b.brand }} ({{ b.count }})
        </option>
      </select>
      <span class="pl-count">{{ filteredCount }} machine{{ filteredCount === 1 ? '' : 's' }}</span>
      <span class="spacer"></span>
      <span class="pl-sub">Prices in &#8369; &middot; Warranty in months</span>
    </div>

    <!-- Loading -->
    <div v-if="catalogStore.loading" class="pl-loading">Loading pricelist data...</div>

    <!-- Error -->
    <div v-else-if="catalogStore.error" class="pl-error">
      {{ catalogStore.error }}
      <button @click="catalogStore.fetchMachines({ is_active: true })">Retry</button>
    </div>

    <template v-else>
      <!-- Machine Price Table -->
      <div class="pl-table-wrap">
        <table class="pricelist">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th class="num">SRP</th>
              <th class="num">LBP</th>
              <th class="num">Cash Price</th>
              <th class="ctr">Machine Warranty</th>
              <th class="ctr">Printhead / Laser Tube Warranty</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pricelistRows.length">
              <td colspan="7" class="empty-row">No machines.</td>
            </tr>
            <tr
              v-for="(row, idx) in pricelistRows"
              :key="row.id"
              :class="getBandClass(pricelistRows, idx)"
            >
              <td>{{ row.brand }}</td>
              <td class="ml">{{ row.model }}</td>
              <td class="num">{{ peso(row.srp) }}</td>
              <td class="num">{{ peso(row.lbp) }}</td>
              <td class="num">{{ peso(row.cash_price) }}</td>
              <td class="ctr">{{ warr(row.machine_warranty_months) }}</td>
              <td class="ctr">{{ warr(row.printhead_warranty) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Consumables -->
      <h3 class="pl-sec">Consumables</h3>
      <div class="pl-table-wrap">
        <table class="pricelist">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Item</th>
              <th>Package</th>
              <th class="num">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!consumableRows.length">
              <td colspan="5" class="empty-row">No consumables.</td>
            </tr>
            <tr
              v-for="(row, idx) in consumableRows"
              :key="idx"
              :class="getBandClass(consumableRows, idx)"
            >
              <td>{{ row.brand }}</td>
              <td class="ml">{{ row.model }}</td>
              <td>{{ row.item }}</td>
              <td>{{ row.pkg }}</td>
              <td class="num">{{ peso(row.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Optional Add-Ons -->
      <h3 class="pl-sec">Optional Add-Ons</h3>
      <div class="pl-table-wrap">
        <table class="pricelist">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Add-On</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!addonRows.length">
              <td colspan="3" class="empty-row">No add-ons.</td>
            </tr>
            <tr
              v-for="(row, idx) in addonRows"
              :key="idx"
              :class="getBandClass(addonRows, idx)"
            >
              <td>{{ row.brand }}</td>
              <td class="ml">{{ row.model }}</td>
              <td>{{ row.addon }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pricelist-view {
  padding: 12px 16px;
  overflow-y: auto;
  height: calc(100vh - 56px);
}

/* --- Header --- */
.pl-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.pl-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.pl-brand-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}

.pl-count {
  font-size: 13px;
  color: #666;
}

.spacer {
  flex: 1;
}

.pl-sub {
  font-size: 12px;
  color: #888;
}

/* --- Section headings --- */
.pl-sec {
  margin: 24px 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* --- Table wrapper --- */
.pl-table-wrap {
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

/* --- Pricelist table --- */
.pricelist {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.pricelist thead {
  background: #8b1a1a;
  color: #fff;
}

.pricelist th {
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pricelist td {
  padding: 5px 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.pricelist tbody tr:hover {
  background: #fff3cd !important;
}

/* Brand banding */
.pricelist tbody tr.band {
  background: #f8f9fa;
}

/* Numeric columns */
.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}

/* Center columns */
.ctr {
  text-align: center !important;
}

/* Model column (slightly bolder) */
.ml {
  font-weight: 500;
}

.empty-row {
  text-align: center;
  padding: 20px !important;
  color: #999;
}

/* --- States --- */
.pl-loading,
.pl-error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.pl-error {
  color: #dc3545;
}

.pl-error button {
  margin-top: 8px;
  padding: 4px 12px;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background: #fff;
  color: #dc3545;
  cursor: pointer;
}

/* --- Responsive --- */
@media screen and (max-width: 767px) {
  .pl-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .spacer {
    display: none;
  }
}
</style>
