<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'

const catalogStore = useCatalogStore()
const quoteState = inject(QUOTE_BUILDER_KEY)!

const loading = ref(false)

// Derive unique brand list from catalog machines
const brands = computed(() => {
  const brandSet = new Set(catalogStore.machines.map((m) => m.brand))
  return Array.from(brandSet).sort()
})

// Derive model list filtered by selected brand
const models = computed(() => {
  if (!quoteState.selectedBrand) return []
  return catalogStore.machines
    .filter((m) => m.brand === quoteState.selectedBrand)
    .map((m) => ({ model: m.model, sub_model: m.sub_model }))
    .sort((a, b) => a.model.localeCompare(b.model))
})

// Get model display label (model + sub_model if present)
function getModelLabel(item: { model: string; sub_model: string | null }): string {
  return item.sub_model ? `${item.model} — ${item.sub_model}` : item.model
}

// When brand changes, reset model and populated data
watch(
  () => quoteState.selectedBrand,
  () => {
    quoteState.selectedModel = ''
    clearMachineData()
  }
)

// When model changes, fetch and populate machine data from catalog
watch(
  () => quoteState.selectedModel,
  async (newModel) => {
    if (!newModel || !quoteState.selectedBrand) {
      clearMachineData()
      return
    }

    await populateMachineData()
  }
)

async function populateMachineData() {
  loading.value = true
  quoteState.catalogError = null

  try {
    // Ensure catalog data is loaded
    if (catalogStore.machines.length === 0) {
      await catalogStore.fetchMachines()
    }

    if (catalogStore.error) {
      quoteState.catalogError =
        'Catalog data could not be loaded. Please try again.'
      clearMachineData()
      return
    }

    // Find the matching machine
    const machine = catalogStore.machines.find(
      (m) =>
        m.brand === quoteState.selectedBrand &&
        getModelLabel({ model: m.model, sub_model: m.sub_model }) === quoteState.selectedModel
    )

    if (!machine) {
      quoteState.catalogError =
        'Selected machine not found in catalog. Please try again.'
      clearMachineData()
      return
    }

    // Populate state from catalog data
    quoteState.machineId = machine.id
    quoteState.unitCondition = machine.unit_condition
    quoteState.letterhead = machine.letterhead
    quoteState.features = [...machine.features]
    quoteState.consumables = [...machine.consumables]
    quoteState.inclusions = [...machine.inclusions]
    quoteState.exclusions = [...machine.exclusions]
    quoteState.addons = [...machine.addons]

    // Initialize consumable prices from defaults
    quoteState.consumablePrices = machine.consumables.map((c) => ({
      consumableId: c.id,
      customPrice: c.default_price,
    }))
  } catch {
    quoteState.catalogError =
      'Catalog data could not be loaded. Please try again.'
    clearMachineData()
  } finally {
    loading.value = false
  }
}

function clearMachineData() {
  quoteState.machineId = null
  quoteState.unitCondition = null
  quoteState.features = []
  quoteState.consumables = []
  quoteState.inclusions = []
  quoteState.exclusions = []
  quoteState.addons = []
  quoteState.consumablePrices = []
}

async function retryLoad() {
  quoteState.catalogError = null
  await catalogStore.fetchMachines()
  if (quoteState.selectedBrand && quoteState.selectedModel) {
    await populateMachineData()
  }
}

// Load machines on mount if not already loaded
if (catalogStore.machines.length === 0) {
  catalogStore.fetchMachines()
}
</script>

<template>
  <div class="machine-selector">
    <h3 class="machine-selector__title">Machine Selection</h3>

    <!-- Error banner -->
    <div
      v-if="quoteState.catalogError"
      class="machine-selector__error"
      role="alert"
    >
      <p>{{ quoteState.catalogError }}</p>
      <button class="machine-selector__retry-btn" @click="retryLoad">
        Retry
      </button>
    </div>

    <div class="machine-selector__fields">
      <!-- Brand dropdown -->
      <div class="machine-selector__field">
        <label for="brand-select" class="machine-selector__label">Brand</label>
        <select
          id="brand-select"
          v-model="quoteState.selectedBrand"
          class="machine-selector__select"
          :disabled="catalogStore.loading"
        >
          <option value="" disabled>Select a brand</option>
          <option v-for="brand in brands" :key="brand" :value="brand">
            {{ brand }}
          </option>
        </select>
      </div>

      <!-- Model dropdown -->
      <div class="machine-selector__field">
        <label for="model-select" class="machine-selector__label">Model</label>
        <select
          id="model-select"
          v-model="quoteState.selectedModel"
          class="machine-selector__select"
          :disabled="!quoteState.selectedBrand || catalogStore.loading"
        >
          <option value="" disabled>Select a model</option>
          <option
            v-for="item in models"
            :key="getModelLabel(item)"
            :value="getModelLabel(item)"
          >
            {{ getModelLabel(item) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading indicator -->
    <p v-if="loading" class="machine-selector__loading">
      Loading machine data...
    </p>

    <!-- Populated data summary -->
    <div v-if="quoteState.machineId && !loading" class="machine-selector__summary">
      <p class="machine-selector__info">
        <strong>Condition:</strong> {{ quoteState.unitCondition }}
      </p>
      <p class="machine-selector__info">
        <strong>Features:</strong> {{ quoteState.features.length }} item(s)
      </p>
      <p class="machine-selector__info">
        <strong>Consumables:</strong> {{ quoteState.consumables.length }} item(s)
      </p>
      <p class="machine-selector__info">
        <strong>Inclusions:</strong> {{ quoteState.inclusions.length }} item(s)
      </p>
      <p class="machine-selector__info">
        <strong>Exclusions:</strong> {{ quoteState.exclusions.length }} item(s)
      </p>
      <p class="machine-selector__info">
        <strong>Add-ons:</strong> {{ quoteState.addons.length }} item(s)
      </p>
    </div>
  </div>
</template>

<style scoped>
.machine-selector {
  padding: var(--space-4);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.machine-selector__title {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-800);
}

.machine-selector__error {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error);
}

.machine-selector__error p {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
}

.machine-selector__retry-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-white);
  background: var(--color-error);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.machine-selector__retry-btn:hover {
  background: #b91c1c;
}

.machine-selector__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media screen and (max-width: 767px) {
  .machine-selector__fields {
    grid-template-columns: 1fr;
  }
}

.machine-selector__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.machine-selector__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.machine-selector__select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 16px;
  font-family: inherit;
  color: var(--color-gray-900);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  appearance: auto;
  transition: border-color var(--transition-fast);
}

.machine-selector__select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.machine-selector__select:disabled {
  background: var(--color-gray-100);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.machine-selector__loading {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.machine-selector__summary {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.machine-selector__info {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.machine-selector__info:last-child {
  margin-bottom: 0;
}
</style>
