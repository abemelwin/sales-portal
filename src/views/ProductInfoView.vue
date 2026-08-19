<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useProductInfoStore } from '@/stores/productInfo'
import { useCatalogStore } from '@/stores/catalog'
import { useAuth } from '@/composables/useAuth'
import type { ProductInfoLink } from '@/types'

defineOptions({
  name: 'ProductInfoView',
})

const productInfoStore = useProductInfoStore()
const catalogStore = useCatalogStore()
const { role } = useAuth()

const isAdmin = computed(() => ['superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor'].includes(role.value || ''))

// View mode
type ViewMode = 'list' | 'detail'
const mode = ref<ViewMode>('list')
const selectedMachineId = ref<string | null>(null)

// Brand filter
const brandFilter = ref('')

// Categories
const categories = [
  { key: 'picture', label: 'Product Picture' },
  { key: 'sitereq', label: 'Site Requirements' },
  { key: 'catalog', label: 'Product Catalog' },
  { key: 'roi', label: 'ROI Computation' },
  { key: 'videos', label: 'Product Videos' },
  { key: 'others', label: 'Others' },
] as const

type CategoryKey = (typeof categories)[number]['key']

// Load data
onMounted(async () => {
  await Promise.all([
    productInfoStore.fetchLinks(),
    catalogStore.fetchMachines(),
  ])
})

// Unique brands for filter
const brands = computed(() => {
  const set = new Set(catalogStore.machines.map(m => m.brand))
  return Array.from(set).sort()
})

// Filtered & sorted machines for list view
const filteredMachines = computed(() => {
  let machines = [...catalogStore.machines]
  if (brandFilter.value) {
    machines = machines.filter(m => m.brand === brandFilter.value)
  }
  return machines.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
})

// Check if a machine has any link in a category
function hasCategory(machineId: string, category: string): boolean {
  return productInfoStore.productLinks.some(
    l => l.machine_id === machineId && l.document_type === category
  )
}

// Get links for selected machine + category
function getLinksForCategory(category: string): ProductInfoLink[] {
  if (!selectedMachineId.value) return []
  return productInfoStore.productLinks.filter(
    l => l.machine_id === selectedMachineId.value && l.document_type === category
  )
}

// Selected machine info
const selectedMachine = computed(() => {
  if (!selectedMachineId.value) return null
  return catalogStore.machines.find(m => m.id === selectedMachineId.value) ?? null
})

// Open detail view
function openDetail(machineId: string) {
  selectedMachineId.value = machineId
  mode.value = 'detail'
}

// Back to list
function backToList() {
  mode.value = 'list'
  selectedMachineId.value = null
}

// Add link (prompt)
async function addLink(category: CategoryKey) {
  if (!selectedMachineId.value) return
  const url = prompt('Paste the link / URL:')
  if (!url) return
  const label = prompt('Label for this link:', url)
  if (label === null) return
  await productInfoStore.addLink(
    selectedMachineId.value,
    label || url,
    url,
    category
  )
}

// Upload file (for now, same as add link but with file prompt label)
async function uploadFile(category: CategoryKey) {
  if (!selectedMachineId.value) return
  
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    // Upload to Supabase Storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${selectedMachineId.value}/${category}/${timestamp}_${safeName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-files')
      .upload(path, file)
    
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      return
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-files')
      .getPublicUrl(uploadData.path)
    
    const publicUrl = urlData.publicUrl
    
    // Save link to database
    await productInfoStore.addLink(
      selectedMachineId.value!,
      file.name,
      publicUrl,
      category
    )
  }
  input.click()
}

// Delete link
async function deleteLink(linkId: string) {
  if (!confirm('Remove this item?')) return
  await productInfoStore.deleteLink(linkId)
}
</script>

