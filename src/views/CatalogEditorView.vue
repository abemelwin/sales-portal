<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCatalogImport } from '@/composables/useCatalogImport'
import type { Machine, MachineInput, UnitCondition, Letterhead, ImportResult } from '@/types'

const catalogStore = useCatalogStore()
const { importFile, importing: importingFile, error: importError } = useCatalogImport()

// ─── Import State ─────────────────────────────────────────────────────────────
const showImportSection = ref(false)
const importResult = ref<ImportResult | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  importResult.value = null
  const result = await importFile(file)
  importResult.value = result

  // Refresh catalog after successful import
  if (result.added > 0 || result.updated > 0) {
    await catalogStore.fetchMachines()
  }

  // Reset the file input so the same file can be re-selected
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function toggleImportSection() {
  showImportSection.value = !showImportSection.value
  if (!showImportSection.value) {
    importResult.value = null
  }
}

// ─── Mode & Selection ─────────────────────────────────────────────────────────
type EditorMode = 'list' | 'create' | 'edit'
const mode = ref<EditorMode>('list')
const selectedMachine = ref<Machine | null>(null)

// ─── Success / Error Messages ─────────────────────────────────────────────────
const successMessage = ref('')
const duplicateError = ref('')
let successTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Form State ───────────────────────────────────────────────────────────────
const form = reactive({
  brand: '',
  model: '',
  sub_model: '',
  unit_condition: 'Brand New' as UnitCondition,
  letterhead: 'ES Print Media Inc.' as Letterhead,
})

const unitConditionOptions: UnitCondition[] = ['Brand New', 'Re-certified', 'Demo Unit']
const letterheadOptions: Letterhead[] = ['ES Print Media Inc.', 'ACS / Alternative']

// ─── Dynamic Lists ────────────────────────────────────────────────────────────
interface ListItem {
  description: string
  sort_order: number
}
interface ConsumableItem {
  item_name: string
  package_description: string
  default_price: number | null
  sort_order: number
}

const features = ref<ListItem[]>([])
const inclusions = ref<ListItem[]>([])
const exclusions = ref<ListItem[]>([])
const addons = ref<ListItem[]>([])
const consumables = ref<ConsumableItem[]>([])

// ─── Validation ───────────────────────────────────────────────────────────────
const MAX_LIST_ITEMS = 50
const formErrors = reactive<Record<string, string>>({})

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  duplicateError.value = ''

  if (!form.brand.trim()) formErrors.brand = 'Brand is required'
  else if (form.brand.length > 100) formErrors.brand = 'Brand must be 100 characters or less'

  if (!form.model.trim()) formErrors.model = 'Model is required'
  else if (form.model.length > 100) formErrors.model = 'Model must be 100 characters or less'

  if (form.sub_model && form.sub_model.length > 100)
    formErrors.sub_model = 'Sub-model must be 100 characters or less'

  if (features.value.length > MAX_LIST_ITEMS)
    formErrors.features = `Maximum ${MAX_LIST_ITEMS} features allowed`
  if (inclusions.value.length > MAX_LIST_ITEMS)
    formErrors.inclusions = `Maximum ${MAX_LIST_ITEMS} inclusions allowed`
  if (exclusions.value.length > MAX_LIST_ITEMS)
    formErrors.exclusions = `Maximum ${MAX_LIST_ITEMS} exclusions allowed`
  if (addons.value.length > MAX_LIST_ITEMS)
    formErrors.addons = `Maximum ${MAX_LIST_ITEMS} add-ons allowed`
  if (consumables.value.length > MAX_LIST_ITEMS)
    formErrors.consumables = `Maximum ${MAX_LIST_ITEMS} consumables allowed`

  // Validate consumable fields
  for (let i = 0; i < consumables.value.length; i++) {
    const c = consumables.value[i]!
    if (!c.item_name.trim()) {
      formErrors[`consumable_${i}_name`] = 'Item name is required'
    } else if (c.item_name.length > 150) {
      formErrors[`consumable_${i}_name`] = 'Item name must be 150 characters or less'
    }
    if (c.package_description && c.package_description.length > 300) {
      formErrors[`consumable_${i}_desc`] = 'Package description must be 300 characters or less'
    }
    if (c.default_price === null || c.default_price < 0.01 || c.default_price > 999999999.99) {
      formErrors[`consumable_${i}_price`] = 'Price must be between 0.01 and 999,999,999.99'
    }
  }

  return Object.keys(formErrors).length === 0
}

