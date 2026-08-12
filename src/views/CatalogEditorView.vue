<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import type { Machine, MachineInput } from '@/types'

const catalogStore = useCatalogStore()

// ─── Machine Selector ─────────────────────────────────────────────────────────
const selectedMachineId = ref('')

const machineSelectorOptions = computed(() =>
  catalogStore.machines.map((m) => ({
    id: m.id,
    brand: m.brand,
    model: m.model,
    label: `${m.brand} \u2014 ${m.model}${m.sub_model ? ' ' + m.sub_model : ''}`,
  }))
)

watch(selectedMachineId, (id) => {
  if (!id) return
  const machine = catalogStore.machines.find((m) => m.id === id)
  if (machine) populateForm(machine)
})

// ─── Success Message ──────────────────────────────────────────────────────────
const successMessage = ref('')
let successTimeout: ReturnType<typeof setTimeout> | null = null

function showSuccess(msg: string) {
  successMessage.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => {
    successMessage.value = ''
  }, 5000)
}

// ─── Form State ───────────────────────────────────────────────────────────────
const form = reactive({
  key: '',
  quoteTitle: '',
  brand: '',
  category: '',
  srp: null as number | null,
  lbp: null as number | null,
  cashPrice: null as number | null,
  defaultMonths: null as number | null,
  hasTradeIn: false,
  hasPrinthead: false,
  machineWarranty: null as number | null,
  printheadWarranty: '',
  serviceFee: null as number | null,
  imageKey: '',
  availability: '',
})

const featuresText = ref('')
const inclusionsText = ref('')
const exclusivesText = ref('')

// ─── Consumables Table ────────────────────────────────────────────────────────
interface ConsumableRow {
  name: string
  uom: string
  price: string
}
const consumables = ref<ConsumableRow[]>([])

function addConsumableRow() {
  consumables.value.push({ name: '', uom: '', price: '' })
}

function removeConsumableRow(idx: number) {
  consumables.value.splice(idx, 1)
}

// ─── Optional Add-Ons Table ──────────────────────────────────────────────────
interface AddonRow {
  name: string
  uom: string
  price: string
}
const addons = ref<AddonRow[]>([])

function addAddonRow() {
  addons.value.push({ name: '', uom: '', price: '' })
}

function removeAddonRow(idx: number) {
  addons.value.splice(idx, 1)
}

// ─── Form Reset / Population ──────────────────────────────────────────────────
function resetForm() {
  form.key = ''
  form.quoteTitle = ''
  form.brand = ''
  form.category = ''
  form.srp = null
  form.lbp = null
  form.cashPrice = null
  form.defaultMonths = null
  form.hasTradeIn = false
  form.hasPrinthead = false
  form.machineWarranty = null
  form.printheadWarranty = ''
  form.serviceFee = null
  form.imageKey = ''
  form.availability = ''
  featuresText.value = ''
  inclusionsText.value = ''
  exclusivesText.value = ''
  consumables.value = []
  addons.value = []
  successMessage.value = ''
}

function generateKey(brand: string, model: string): string {
  return `${brand}_${model}`.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function populateForm(machine: Machine) {
  form.key = generateKey(machine.brand, machine.model)
  form.quoteTitle = `${machine.brand} ${machine.model}${machine.sub_model ? ' ' + machine.sub_model : ''}`
  form.brand = machine.brand
  form.category = machine.unit_condition
  form.srp = null
  form.lbp = null
  form.cashPrice = null
  form.defaultMonths = null
  form.hasTradeIn = false
  form.hasPrinthead = false
  form.machineWarranty = machine.warranty_machine_duration ? parseInt(machine.warranty_machine_duration) || null : null
  form.printheadWarranty = machine.warranty_printhead_duration ?? ''
  form.serviceFee = null
  form.imageKey = machine.image_key ?? ''
  form.availability = ''

  featuresText.value = machine.features
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((f) => f.description)
    .join('\n')

  inclusionsText.value = machine.inclusions
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.description)
    .join('\n')

  exclusivesText.value = machine.exclusions
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((e) => e.description)
    .join('\n')

  consumables.value = machine.consumables
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      name: c.item_name,
      uom: c.package_description ?? '',
      price: c.default_price != null ? String(c.default_price) : '',
    }))

  addons.value = machine.addons
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({
      name: a.description,
      uom: '',
      price: '',
    }))
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────
const saving = ref(false)

