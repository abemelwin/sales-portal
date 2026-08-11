<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProductInfoStore } from '@/stores/productInfo'
import { useCatalogStore } from '@/stores/catalog'
import { useAuth } from '@/composables/useAuth'
import ProductInfoLinkForm from '@/components/ProductInfoLinkForm.vue'
import type { ProductInfoLink } from '@/types'

const productInfoStore = useProductInfoStore()
const catalogStore = useCatalogStore()
const { role } = useAuth()

const isAdmin = computed(() => role.value === 'admin')

// ─── Admin Form State ──────────────────────────────────────────────────────────

/** Machine ID for which the form is currently open */
const formMachineId = ref<string | null>(null)
/** Link being edited (null = adding a new link) */
const editingLink = ref<ProductInfoLink | null>(null)
/** Whether save is in progress */
const saving = ref(false)
/** Form-level error (from store/service failures) */
const formError = ref<string | null>(null)
/** Track link pending deletion confirmation */
const deletingLinkId = ref<string | null>(null)

// Fetch links and machines on mount
onMounted(async () => {
  await Promise.all([
    productInfoStore.fetchLinks(),
    catalogStore.fetchMachines(),
  ])
})

/**
 * Groups product info links by brand → model (alphabetically sorted).
 * Also includes models that have no links, showing a "no documents" message.
 * Requirements: 9.1, 9.2, 9.3
 */
interface ModelGroup {
  model: string
  subModel: string | null
  machineId: string
  links: ProductInfoLink[]
}

interface BrandGroup {
  brand: string
  models: ModelGroup[]
}

const groupedLinks = computed<BrandGroup[]>(() => {
  const machines = catalogStore.machines
  const links = productInfoStore.productLinks

  // Build a map of machine_id -> links
  const linksByMachine = new Map<string, ProductInfoLink[]>()
  for (const link of links) {
    const existing = linksByMachine.get(link.machine_id) ?? []
    existing.push(link)
    linksByMachine.set(link.machine_id, existing)
  }

  // Group machines by brand → model
  const brandMap = new Map<string, ModelGroup[]>()

  for (const machine of machines) {
    const brand = machine.brand
    const modelGroup: ModelGroup = {
      model: machine.model,
      subModel: machine.sub_model,
      machineId: machine.id,
      links: linksByMachine.get(machine.id) ?? [],
    }

    const existingBrand = brandMap.get(brand) ?? []
    existingBrand.push(modelGroup)
    brandMap.set(brand, existingBrand)
  }

  // Sort brands alphabetically, then models within each brand
  const sortedBrands = Array.from(brandMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([brand, models]) => ({
      brand,
      models: models.sort((a, b) => a.model.localeCompare(b.model)),
    }))

  return sortedBrands
})

// ─── Admin Actions ─────────────────────────────────────────────────────────────

function openAddForm(machineId: string) {
  formMachineId.value = machineId
  editingLink.value = null
  formError.value = null
}

function openEditForm(machineId: string, link: ProductInfoLink) {
  formMachineId.value = machineId
  editingLink.value = link
  formError.value = null
}

function closeForm() {
  formMachineId.value = null
  editingLink.value = null
  formError.value = null
}

async function handleSubmit(payload: { display_name: string; url: string; document_type: string }) {
  saving.value = true
  formError.value = null

  try {
    let result: { success: boolean; error?: string }

    if (editingLink.value) {
      // Editing existing link
      result = await productInfoStore.editLink(editingLink.value.id, payload)
    } else {
      // Adding new link
      result = await productInfoStore.addLink(
        formMachineId.value!,
        payload.display_name,
        payload.url,
        payload.document_type
      )
    }

    if (result.success) {
      closeForm()
    } else {
      // Show error, preserve form data (Requirement 9.7)
      formError.value = result.error ?? 'An unexpected error occurred. Please try again.'
    }
  } catch (err) {
    formError.value = 'An unexpected error occurred. Please try again.'
  } finally {
    saving.value = false
  }
}

async function handleDelete(linkId: string) {
  deletingLinkId.value = linkId
  try {
    const result = await productInfoStore.deleteLink(linkId)
    if (!result.success) {
      formError.value = result.error ?? 'Failed to delete the link.'
    }
  } catch (err) {
    formError.value = 'An unexpected error occurred while deleting the link.'
  } finally {
    deletingLinkId.value = null
  }
}

function confirmDelete(linkId: string) {
  if (window.confirm('Are you sure you want to delete this link?')) {
    handleDelete(linkId)
  }
}
</script>