// ─── List Management ──────────────────────────────────────────────────────────
function addListItem(list: ListItem[]) {
  if (list.length >= MAX_LIST_ITEMS) return
  list.push({ description: '', sort_order: list.length })
}

function removeListItem(list: ListItem[], index: number) {
  list.splice(index, 1)
  list.forEach((item, i) => (item.sort_order = i))
}

function addConsumable() {
  if (consumables.value.length >= MAX_LIST_ITEMS) return
  consumables.value.push({
    item_name: '',
    package_description: '',
    default_price: null,
    sort_order: consumables.value.length,
  })
}

function removeConsumable(index: number) {
  consumables.value.splice(index, 1)
  consumables.value.forEach((item, i) => (item.sort_order = i))
}

// ─── Form Reset / Population ──────────────────────────────────────────────────
function resetForm() {
  form.brand = ''
  form.model = ''
  form.sub_model = ''
  form.unit_condition = 'Brand New'
  form.letterhead = 'ES Print Media Inc.'
  features.value = []
  inclusions.value = []
  exclusions.value = []
  addons.value = []
  consumables.value = []
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  duplicateError.value = ''
  successMessage.value = ''
}

function populateForm(machine: Machine) {
  form.brand = machine.brand
  form.model = machine.model
  form.sub_model = machine.sub_model ?? ''
  form.unit_condition = machine.unit_condition
  form.letterhead = machine.letterhead
  features.value = machine.features.map((f) => ({
    description: f.description,
    sort_order: f.sort_order,
  }))
  inclusions.value = machine.inclusions.map((i) => ({
    description: i.description,
    sort_order: i.sort_order,
  }))
  exclusions.value = machine.exclusions.map((e) => ({
    description: e.description,
    sort_order: e.sort_order,
  }))
  addons.value = machine.addons.map((a) => ({
    description: a.description,
    sort_order: a.sort_order,
  }))
  consumables.value = machine.consumables.map((c) => ({
    item_name: c.item_name,
    package_description: c.package_description ?? '',
    default_price: c.default_price,
    sort_order: c.sort_order,
  }))
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────
function buildInput(): MachineInput {
  return {
    brand: form.brand.trim(),
    model: form.model.trim(),
    sub_model: form.sub_model.trim() || null,
    unit_condition: form.unit_condition,
    letterhead: form.letterhead,
    features: features.value.filter((f) => f.description.trim()).map((f) => ({
      description: f.description.trim(),
      sort_order: f.sort_order,
    })),
    consumables: consumables.value.filter((c) => c.item_name.trim()).map((c) => ({
      item_name: c.item_name.trim(),
      package_description: c.package_description.trim() || null,
      default_price: c.default_price ?? 0,
      sort_order: c.sort_order,
    })),
    inclusions: inclusions.value.filter((i) => i.description.trim()).map((i) => ({
      description: i.description.trim(),
      sort_order: i.sort_order,
    })),
    exclusions: exclusions.value.filter((e) => e.description.trim()).map((e) => ({
      description: e.description.trim(),
      sort_order: e.sort_order,
    })),
    addons: addons.value.filter((a) => a.description.trim()).map((a) => ({
      description: a.description.trim(),
      sort_order: a.sort_order,
    })),
  }
}

function showSuccess(msg: string) {
  successMessage.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => {
    successMessage.value = ''
  }, 5000)
}

function isDuplicateError(errMsg: string): boolean {
  const lower = errMsg.toLowerCase()
  return lower.includes('duplicate') || lower.includes('unique') || lower.includes('already exists')
    || lower.includes('23505')
}

const saving = ref(false)

async function handleCreate() {
  if (!validateForm()) return
  saving.value = true
  const input = buildInput()
  const result = await catalogStore.createMachine(input)
  saving.value = false

  if (result.success) {
    showSuccess('Machine created successfully!')
    resetForm()
    mode.value = 'list'
  } else if (result.error && isDuplicateError(result.error)) {
    duplicateError.value = `A machine with brand "${form.brand}", model "${form.model}"${form.sub_model ? `, sub-model "${form.sub_model}"` : ''} already exists.`
  }
}