function buildInput(): MachineInput {
  const featuresArr = featuresText.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const inclusionsArr = inclusionsText.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const exclusionsArr = exclusivesText.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    brand: form.brand.trim(),
    model: form.quoteTitle.trim() || form.brand.trim(),
    sub_model: null,
    unit_condition: (form.category as 'Brand New' | 'Re-certified' | 'Demo Unit') || 'Brand New',
    letterhead: 'ES Print Media Inc.',
    features: featuresArr.map((desc, i) => ({ description: desc, sort_order: i })),
    consumables: consumables.value
      .filter((c) => c.name.trim())
      .map((c, i) => ({
        item_name: c.name.trim(),
        package_description: c.uom.trim() || null,
        default_price: parseFloat(c.price) || 0,
        sort_order: i,
      })),
    inclusions: inclusionsArr.map((desc, i) => ({ description: desc, sort_order: i })),
    exclusions: exclusionsArr.map((desc, i) => ({ description: desc, sort_order: i })),
    addons: addons.value
      .filter((a) => a.name.trim())
      .map((a, i) => ({ description: a.name.trim(), sort_order: i })),
  }
}

async function save() {
  saving.value = true
  const input = buildInput()

  if (selectedMachineId.value) {
    // Update existing
    const result = await catalogStore.updateMachine(selectedMachineId.value, input)
    if (result.success) {
      showSuccess('Saved successfully!')
    }
  } else {
    // Create new
    const result = await catalogStore.createMachine(input)
    if (result.success) {
      showSuccess('Machine created successfully!')
    }
  }
  saving.value = false
}

function createNew() {
  selectedMachineId.value = ''
  resetForm()
}

async function deleteMachine() {
  if (!selectedMachineId.value) return
  if (!confirm('Delete this machine?')) return
  saving.value = true
  const result = await catalogStore.softDeleteMachine(selectedMachineId.value)
  if (result.success) {
    showSuccess('Machine deleted.')
    selectedMachineId.value = ''
    resetForm()
  }
  saving.value = false
}

async function revert() {
  if (!confirm('Revert catalog to built-in defaults? This will refresh from the server.')) return
  await catalogStore.fetchMachines()
  selectedMachineId.value = ''
  resetForm()
  showSuccess('Reverted to built-in catalog.')
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  catalogStore.fetchMachines()
})
</script>

<template>
  <div class="cat-page">
    <!-- Top bar -->
    <div class="cat-top">
      <h2>Machine Catalog Editor</h2>
      <select v-model="selectedMachineId" class="cat-machine-sel">
        <option value="" disabled>Select a machine...</option>
        <option v-for="m in machineSelectorOptions" :key="m.id" :value="m.id">
          {{ m.label }}
        </option>
      </select>
      <button class="cat-btn" @click="createNew">+ New</button>
      <button class="cat-btn cat-del" :disabled="!selectedMachineId" @click="deleteMachine">Delete</button>
      <span style="flex:1"></span>
      <button class="cat-btn cat-revert" @click="revert">Revert to built-in</button>
    </div>

    <!-- Note -->
    <p class="cat-note">
      Add or revise machines here. Changes save in <b>this browser</b> and are used everywhere in the app
      (quotes, price list, product info). Prices in &#8369;. For list fields, put <b>one item per line</b>.
      Consumables format per line: <code>Name | Package | Price</code>.
    </p>

    <!-- Form -->
    <div class="cat-form">
      <div class="cf-row">
        <label>Key (unique ID)</label>
        <input v-model="form.key" class="fp-in" />
      </div>
      <div class="cf-row">
        <label>Quote Title</label>
        <input v-model="form.quoteTitle" class="fp-in" />
      </div>
      <div class="cf-row">
        <label>Brand</label>
        <input v-model="form.brand" class="fp-in" />
      </div>
      <div class="cf-row">
        <label>Category</label>
        <input v-model="form.category" class="fp-in" />
      </div>
      <div class="cf-row">
        <label>SRP</label>
        <input v-model.number="form.srp" class="fp-in" inputmode="decimal" />
      </div>
      <div class="cf-row">
        <label>LBP</label>
        <input v-model.number="form.lbp" class="fp-in" inputmode="decimal" />
      </div>
      <div class="cf-row">
        <label>Cash Price</label>
        <input v-model.number="form.cashPrice" class="fp-in" inputmode="decimal" />
      </div>
      <div class="cf-row">
        <label>Default Months</label>
        <input v-model.number="form.defaultMonths" class="fp-in" type="number" />
      </div>
      <div class="cf-row">
        <label>Has Trade-In</label>
        <input v-model="form.hasTradeIn" type="checkbox" />
      </div>
      <div class="cf-row">
        <label>Has Printhead / Laser Tube</label>
        <input v-model="form.hasPrinthead" type="checkbox" />
      </div>
      <div class="cf-row">
        <label>Machine Warranty (months)</label>
        <input v-model.number="form.machineWarranty" class="fp-in" inputmode="decimal" />
      </div>
      <div class="cf-row">
        <label>Printhead/Laser Tube Warranty</label>
        <input v-model="form.printheadWarranty" class="fp-in" placeholder="e.g. 6, or free text" />
      </div>
      <div class="cf-row">
        <label>Service Fee (after warranty)</label>
        <input v-model.number="form.serviceFee" class="fp-in" inputmode="decimal" />
      </div>
      <div class="cf-row">
        <label>Image Key (optional)</label>
        <input v-model="form.imageKey" class="fp-in" />
      </div>
      <div class="cf-row full">
        <label>Availability</label>
        <input v-model="form.availability" class="fp-in" />
      </div>

      <!-- Textareas -->
      <div class="cf-row full">
        <label>Features (one per line)</label>
        <textarea v-model="featuresText" rows="4" class="fp-in"></textarea>
      </div>
      <div class="cf-row full">
        <label>Standard Package / Inclusions (one per line)</label>
        <textarea v-model="inclusionsText" rows="4" class="fp-in"></textarea>
      </div>
      <div class="cf-row full">
        <label>Exclusives (one per line)</label>
        <textarea v-model="exclusivesText" rows="3" class="fp-in"></textarea>
      </div>

      <!-- Consumables table -->
      <div class="cf-row full">
        <label>Consumables</label>
        <table class="cf-tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit of Measure</th>
              <th>Unit Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in consumables" :key="idx">
              <td><input v-model="row.name" class="cf-c-name" /></td>
              <td><input v-model="row.uom" class="cf-c-uom" /></td>
              <td><input v-model="row.price" class="cf-c-price" inputmode="decimal" /></td>
              <td><button type="button" class="cf-rowdel" @click="removeConsumableRow(idx)">&times;</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="cf-addrow" @click="addConsumableRow()">+ Add Consumable</button>
      </div>

      <!-- Optional Add-Ons table -->
      <div class="cf-row full">
        <label>Optional Add-Ons</label>
        <table class="cf-tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit of Measure</th>
              <th>Unit Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in addons" :key="idx">
              <td><input v-model="row.name" class="cf-c-name" /></td>
              <td><input v-model="row.uom" class="cf-c-uom" /></td>
              <td><input v-model="row.price" class="cf-c-price" inputmode="decimal" /></td>
              <td><button type="button" class="cf-rowdel" @click="removeAddonRow(idx)">&times;</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="cf-addrow" @click="addAddonRow()">+ Add Add-On</button>
      </div>
    </div>

    <!-- Actions -->
    <div class="cat-actions">
      <button class="cat-save" :disabled="saving" @click="save">&#128190; Save Changes</button>
      <span v-if="successMessage" class="cat-msg">{{ successMessage }}</span>
    </div>

    <!-- Store Error -->
    <div v-if="catalogStore.error" class="cat-error">{{ catalogStore.error }}</div>
  </div>