<template>
  <div class="product-info-page">
    <!-- ═══ LIST VIEW ═══ -->
    <template v-if="mode === 'list'">
      <div class="page-header">
        <h1 class="page-title">Product Information</h1>
        <select v-model="brandFilter" class="brand-filter" aria-label="Filter by brand">
          <option value="">All Brands</option>
          <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <p class="page-subtitle">
        Click a <strong>model name</strong> to view or manage its files.
        A ticked box means at least one file/link exists for that category.
        Files are stored in <strong>this browser on this computer</strong> (not shared across computers).
      </p>

      <!-- Loading -->
      <div v-if="productInfoStore.loading || catalogStore.loading" class="loading-state" aria-live="polite">
        Loading product information...
      </div>

      <!-- Error -->
      <div v-else-if="productInfoStore.error || catalogStore.error" class="error-state" role="alert">
        {{ productInfoStore.error || catalogStore.error }}
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="info-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Picture</th>
              <th>Site Req.</th>
              <th>Catalog</th>
              <th>ROI</th>
              <th>Videos</th>
              <th>Others</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(machine, idx) in filteredMachines"
              :key="machine.id"
              :class="{ 'row-even': idx % 2 === 1 }"
            >
              <td>{{ machine.brand }}</td>
              <td>
                <span class="model-link" @click="openDetail(machine.id)" role="button" tabindex="0" @keydown.enter="openDetail(machine.id)">
                  {{ machine.model }}<template v-if="machine.sub_model"> ({{ machine.sub_model }})</template>
                </span>
              </td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'picture')" disabled /></td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'sitereq')" disabled /></td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'catalog')" disabled /></td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'roi')" disabled /></td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'videos')" disabled /></td>
              <td class="cell-center"><input type="checkbox" :checked="hasCategory(machine.id, 'others')" disabled /></td>
            </tr>
            <tr v-if="filteredMachines.length === 0">
              <td colspan="8" class="empty-row">No machines found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ═══ DETAIL VIEW ═══ -->
    <template v-else-if="mode === 'detail' && selectedMachine">
      <button class="btn-back" @click="backToList">&larr; Back to list</button>

      <h1 class="detail-title">{{ selectedMachine.brand }} &mdash; {{ selectedMachine.model }}<template v-if="selectedMachine.sub_model"> ({{ selectedMachine.sub_model }})</template></h1>

      <p class="page-subtitle">
        Large videos are best added as a <strong>link</strong>.
        The <strong>Product Picture</strong> is used as the machine image on the quote.
      </p>

      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat.key"
          class="category-card"
        >
          <h3 class="card-title">{{ cat.label.toUpperCase() }}</h3>

          <ul v-if="getLinksForCategory(cat.key).length > 0" class="card-links">
            <li v-for="link in getLinksForCategory(cat.key)" :key="link.id" class="card-link-item">
              <a :href="link.url" target="_blank" rel="noopener noreferrer" class="card-link-anchor">
                {{ link.display_name }}
              </a>
              <button
                v-if="isAdmin"
                class="btn-remove"
                @click="deleteLink(link.id)"
                :aria-label="`Remove ${link.display_name}`"
                title="Remove"
              >&times;</button>
            </li>
          </ul>
          <p v-else class="no-files">No files yet.</p>

          <div v-if="isAdmin" class="card-actions">
            <button class="btn-upload" @click="uploadFile(cat.key)">&uarr; Upload File</button>
            <button class="btn-link" @click="addLink(cat.key)">&#128279; Add Link</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ─── Page Layout ───────────────────────────────────────────────────────────── */
.product-info-page {
  padding: 24px 32px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.brand-filter {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.page-subtitle {
  font-size: 0.92rem;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* ─── Loading & Error ───────────────────────────────────────────────────────── */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #888;
}

.error-state {
  text-align: center;
  padding: 24px;
  color: #c0392b;
  background: #fdeaea;
  border: 1px solid #c0392b;
  border-radius: 6px;
}

/* ─── Table ─────────────────────────────────────────────────────────────────── */
.table-wrapper {
  overflow-x: auto;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.info-table thead tr {
  background: #c0392b;
  color: #fff;
}

.info-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.info-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #eee;
}

.info-table tbody tr:hover {
  background: #fff3cd !important;
}

.row-even {
  background: #fbeeec;
}

.cell-center {
  text-align: center;
}

.model-link {
  color: #c0392b;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.model-link:hover {
  text-decoration: underline;
}

.empty-row {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 24px 12px;
}

/* ─── Detail View ───────────────────────────────────────────────────────────── */
.btn-back {
  background: none;
  border: 1px solid #c0392b;
  color: #c0392b;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 16px;
  transition: background 0.2s, color 0.2s;
}

.btn-back:hover {
  background: #c0392b;
  color: #fff;
}

.detail-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px;
}

/* ─── Category Grid ─────────────────────────────────────────────────────────── */
.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.category-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #c0392b;
}

.card-links {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  flex: 1;
}

.card-link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.card-link-item:last-child {
  border-bottom: none;
}

.card-link-anchor {
  color: #2980b9;
  text-decoration: none;
  font-size: 0.88rem;
  word-break: break-all;
}

.card-link-anchor:hover {
  text-decoration: underline;
}

.btn-remove {
  background: none;
  border: none;
  color: #c0392b;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-remove:hover {
  color: #e74c3c;
}

.no-files {
  flex: 1;
  color: #999;
  font-style: italic;
  font-size: 0.88rem;
  margin: 0 0 12px;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.btn-upload,
.btn-link {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid #c0392b;
  border-radius: 4px;
  background: #fff;
  color: #c0392b;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background 0.2s, color 0.2s;
}

.btn-upload:hover,
.btn-link:hover {
  background: #c0392b;
  color: #fff;
}

/* ─── Responsive ────────────────────────────────────────────────────────────── */
@media screen and (max-width: 767px) {
  .product-info-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }

  .info-table th,
  .info-table td {
    padding: 7px 8px;
    font-size: 0.82rem;
  }
}
</style>