async function handleUpdate() {
  if (!selectedMachine.value) return
  if (!validateForm()) return
  saving.value = true
  const input = buildInput()
  const result = await catalogStore.updateMachine(selectedMachine.value.id, input)
  saving.value = false

  if (result.success) {
    showSuccess('Machine updated successfully!')
    mode.value = 'list'
    selectedMachine.value = null
  } else if (result.error && isDuplicateError(result.error)) {
    duplicateError.value = `A machine with brand "${form.brand}", model "${form.model}"${form.sub_model ? `, sub-model "${form.sub_model}"` : ''} already exists.`
  }
}

const confirmDelete = ref(false)
const deletingId = ref<string | null>(null)

function promptDelete(machine: Machine) {
  confirmDelete.value = true
  deletingId.value = machine.id
}

async function handleDelete() {
  if (!deletingId.value) return
  saving.value = true
  const result = await catalogStore.softDeleteMachine(deletingId.value)
  saving.value = false
  confirmDelete.value = false
  deletingId.value = null

  if (result.success) {
    showSuccess('Machine deleted successfully!')
  }
}

function cancelDelete() {
  confirmDelete.value = false
  deletingId.value = null
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function startCreate() {
  resetForm()
  mode.value = 'create'
}

function startEdit(machine: Machine) {
  selectedMachine.value = machine
  populateForm(machine)
  mode.value = 'edit'
}

function backToList() {
  resetForm()
  selectedMachine.value = null
  mode.value = 'list'
}

// ─── Search / Filter ──────────────────────────────────────────────────────────
const searchQuery = ref('')
const filteredMachines = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return catalogStore.machines
  return catalogStore.machines.filter(
    (m) =>
      m.brand.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      (m.sub_model && m.sub_model.toLowerCase().includes(q))
  )
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  catalogStore.fetchMachines()
})
</script>