</template>

<style scoped>
.cat-page {
  padding: 16px 20px;
  background: #eef0f2;
  min-height: calc(100vh - 40px);
}

.cat-top {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
  max-width: 920px;
}

.cat-top h2 {
  font-size: 16px;
  color: #c0392b;
  margin: 0;
}

.cat-machine-sel {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  max-width: 340px;
}

.cat-btn {
  padding: 6px 11px;
  border: 1px solid #c0392b;
  background: #fff;
  color: #c0392b;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.cat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cat-del {
  border-color: #aaa;
  color: #777;
}

.cat-revert {
  border-color: #aaa;
  color: #777;
}

.cat-note {
  font-size: 11px;
  color: #888;
  max-width: 920px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.cat-note code {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.cat-form {
  max-width: 920px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}

.cf-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cf-row.full {
  grid-column: 1 / -1;
}

.cf-row label {
  font-size: 11px;
  font-weight: 600;
  color: #555;
}

.cf-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #c0392b;
}

.cat-form input.fp-in {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.cat-form input.fp-in:focus {
  outline: none;
  border-color: #c0392b;
}

.cat-form textarea {
  font-family: inherit;
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.cat-form textarea:focus {
  outline: none;
  border-color: #c0392b;
}

.cf-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 4px;
}

.cf-tbl th {
  text-align: left;
  font-size: 10px;
  color: #888;
  font-weight: 600;
  padding: 1px 4px;
}

.cf-tbl td {
  padding: 2px 4px;
}

.cf-tbl td:nth-child(2) {
  width: 28%;
}

.cf-tbl td:nth-child(3) {
  width: 22%;
}

.cf-tbl td:nth-child(4) {
  width: 32px;
}

.cf-tbl input {
  width: 100%;
  padding: 4px 6px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.cf-tbl input:focus {
  outline: none;
  border-color: #c0392b;
}

.cf-rowdel {
  border: 1px solid #ddd;
  background: #fafafa;
  color: #c0392b;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  width: 26px;
  height: 26px;
}

.cf-addrow {
  margin-top: 2px;
  padding: 5px 10px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.cat-actions {
  max-width: 920px;
  margin: 12px 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-save {
  padding: 11px 20px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.cat-save:hover {
  background: #a93226;
}

.cat-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cat-msg {
  font-size: 12px;
  color: #27ae60;
  font-weight: 700;
}

.cat-error {
  max-width: 920px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fdecea;
  color: #c0392b;
  border-radius: 6px;
  font-size: 12px;
}

@media (max-width: 700px) {
  .cat-form {
    grid-template-columns: 1fr;
  }
}
</style>
