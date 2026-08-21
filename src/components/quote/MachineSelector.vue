<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { QUOTE_BUILDER_KEY } from '@/composables/useQuoteBuilder'
import {
  mapInclusionsToToggleable,
  mapExclusionsToToggleable,
  mapAddonsToToggleable,
} from '@/utils/quote-calculations'

const catalogStore = useCatalogStore()
const quoteState = inject(QUOTE_BUILDER_KEY)!

const loading = ref(false)

// Derive unique brand list from catalog machines
const brands = computed(() => {
  const brandSet = new Set(catalogStore.machines.map((m) => m.brand))
  return Array.from(brandSet).sort()
})

// Count of machines per brand
function brandCount(brand: string): number {
  return catalogStore.machines.filter((m) => m.brand === brand).length
}

// Derive unique model names for selected brand
const uniqueModels = computed(() => {
  if (!quoteState.selectedBrand) return []
  const modelSet = new Set(
    catalogStore.machines
      .filter((m) => m.brand === quoteState.selectedBrand)
      .map((m) => m.model)
  )
  return Array.from(modelSet).sort()
})

// Derive sub-model values for selected brand + model
const subModels = computed(() => {
  if (!quoteState.selectedBrand || !quoteState.selectedModel) return []
  const entries = catalogStore.machines.filter(
    (m) => m.brand === quoteState.selectedBrand && m.model === quoteState.selectedModel
  )
  // Collect non-null sub_model values
  const subModelValues = entries
    .map((m) => m.sub_model)
    .filter((sm): sm is string => sm !== null && sm !== '')
  // If there's only one machine entry with no sub_model, no dropdown needed
  if (subModelValues.length === 0) return []
  // Return unique sub_model values
  return Array.from(new Set(subModelValues)).sort()
})

// Show sub-model dropdown when multiple variants exist
const showSubModelDropdown = computed(() => subModels.value.length > 1)

// When brand changes, reset model, sub-model, and populated data
watch(
  () => quoteState.selectedBrand,
  () => {
    quoteState.selectedModel = ''
    quoteState.selectedSubModel = ''
    clearMachineData()
  }
)

// When model changes, reset sub-model and handle population
watch(
  () => quoteState.selectedModel,
  async (newModel) => {
    quoteState.selectedSubModel = ''

    if (!newModel || !quoteState.selectedBrand) {
      clearMachineData()
      return
    }

    // If there are sub-models, wait for sub-model selection
    // If no sub-models (single variant), populate immediately
    if (!showSubModelDropdown.value) {
      await populateMachineData()
    } else {
      clearMachineData()
    }
  }
)

// When sub-model changes, populate machine data
watch(
  () => quoteState.selectedSubModel,
  async (newSubModel) => {
    if (!newSubModel || !quoteState.selectedModel || !quoteState.selectedBrand) {
      // Only clear if sub-model dropdown is shown (otherwise model watch handles it)
      if (showSubModelDropdown.value) {
        clearMachineData()
      }
      return
    }

    await populateMachineData()
  }
)

