<script setup lang="ts">
import type { ClosingDocData } from './types'

const props = defineProps<{
  data: ClosingDocData
}>()

const emit = defineEmits<{
  (e: 'update', field: keyof ClosingDocData, value: string): void
}>()

function update(field: keyof ClosingDocData, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update', field, target.value)
}
</script>

<template>
  <div class="closing-doc-form">
    <h2 class="doc-title">Warranty Card</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="wc-client-name">Client Name</label>
        <input
          id="wc-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="wc-company">Company</label>
        <input
          id="wc-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group full-width">
        <label for="wc-address">Address</label>
        <input
          id="wc-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Client address"
        />
      </div>

      <div class="form-group">
        <label for="wc-contact">Contact</label>
        <input
          id="wc-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact number"
        />
      </div>

      <div class="form-group">
        <label for="wc-machine-model">Machine Model</label>
        <input
          id="wc-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="wc-serial-number">Serial Number</label>
        <input
          id="wc-serial-number"
          type="text"
          :value="props.data.serialNumber"
          @input="update('serialNumber', $event)"
          placeholder="Serial number"
        />
      </div>

      <div class="form-group">
        <label for="wc-warranty-start">Warranty Start Date</label>
        <input
          id="wc-warranty-start"
          type="text"
          :value="props.data.warrantyStartDate"
          @input="update('warrantyStartDate', $event)"
          placeholder="Start date"
        />
      </div>

      <div class="form-group">
        <label for="wc-warranty-end">Warranty End Date</label>
        <input
          id="wc-warranty-end"
          type="text"
          :value="props.data.warrantyEndDate"
          @input="update('warrantyEndDate', $event)"
          placeholder="End date"
        />
      </div>

      <div class="form-group full-width">
        <label for="wc-warranty-coverage">Warranty Coverage</label>
        <textarea
          id="wc-warranty-coverage"
          :value="props.data.warrantyCoverage"
          @input="update('warrantyCoverage', $event)"
          placeholder="Describe warranty coverage..."
          rows="5"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="wc-ae-name">Account Executive</label>
        <input
          id="wc-ae-name"
          type="text"
          :value="props.data.aeName"
          @input="update('aeName', $event)"
          placeholder="Account Executive name"
        />
      </div>

      <div class="form-group">
        <label for="wc-client-conforme">Client Conforme</label>
        <input
          id="wc-client-conforme"
          type="text"
          :value="props.data.clientConforme"
          @input="update('clientConforme', $event)"
          placeholder="Client conforme"
        />
      </div>
    </div>
  </div>
</template>