<template>
  <div class="product-info-view">
    <h1 class="view-title">Product Information</h1>

    <!-- Loading state -->
    <div v-if="productInfoStore.loading || catalogStore.loading" class="loading-state" aria-live="polite">
      Loading product information...
    </div>

    <!-- Error state -->
    <div
      v-else-if="productInfoStore.error || catalogStore.error"
      class="error-state"
      role="alert"
      aria-live="assertive"
    >
      <p class="error-message">{{ productInfoStore.error || catalogStore.error }}</p>
    </div>

    <!-- Empty state when no machines exist -->
    <div v-else-if="groupedLinks.length === 0" class="empty-state">
      <p>No machines found in the catalog.</p>
    </div>

    <!-- Grouped product info links -->
    <div v-else class="brand-groups">
      <section
        v-for="brandGroup in groupedLinks"
        :key="brandGroup.brand"
        class="brand-section"
        :aria-label="`${brandGroup.brand} product information`"
      >
        <h2 class="brand-heading">{{ brandGroup.brand }}</h2>

        <div class="model-list">
          <div
            v-for="modelGroup in brandGroup.models"
            :key="`${brandGroup.brand}-${modelGroup.model}-${modelGroup.subModel ?? ''}`"
            class="model-card"
          >
            <div class="model-header">
              <h3 class="model-heading">
                {{ modelGroup.model }}
                <span v-if="modelGroup.subModel" class="sub-model">
                  ({{ modelGroup.subModel }})
                </span>
              </h3>

              <!-- Admin: Add Link button (Requirement 9.5) -->
              <button
                v-if="isAdmin && formMachineId !== modelGroup.machineId"
                class="btn btn-add"
                @click="openAddForm(modelGroup.machineId)"
                :aria-label="`Add link for ${modelGroup.model}`"
              >
                + Add Link
              </button>
            </div>

            <!-- Links for this model -->
            <ul v-if="modelGroup.links.length > 0" class="link-list">
              <li v-for="link in modelGroup.links" :key="link.id" class="link-item">
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link-anchor"
                >
                  <span class="link-name">{{ link.display_name }}</span>
                  <span class="link-type">{{ link.document_type }}</span>
                </a>

                <!-- Admin: Edit/Delete buttons (Requirement 9.5) -->
                <div v-if="isAdmin" class="link-admin-actions">
                  <button
                    class="btn-icon btn-edit"
                    @click="openEditForm(modelGroup.machineId, link)"
                    :aria-label="`Edit link: ${link.display_name}`"
                    title="Edit"
                  >
                    &#9998;
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    @click="confirmDelete(link.id)"
                    :disabled="deletingLinkId === link.id"
                    :aria-label="`Delete link: ${link.display_name}`"
                    title="Delete"
                  >
                    &#10005;
                  </button>
                </div>
              </li>
            </ul>

            <!-- No documents message (Requirement 9.3) -->
            <p v-else class="no-documents-message">
              No product information documents are available for this model.
            </p>

            <!-- Admin: Inline form for add/edit (Requirement 9.5, 9.6, 9.7) -->
            <div v-if="isAdmin && formMachineId === modelGroup.machineId">
              <!-- Service error message — preserves form data -->
              <div v-if="formError" class="form-service-error" role="alert">
                {{ formError }}
              </div>

              <ProductInfoLinkForm
                :machine-id="modelGroup.machineId"
                :existing-link="editingLink"
                :saving="saving"
                @submit="handleSubmit"
                @cancel="closeForm"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.product-info-view {
  padding: var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.view-title {
  font-size: var(--font-size-2xl);
  color: var(--color-gray-900);
  margin-bottom: var(--space-6);
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  text-align: center;
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-base);
  margin: 0;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-gray-500);
  font-size: var(--font-size-base);
}

/* Brand sections */
.brand-groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.brand-section {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background-color: var(--color-white);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.brand-heading {
  font-size: var(--font-size-xl);
  color: var(--color-white);
  background-color: var(--color-primary);
  padding: var(--space-3) var(--space-4);
  margin: 0;
}

/* Model list */
.model-list {
  display: flex;
  flex-direction: column;
}

.model-card {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-color);
}

.model-card:last-child {
  border-bottom: none;
}

.model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.model-heading {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-gray-800);
  margin: 0;
}

.sub-model {
  font-weight: 400;
  color: var(--color-gray-500);
}

/* Link list */
.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.link-item {
  display: flex;
  align-items: center;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.link-item:hover {
  background-color: var(--color-gray-50);
}

.link-anchor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
  color: var(--color-primary);
  border-radius: var(--radius-md);
  transition: color var(--transition-fast);
}

.link-anchor:hover {
  color: var(--color-primary-hover);
}

.link-anchor:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.link-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.link-type {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  background-color: var(--color-gray-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Admin action buttons on each link */
.link-admin-actions {
  display: flex;
  gap: var(--space-1);
  padding-right: var(--space-2);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-edit {
  color: var(--color-gray-600);
}

.btn-edit:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-delete {
  color: var(--color-gray-600);
}

.btn-delete:hover:not(:disabled) {
  background-color: var(--color-error);
  color: var(--color-white);
}

/* Add link button */
.btn-add {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.btn-add:hover {
  background-color: var(--color-primary);
  color: var(--color-white);
}

/* Form service error */
.form-service-error {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* No documents message */
.no-documents-message {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  font-style: italic;
  margin: 0;
  padding: var(--space-2) 0;
}

/* Mobile responsiveness */
@media screen and (max-width: 767px) {
  .product-info-view {
    padding: var(--space-4);
  }

  .model-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .link-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .link-anchor {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .link-admin-actions {
    padding-left: var(--space-3);
    padding-bottom: var(--space-2);
  }
}
</style>
