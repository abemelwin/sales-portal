<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { role } = useAuth()
const isAdmin = computed(() => ['superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor'].includes(role.value || ''))

interface PriceListItem {
  id: string
  name: string
  date: string
  source: 'Built-in' | 'Uploaded'
  blob?: Blob
  url?: string
}

const BUILTIN_PRICELISTS: PriceListItem[] = [
  { id: 'acrylic_sintra', name: 'Acrylic & Sintra Price List', date: 'June 22, 2026', source: 'Built-in', url: '/pricelists/acrylic_sintra.pdf' },
  { id: 'artistic_wallpaper', name: 'Artistic & Wallpaper Price List', date: 'July 25, 2025', source: 'Built-in', url: '/pricelists/artistic_wallpaper.pdf' },
  { id: '3m_graphic', name: '3M Graphic Film Price List', date: 'July 1, 2026', source: 'Built-in', url: '/pricelists/3m_graphic.pdf' },
  { id: '3m_reflective', name: '3M Reflective Film Price List', date: 'July 1, 2026', source: 'Built-in', url: '/pricelists/3m_reflective.pdf' },
  { id: 'solvent_media', name: 'Solvent Media Price List', date: 'July 3, 2026', source: 'Built-in', url: '/pricelists/solvent_media.pdf' },
  { id: 'textile_media', name: 'Textile Media Price List', date: 'July 23, 2026', source: 'Built-in', url: '/pricelists/textile_media.pdf' },
  { id: '3d_patch', name: '3D Patch Price List', date: 'November 13, 2019', source: 'Built-in', url: '/pricelists/3d_patch.pdf' },
]

const uploadedLists = ref<PriceListItem[]>([])
const viewingItem = ref<PriceListItem | null>(null)
const viewerUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const allLists = computed(() => [...BUILTIN_PRICELISTS, ...uploadedLists.value])
const listCount = computed(() => allLists.value.length)

function openPriceList(item: PriceListItem) {
  viewingItem.value = item
  if (item.blob) {
    if (viewerUrl.value) URL.revokeObjectURL(viewerUrl.value)
    viewerUrl.value = URL.createObjectURL(item.blob)
  } else {
    viewerUrl.value = item.url || null
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  Array.from(files).forEach(file => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    uploadedLists.value.push({
      id: `uploaded_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      date: dateStr,
      source: 'Uploaded',
      blob: file,
    })
  })

  input.value = ''
}

function deleteUploaded(id: string) {
  if (!confirm('Remove this price list?')) return
  uploadedLists.value = uploadedLists.value.filter(item => item.id !== id)
  if (viewingItem.value?.id === id) {
    viewingItem.value = null
    viewerUrl.value = null
  }
}
</script>

<template>
  <div class="cons-page">
    <!-- Header -->
    <div class="cons-head">
      <h1>Consumables Pricelist</h1>
      <span class="cons-status">{{ listCount }} price lists</span>
      <button v-if="isAdmin" class="cons-up" @click="triggerUpload">
        &#8593; Upload Price List (PDF/Excel)
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.xlsx,.xls,.csv"
        multiple
        hidden
        @change="handleUpload"
      />
    </div>

    <!-- Subtitle -->
    <p class="cons-note">
      Click a price list to view it below (PDF). Built-in lists are available to everyone;
      authorized roles can add more (PDF or Excel), stored in this browser.
    </p>

    <!-- Table -->
    <div class="cons-table-wrap">
      <table class="cons-table">
        <thead>
          <tr>
            <th>Price List</th>
            <th>As Of</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in allLists"
            :key="item.id"
            :class="{ band: idx % 2 === 1 }"
          >
            <td>
              <span class="cons-link" @click="openPriceList(item)">
                &#x1F4C4; {{ item.name }}
              </span>
              <button
                v-if="item.source === 'Uploaded' && isAdmin"
                class="cons-del"
                style="margin-left: 8px;"
                @click="deleteUploaded(item.id)"
              >
                ✕
              </button>
            </td>
            <td>{{ item.date }}</td>
            <td>{{ item.source }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Viewer -->
    <div v-if="viewingItem" class="cons-viewer">
      <div class="cons-viewer-hd">
        <span>&#x1F4C4; {{ viewingItem.name }}</span>
        <a v-if="viewerUrl" :href="viewerUrl" target="_blank" rel="noopener">Download</a>
      </div>
      <iframe
        v-if="viewerUrl"
        class="cons-frame"
        :src="viewerUrl"
      ></iframe>
      <div v-else class="cons-placeholder">
        PDF viewer — file not available in this version. Upload a PDF to view it here.
      </div>
    </div>
  </div>
</template>

<style scoped>
.cons-page {
  padding: 16px 20px;
  background: #eef0f2;
  min-height: calc(100vh - 40px);
}

.cons-head {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.cons-head h1 {
  font-size: 16px;
  color: #c0392b;
  margin: 0;
  flex: 1;
}

.cons-status {
  font-size: 11px;
  color: #888;
}

.cons-up {
  padding: 7px 12px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.cons-up:hover {
  background: #a93226;
}

.cons-note {
  font-size: 11px;
  color: #888;
  margin-bottom: 12px;
  line-height: 1.5;
}

/* Table */
.cons-table-wrap {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  margin-bottom: 10px;
}

.cons-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}

.cons-table thead th {
  background: #c0392b;
  color: #fff;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 9px 10px;
  text-align: left;
}

.cons-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.cons-table tbody tr:hover td {
  background: #fff3cd;
}

.cons-table .band td {
  background: #fbeeec;
}

.cons-link {
  color: #c0392b;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}

.cons-link:hover {
  text-decoration: underline;
}

/* Viewer */
.cons-viewer {
  margin-top: 10px;
}

.cons-viewer-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-weight: 700;
  color: #c0392b;
  font-size: 13px;
}

.cons-viewer-hd a {
  color: #2a6fb0;
  text-decoration: none;
  font-weight: 600;
}

.cons-viewer-hd a:hover {
  text-decoration: underline;
}

.cons-frame {
  width: 100%;
  height: 72vh;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
}

.cons-unavailable {
  color: #999;
  font-size: 12px;
  font-style: italic;
  text-align: center;
  padding: 20px 0;
  margin: 0;
}

.cons-download-link {
  color: #2a6fb0;
  text-decoration: none;
  font-weight: 600;
}

.cons-download-link:hover {
  text-decoration: underline;
}

.cons-del {
  padding: 3px 8px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.cons-del:hover {
  background: #fdecea;
}
</style>