// Convert months number to word prefix matching the original HTML format
// e.g. 12 → "Twelve (12)", 6 → "Six (6)", 24 → "Twenty-Four (24)", 36 → "Thirty-Six (36)"
function _numToWords(n: number): string {
  const words: Record<number, string> = {
    1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six',
    7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve',
    18: 'Eighteen', 24: 'Twenty-Four', 36: 'Thirty-Six', 48: 'Forty-Eight',
  }
  return words[n] ? `${words[n]} (${n})` : `${n}`
}

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

    // Find the matching machine based on brand + model + sub_model
    const machine = catalogStore.machines.find((m) => {
      if (m.brand !== quoteState.selectedBrand) return false
      if (m.model !== quoteState.selectedModel) return false
      // If sub-model dropdown is shown, match on sub_model
      if (showSubModelDropdown.value) {
        return m.sub_model === quoteState.selectedSubModel
      }
      // Otherwise, single variant — match regardless of sub_model
      return true
    })

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

    // Populate new state fields (Req 14.1 — image_key)
    quoteState.imageKey = machine.image_key ?? null

    // Populate computer set option (Req 8)
    quoteState.hasComputerSetOption = machine.has_computer_set_option ?? false

    // Populate warranty durations (Req 12)
    quoteState.warrantyMachineDuration = machine.machine_warranty_months
      ? _numToWords(machine.machine_warranty_months)
      : (machine.warranty_machine_duration ?? '')
    quoteState.warrantyPrintheadDuration = (machine as any).has_printhead
      ? (machine.printhead_warranty ?? machine.warranty_printhead_duration ?? '')
      : ''
    quoteState.warrantyCompany = machine.letterhead === 'ACS / Alternative'
      ? 'ACS / Alternative'
      : 'ES Print Media Inc.'
    quoteState.warrantySupplier = 'ESPMI'
    quoteState.serviceFee = machine.service_fee ?? null
    quoteState.excludeSoftwareConcerns = (machine as any).exclude_software_concerns ?? true

    // Auto-populate availability from catalog
    quoteState.availability = (machine as any).availability ?? machine.warranty_machine_duration ?? ''

    // Map catalog inclusions/exclusions/addons to ToggleableItem[] arrays
    quoteState.inclusionItems = mapInclusionsToToggleable(machine.inclusions)
    quoteState.exclusionItems = mapExclusionsToToggleable(machine.exclusions)
    quoteState.addonItems = mapAddonsToToggleable(machine.addons)

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
  quoteState.imageKey = null
  quoteState.hasComputerSetOption = false
  quoteState.warrantyMachineDuration = ''
  quoteState.warrantyPrintheadDuration = ''
  quoteState.serviceFee = null
  quoteState.features = []
  quoteState.consumables = []
  quoteState.inclusions = []
  quoteState.exclusions = []
  quoteState.addons = []
  quoteState.inclusionItems = []
  quoteState.exclusionItems = []
  quoteState.addonItems = []
  quoteState.consumablePrices = []
  quoteState.availability = ''
  quoteState.warrantyCompany = ''
  quoteState.warrantyMachineDuration = ''
  quoteState.warrantyPrintheadDuration = ''
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
  <div>
    <!-- Error banner -->
    <div v-if="quoteState.catalogError" class="ms-error" role="alert">
      <span>{{ quoteState.catalogError }}</span>
      <button class="ms-retry-btn" type="button" @click="retryLoad">Retry</button>
    </div>

    <!-- Brand -->
    <div class="fp-sec">
      <label class="fp-lbl" for="brand-select">Brand</label>
      <select
        id="brand-select"
        class="fp-sel"
        v-model="quoteState.selectedBrand"
        :disabled="catalogStore.loading"
      >
        <option value="" disabled>Select brand</option>
        <option v-for="brand in brands" :key="brand" :value="brand">
          {{ brand }} ({{ brandCount(brand) }})
        </option>
      </select>
    </div>

    <!-- Model -->
    <div class="fp-sec">
      <label class="fp-lbl" for="model-select">Machine Model</label>
      <select
        id="model-select"
        class="fp-sel"
        v-model="quoteState.selectedModel"
        :disabled="!quoteState.selectedBrand || catalogStore.loading"
      >
        <option value="" disabled>Select model</option>
        <option v-for="model in uniqueModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
    </div>

    <!-- Sub-Model / Variant dropdown (conditional) -->
    <div v-if="showSubModelDropdown" class="fp-sec">
      <label class="fp-lbl" for="submodel-select">Model / Variant</label>
      <select
        id="submodel-select"
        class="fp-sel"
        v-model="quoteState.selectedSubModel"
        :disabled="!quoteState.selectedModel || catalogStore.loading"
      >
        <option value="" disabled>Select variant</option>
        <option v-for="subModel in subModels" :key="subModel" :value="subModel">
          {{ subModel }}
        </option>
      </select>
    </div>

    <!-- Unit Condition -->
    <div class="fp-sec">
      <label class="fp-lbl" for="unit-condition">Unit Condition</label>
      <select
        id="unit-condition"
        class="fp-sel"
        v-model="quoteState.unitCondition"
      >
        <option value="Brand New">Brand New</option>
        <option value="Re-certified">Re-certified</option>
        <option value="Demo Unit">Demo Unit</option>
      </select>
    </div>

    <!-- Loading indicator -->
    <p v-if="loading" class="ms-loading">Loading...</p>
  </div>
</template>

<style scoped>
/* Inherit parent fp-* styles since scoped CSS doesn't leak from parent */
.fp-sec {
  margin-bottom: 8px;
}

.fp-lbl {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #666;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: .3px;
}

.fp-sel {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #222;
  background: #fafafa;
  font-family: inherit;
  box-sizing: border-box;
}

.fp-sel:focus {
  outline: none;
  border-color: #c0392b;
  background: #fff;
}

.fp-sel:disabled {
  background: #f0f0f0;
  color: #aaa;
  cursor: not-allowed;
}

.ms-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  font-size: 11px;
  color: #c0392b;
}

.ms-retry-btn {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #c0392b;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.ms-retry-btn:hover {
  background: #a93226;
}

.ms-loading {
  font-size: 11px;
  color: #999;
  margin: 4px 0 0;
}
</style>