<template>
  <div class="catalog-editor-view">
    <header class="page-header">
      <h1>Catalog Editor</h1>
      <div v-if="mode === 'list'" class="header-actions">
        <button
          class="btn btn-secondary"
          @click="toggleImportSection"
        >
          {{ showImportSection ? 'Hide Import' : 'Import .xlsx' }}
        </button>
        <button
          class="btn btn-primary"
          @click="startCreate"
        >
          + New Machine
        </button>
      </div>
      <button
        v-if="mode !== 'list'"
        class="btn btn-secondary"
        @click="backToList"
      >
        &larr; Back to List
      </button>
    </header>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success" role="alert">
      {{ successMessage }}
    </div>

    <!-- Store Error -->
    <div v-if="catalogStore.error" class="alert alert-error" role="alert">
      {{ catalogStore.error }}
    </div>

    <!-- ═══ Import Section ═══ -->
    <section v-if="showImportSection && mode === 'list'" class="import-section">
      <h2>Import Catalog from .xlsx</h2>
      <p class="import-description">
        Upload an .xlsx file with columns: <code>brand</code>, <code>model</code>,
        <code>sub_model</code>, <code>unit_condition</code>, <code>letterhead</code>.
        Maximum file size: 10 MB. Maximum rows: 5,000.
      </p>

      <div class="import-upload">
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          class="file-input"
          :disabled="importingFile"
          aria-label="Choose .xlsx file to import"
          @change="handleImport"
        />
      </div>

      <div v-if="importingFile" class="import-status loading-state">
        Importing... Please wait.
      </div>

      <!-- Import Error -->
      <div v-if="importError && !importingFile" class="alert alert-error" role="alert">
        {{ importError }}
      </div>

      <!-- Import Result -->
      <div v-if="importResult && !importingFile" class="import-result">
        <h3>Import Results</h3>
        <ul class="result-summary">
          <li><strong>Added:</strong> {{ importResult.added }}</li>
          <li><strong>Updated:</strong> {{ importResult.updated }}</li>
          <li><strong>Skipped:</strong> {{ importResult.skipped }}</li>
        </ul>
        <div v-if="importResult.errors.length > 0" class="import-errors">
          <h4>Errors ({{ importResult.errors.length }})</h4>
          <ul class="error-list">
            <li v-for="(err, idx) in importResult.errors" :key="idx">{{ err }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ═══ Machine List Mode ═══ -->
    <section v-if="mode === 'list'" class="machine-list-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by brand, model, or sub-model..."
          class="input-field search-input"
          aria-label="Search machines"
        />
      </div>

      <div v-if="catalogStore.loading" class="loading-state">Loading machines...</div>

      <div v-else-if="filteredMachines.length === 0" class="empty-state">
        <p>No machines found.</p>
      </div>

      <table v-else class="machine-table" aria-label="Machine catalog">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model</th>
            <th>Sub-Model</th>
            <th>Condition</th>
            <th>Letterhead</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="machine in filteredMachines" :key="machine.id">
            <td>{{ machine.brand }}</td>
            <td>{{ machine.model }}</td>
            <td>{{ machine.sub_model || '—' }}</td>
            <td>{{ machine.unit_condition }}</td>
            <td>{{ machine.letterhead }}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-secondary" @click="startEdit(machine)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="promptDelete(machine)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ═══ Create / Edit Form ═══ -->
    <section v-if="mode === 'create' || mode === 'edit'" class="machine-form-section">
      <h2>{{ mode === 'create' ? 'Create New Machine' : 'Edit Machine' }}</h2>

      <!-- Duplicate Error -->
      <div v-if="duplicateError" class="alert alert-error inline-error" role="alert">
        {{ duplicateError }}
      </div>

      <form @submit.prevent="mode === 'create' ? handleCreate() : handleUpdate()" novalidate>
        <!-- Main Fields -->
        <fieldset class="form-fieldset">
          <legend>Machine Details</legend>

          <div class="form-group">
            <label for="brand">Brand <span class="required">*</span></label>
            <input
              id="brand"
              v-model="form.brand"
              type="text"
              maxlength="100"
              class="input-field"
              :class="{ 'input-error': formErrors.brand }"
              aria-required="true"
            />
            <span v-if="formErrors.brand" class="field-error">{{ formErrors.brand }}</span>
          </div>

          <div class="form-group">
            <label for="model">Model <span class="required">*</span></label>
            <input
              id="model"
              v-model="form.model"
              type="text"
              maxlength="100"
              class="input-field"
              :class="{ 'input-error': formErrors.model }"
              aria-required="true"
            />
            <span v-if="formErrors.model" class="field-error">{{ formErrors.model }}</span>
          </div>

          <div class="form-group">
            <label for="sub_model">Sub-Model</label>
            <input
              id="sub_model"
              v-model="form.sub_model"
              type="text"
              maxlength="100"
              class="input-field"
              :class="{ 'input-error': formErrors.sub_model }"
            />
            <span v-if="formErrors.sub_model" class="field-error">{{ formErrors.sub_model }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="unit_condition">Unit Condition <span class="required">*</span></label>
              <select
                id="unit_condition"
                v-model="form.unit_condition"
                class="input-field"
                aria-required="true"
              >
                <option v-for="opt in unitConditionOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="letterhead">Letterhead <span class="required">*</span></label>
              <select
                id="letterhead"
                v-model="form.letterhead"
                class="input-field"
                aria-required="true"
              >
                <option v-for="opt in letterheadOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>
          </div>
        </fieldset>

        <!-- Features List -->
        <fieldset class="form-fieldset">
          <legend>
            Features
            <span class="list-count">({{ features.length }}/{{ MAX_LIST_ITEMS }})</span>
          </legend>
          <span v-if="formErrors.features" class="field-error">{{ formErrors.features }}</span>
          <div v-for="(item, idx) in features" :key="idx" class="list-item-row">
            <input
              v-model="item.description"
              type="text"
              placeholder="Feature description"
              class="input-field list-input"
            />
            <button
              type="button"
              class="btn btn-sm btn-danger"
              @click="removeListItem(features, idx)"
              aria-label="Remove feature"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary add-item-btn"
            :disabled="features.length >= MAX_LIST_ITEMS"
            @click="addListItem(features)"
          >
            + Add Feature
          </button>
        </fieldset>

        <!-- Consumables List -->
        <fieldset class="form-fieldset">
          <legend>
            Consumables
            <span class="list-count">({{ consumables.length }}/{{ MAX_LIST_ITEMS }})</span>
          </legend>
          <span v-if="formErrors.consumables" class="field-error">{{ formErrors.consumables }}</span>
          <div v-for="(item, idx) in consumables" :key="idx" class="consumable-row">
            <div class="consumable-fields">
              <div class="form-group consumable-name">
                <input
                  v-model="item.item_name"
                  type="text"
                  maxlength="150"
                  placeholder="Item name"
                  class="input-field"
                  :class="{ 'input-error': formErrors[`consumable_${idx}_name`] }"
                />
                <span v-if="formErrors[`consumable_${idx}_name`]" class="field-error">
                  {{ formErrors[`consumable_${idx}_name`] }}
                </span>
              </div>
              <div class="form-group consumable-desc">
                <input
                  v-model="item.package_description"
                  type="text"
                  maxlength="300"
                  placeholder="Package description"
                  class="input-field"
                  :class="{ 'input-error': formErrors[`consumable_${idx}_desc`] }"
                />
                <span v-if="formErrors[`consumable_${idx}_desc`]" class="field-error">
                  {{ formErrors[`consumable_${idx}_desc`] }}
                </span>
              </div>

              <div class="form-group consumable-price">
                <input
                  v-model.number="item.default_price"
                  type="number"
                  min="0.01"
                  max="999999999.99"
                  step="0.01"
                  placeholder="Price"
                  class="input-field"
                  :class="{ 'input-error': formErrors[`consumable_${idx}_price`] }"
                />
                <span v-if="formErrors[`consumable_${idx}_price`]" class="field-error">
                  {{ formErrors[`consumable_${idx}_price`] }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-danger"
              @click="removeConsumable(idx)"
              aria-label="Remove consumable"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary add-item-btn"
            :disabled="consumables.length >= MAX_LIST_ITEMS"
            @click="addConsumable"
          >
            + Add Consumable
          </button>
        </fieldset>

        <!-- Inclusions List -->
        <fieldset class="form-fieldset">
          <legend>
            Package Inclusions
            <span class="list-count">({{ inclusions.length }}/{{ MAX_LIST_ITEMS }})</span>
          </legend>
          <span v-if="formErrors.inclusions" class="field-error">{{ formErrors.inclusions }}</span>
          <div v-for="(item, idx) in inclusions" :key="idx" class="list-item-row">
            <input
              v-model="item.description"
              type="text"
              placeholder="Inclusion description"
              class="input-field list-input"
            />
            <button
              type="button"
              class="btn btn-sm btn-danger"
              @click="removeListItem(inclusions, idx)"
              aria-label="Remove inclusion"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary add-item-btn"
            :disabled="inclusions.length >= MAX_LIST_ITEMS"
            @click="addListItem(inclusions)"
          >
            + Add Inclusion
          </button>
        </fieldset>

        <!-- Exclusions List -->
        <fieldset class="form-fieldset">
          <legend>
            Exclusions
            <span class="list-count">({{ exclusions.length }}/{{ MAX_LIST_ITEMS }})</span>
          </legend>
          <span v-if="formErrors.exclusions" class="field-error">{{ formErrors.exclusions }}</span>
          <div v-for="(item, idx) in exclusions" :key="idx" class="list-item-row">
            <input
              v-model="item.description"
              type="text"
              placeholder="Exclusion description"
              class="input-field list-input"
            />
            <button
              type="button"
              class="btn btn-sm btn-danger"
              @click="removeListItem(exclusions, idx)"
              aria-label="Remove exclusion"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary add-item-btn"
            :disabled="exclusions.length >= MAX_LIST_ITEMS"
            @click="addListItem(exclusions)"
          >
            + Add Exclusion
          </button>
        </fieldset>

        <!-- Add-ons List -->
        <fieldset class="form-fieldset">
          <legend>
            Optional Add-ons
            <span class="list-count">({{ addons.length }}/{{ MAX_LIST_ITEMS }})</span>
          </legend>
          <span v-if="formErrors.addons" class="field-error">{{ formErrors.addons }}</span>
          <div v-for="(item, idx) in addons" :key="idx" class="list-item-row">
            <input
              v-model="item.description"
              type="text"
              placeholder="Add-on description"
              class="input-field list-input"
            />
            <button
              type="button"
              class="btn btn-sm btn-danger"
              @click="removeListItem(addons, idx)"
              aria-label="Remove add-on"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary add-item-btn"
            :disabled="addons.length >= MAX_LIST_ITEMS"
            @click="addListItem(addons)"
          >
            + Add Add-on
          </button>
        </fieldset>

        <!-- Submit -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="saving || catalogStore.loading"
          >
            {{ saving ? 'Saving...' : mode === 'create' ? 'Create Machine' : 'Update Machine' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="backToList">Cancel</button>
        </div>
      </form>
    </section>

    <!-- ═══ Delete Confirmation Modal ═══ -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal" role="dialog" aria-labelledby="delete-dialog-title" aria-modal="true">
        <h3 id="delete-dialog-title">Confirm Delete</h3>
        <p>Are you sure you want to delete this machine? It will be marked as inactive but existing quotes referencing it will be preserved.</p>
        <div class="modal-actions">
          <button class="btn btn-danger" :disabled="saving" @click="handleDelete">
            {{ saving ? 'Deleting...' : 'Delete' }}
          </button>
          <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.catalog-editor-view {
  padding: var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
}

/* ─── Alerts ─────────────────────────────────────────────────────────────── */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
}

.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

/* ─── Search ─────────────────────────────────────────────────────────────── */
.search-bar {
  margin-bottom: var(--space-4);
}

.search-input {
  width: 100%;
  max-width: 400px;
}

/* ─── States ─────────────────────────────────────────────────────────────── */
.loading-state,
.empty-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-gray-500);
}

/* ─── Machine Table ──────────────────────────────────────────────────────── */
.machine-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.machine-table th,
.machine-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.machine-table th {
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-700);
}

.machine-table tbody tr:hover {
  background-color: var(--color-gray-50);
}

.actions-cell {
  display: flex;
  gap: var(--space-2);
}

/* ─── Form ───────────────────────────────────────────────────────────────── */
.machine-form-section h2 {
  margin-bottom: var(--space-6);
  font-size: var(--font-size-xl);
}

.form-fieldset {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-6);
}

