<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useProductInfoStore } from '@/stores/productInfo'
import { useCatalogStore } from '@/stores/catalog'
import { useAuth } from '@/composables/useAuth'
import { usePermissionsStore } from '@/stores/permissions'
import { useModal } from '@/composables/useModal'
import type { ProductInfoLink } from '@/types'

defineOptions({
  name: 'ProductInfoView',
})

const productInfoStore = useProductInfoStore()
const catalogStore = useCatalogStore()
const permStore = usePermissionsStore()
const { role } = useAuth()
const modal = useModal()

const canModifyProductFiles = computed(() => {
  if (role.value === 'superadmin') return true
  return permStore.can('upload_machine_catalog')
})

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
  if (role.value) {
    permStore.fetchPermissions(role.value)
  }
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
  const url = await modal.prompt({
    title: 'Add Link / URL',
    message: 'Paste the link or URL below:',
    placeholder: 'https://...',
    confirmText: 'Next',
  })
  if (!url) return
  const label = await modal.prompt({
    title: 'Link Display Label',
    message: 'Enter a display name / label for this link:',
    defaultValue: url,
    placeholder: 'e.g., User Manual PDF',
    confirmText: 'Add Link',
  })
  if (label === null) return
  await productInfoStore.addLink(
    selectedMachineId.value,
    label || url,
    url,
    category
  )
}

// ─── File size and compression constants ────────────────────────────────────
const MAX_IMAGE_WIDTH = 1200      // px — resize larger images
const IMAGE_QUALITY = 0.82        // 82% quality — good balance
const MAX_PDF_SIZE_MB = 10        // PDF/doc files max 10MB

/**
 * Compress an image file using Canvas API.
 * Returns a new Blob at reduced size/quality.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      // Scale down if wider than max
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round((height * MAX_IMAGE_WIDTH) / width)
        width = MAX_IMAGE_WIDTH
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        IMAGE_QUALITY
      )
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = url
  })
}

// Upload file
async function uploadFile(category: CategoryKey) {
  if (!selectedMachineId.value) return
  
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const fileSizeMB = file.size / (1024 * 1024)

    // File size validation for non-image files
    if (!isImage && fileSizeMB > MAX_PDF_SIZE_MB) {
      alert(`File too large (${fileSizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_PDF_SIZE_MB} MB for documents.`)
      return
    }

    let uploadBlob: Blob | File = file
    let uploadName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Auto-compress images
    if (isImage) {
      try {
        const originalMB = fileSizeMB.toFixed(1)
        uploadBlob = await compressImage(file)
        const compressedMB = (uploadBlob.size / (1024 * 1024)).toFixed(1)
        console.info(`Image compressed: ${originalMB}MB → ${compressedMB}MB`)
        // Save as .jpg after compression
        uploadName = uploadName.replace(/\.[^.]+$/, '') + '.jpg'
      } catch {
        // Fallback to original if compression fails
        uploadBlob = file
      }
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const path = `${selectedMachineId.value}/${category}/${timestamp}_${uploadName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-files')
      .upload(path, uploadBlob)
    
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
  const ok = await modal.confirm({
    title: 'Remove Item',
    message: 'Are you sure you want to remove this item?',
    confirmText: 'Remove',
    cancelText: 'Cancel',
    isDanger: true,
  })
  if (!ok) return
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
                v-if="canModifyProductFiles"
                class="btn-remove"
                @click="deleteLink(link.id)"
                :aria-label="`Remove ${link.display_name}`"
                title="Remove"
              >&times;</button>
            </li>
          </ul>
          <p v-else class="no-files">No files yet.</p>

          <div v-if="canModifyProductFiles" class="card-actions">
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
  color: #666;
  font-size: 0.88rem;
  margin-bottom: 20px;
  line-height: 1.4;
}

.loading-state,
.error-state {
  padding: 32px;
  text-align: center;
  font-size: 1rem;
}

.error-state {
  color: #e74c3c;
}

/* ─── Table ─────────────────────────────────────────────────────────────────── */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: #fff;
}

.info-table th {
  background: #c0392b;
  color: #fff;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.row-even {
  background-color: #fbeeec;
}

.cell-center {
  text-align: center;
}

.cell-center input[type='checkbox'] {
  accent-color: #c0392b;
  width: 16px;
  height: 16px;
  cursor: default;
}

.model-link {
  color: #c0392b;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.model-link:hover {
  color: #962d22;
}

.empty-row {
  text-align: center;
  color: #888;
  padding: 24px;
}

/* ─── Detail View ───────────────────────────────────────────────────────────── */
.btn-back {
  background: none;
  border: 1px solid #ccc;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  margin-bottom: 16px;
  color: #555;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background: #eee;
  color: #2c3e50;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 6px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.category-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #7f8c8d;
  letter-spacing: 0.8px;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f2f2f2;
}

.card-links {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  flex: 1;
}

.card-link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
  gap: 8px;
}

.card-link-anchor {
  color: #2980b9;
  font-size: 0.88rem;
  text-decoration: none;
  word-break: break-all;
}

.card-link-anchor:hover {
  text-decoration: underline;
}

.btn-remove {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-remove:hover {
  color: #c0392b;
}

.no-files {
  color: #aaa;
  font-size: 0.85rem;
  font-style: italic;
  margin: 0 0 16px 0;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-upload,
.btn-link {
  flex: 1;
  padding: 7px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #fff;
  color: #444;
  transition: background 0.15s ease;
}

.btn-upload:hover,
.btn-link:hover {
  background: #f5f5f5;
  color: #2c3e50;
}

@media screen and (max-width: 768px) {
  .product-info-page {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .brand-filter {
    width: 100%;
    font-size: 16px;
    padding: 8px 12px;
    min-height: 44px;
  }

  .category-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .btn-upload,
  .btn-link {
    min-height: 44px;
    font-size: 0.88rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
