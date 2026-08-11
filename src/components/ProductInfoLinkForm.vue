<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ProductInfoLink } from '@/types'

/**
 * ProductInfoLinkForm — inline form for adding or editing a product info link.
 * Validates URL (max 2048 chars, valid format) and display name (1–150 chars).
 * Requirements: 9.5, 9.6, 9.7
 */

const props = defineProps<{
  machineId: string
  existingLink?: ProductInfoLink | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { display_name: string; url: string; document_type: string }]
  cancel: []
}>()

// Form state
const displayName = ref(props.existingLink?.display_name ?? '')
const url = ref(props.existingLink?.url ?? '')
const documentType = ref(props.existingLink?.document_type ?? '')

// Validation errors
const displayNameError = ref<string | null>(null)
const urlError = ref<string | null>(null)

// Reset form when existingLink changes (switching between edit targets)
watch(
  () => props.existingLink,
  (link) => {
    displayName.value = link?.display_name ?? ''
    url.value = link?.url ?? ''
    documentType.value = link?.document_type ?? ''
    displayNameError.value = null
    urlError.value = null
  }
)

const isEditing = computed(() => !!props.existingLink)

function validateDisplayName(): boolean {
  const val = displayName.value.trim()
  if (val.length < 1) {
    displayNameError.value = 'Display name is required.'
    return false
  }
  if (val.length > 150) {
    displayNameError.value = 'Display name must not exceed 150 characters.'
    return false
  }
  displayNameError.value = null
  return true
}

function validateUrl(): boolean {
  const val = url.value.trim()
  if (!val) {
    urlError.value = 'URL is required.'
    return false
  }
  if (val.length > 2048) {
    urlError.value = 'URL must not exceed 2048 characters.'
    return false
  }
  try {
    new URL(val)
  } catch {
    urlError.value = 'Please provide a valid URL (e.g., https://example.com).'
    return false
  }
  urlError.value = null
  return true
}

function handleSubmit() {
  const nameValid = validateDisplayName()
  const urlValid = validateUrl()

  if (!nameValid || !urlValid) {
    return
  }

  emit('submit', {
    display_name: displayName.value.trim(),
    url: url.value.trim(),
    document_type: documentType.value.trim(),
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form
    class="link-form"
    @submit.prevent="handleSubmit"
    :aria-label="isEditing ? 'Edit product info link' : 'Add product info link'"
  >
    <div class="form-row">
      <div class="form-field">
        <label :for="`link-name-${machineId}`" class="form-label">Display Name</label>
        <input
          :id="`link-name-${machineId}`"
          v-model="displayName"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': displayNameError }"
          placeholder="e.g. Product Brochure"
          maxlength="150"
          :aria-invalid="!!displayNameError"
          :aria-describedby="displayNameError ? `name-error-${machineId}` : undefined"
          @blur="validateDisplayName"
        />
        <p
          v-if="displayNameError"
          :id="`name-error-${machineId}`"
          class="form-error"
          role="alert"
        >
          {{ displayNameError }}
        </p>
      </div>

      <div class="form-field">
        <label :for="`link-url-${machineId}`" class="form-label">URL</label>
        <input
          :id="`link-url-${machineId}`"
          v-model="url"
          type="url"
          class="form-input"
          :class="{ 'form-input--error': urlError }"
          placeholder="https://example.com/document.pdf"
          maxlength="2048"
          :aria-invalid="!!urlError"
          :aria-describedby="urlError ? `url-error-${machineId}` : undefined"
          @blur="validateUrl"
        />
        <p
          v-if="urlError"
          :id="`url-error-${machineId}`"
          class="form-error"
          role="alert"
        >
          {{ urlError }}
        </p>
      </div>

      <div class="form-field">
        <label :for="`link-doctype-${machineId}`" class="form-label">Document Type</label>
        <select
          :id="`link-doctype-${machineId}`"
          v-model="documentType"
          class="form-input form-select"
        >
          <option value="">-- Select type --</option>
          <option value="Brochure">Brochure</option>
          <option value="Datasheet">Datasheet</option>
          <option value="Specification Sheet">Specification Sheet</option>
          <option value="User Manual">User Manual</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : (isEditing ? 'Update Link' : 'Add Link') }}
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="saving"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<style scoped>
.link-form {
  padding: var(--space-4);
  background-color: var(--color-gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-top: var(--space-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

@media screen and (max-width: 767px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-700);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 59, 130, 246), 0.15);
}

.form-input--error {
  border-color: var(--color-error);
}

.form-select {
  cursor: pointer;
}

.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin: 0;
}

.form-actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), opacity var(--transition-fast);
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
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-300);
}
</style>