.form-fieldset legend {
  font-weight: 600;
  font-size: var(--font-size-sm);
  padding: 0 var(--space-2);
  color: var(--color-gray-700);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.input-field {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color var(--transition-fast);
  background-color: var(--color-white);
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.field-error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.required {
  color: var(--color-error);
}

.list-count {
  font-weight: 400;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

/* ─── Dynamic List Items ─────────────────────────────────────────────────── */
.list-item-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.list-input {
  flex: 1;
}

.consumable-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-gray-100);
  border-radius: var(--radius-md);
  background-color: var(--color-gray-50);
}

.consumable-fields {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: var(--space-2);
  flex: 1;
}

.consumable-fields .form-group {
  margin-bottom: 0;
}

.add-item-btn {
  margin-top: var(--space-2);
}

/* ─── Form Actions ───────────────────────────────────────────────────────── */
.form-actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}

/* ─── Buttons ────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-200);
}

.btn-danger {
  background-color: var(--color-error);
  color: var(--color-white);
}

.btn-danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.btn-sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  min-height: 32px;
  min-width: 32px;
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 480px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.modal h3 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-lg);
}

.modal p {
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

/* ─── Header Actions ──────────────────────────────────────────────────────── */
.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

/* ─── Import Section ─────────────────────────────────────────────────────── */
.import-section {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  background-color: var(--color-gray-50);
}

.import-section h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-lg);
}

.import-description {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin-bottom: var(--space-4);
}

.import-description code {
  background-color: var(--color-gray-100);
  padding: 2px 6px;
  border-radius: var(--radius-sm, 4px);
  font-size: var(--font-size-xs);
}

.import-upload {
  margin-bottom: var(--space-4);
}

.file-input {
  font-size: 16px;
  font-family: inherit;
}

.import-status {
  padding: var(--space-3);
}

.import-result {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.import-result h3 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-base, 1rem);
}

.result-summary {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3);
  display: flex;
  gap: var(--space-4);
}

.result-summary li {
  font-size: var(--font-size-sm);
}

.import-errors {
  margin-top: var(--space-3);
  border-top: 1px solid var(--border-color);
  padding-top: var(--space-3);
}

.import-errors h4 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.error-list {
  list-style: disc;
  padding-left: var(--space-5);
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.error-list li {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-bottom: var(--space-1);
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media screen and (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .consumable-fields {
    grid-template-columns: 1fr;
  }

  .machine-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
