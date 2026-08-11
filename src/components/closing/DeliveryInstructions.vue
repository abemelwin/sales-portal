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
    <h2 class="doc-title">Delivery Instructions</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="di-client-name">Client Name</label>
        <input
          id="di-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="di-company">Company</label>
        <input
          id="di-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group full-width">
        <label for="di-address">Delivery Address</label>
        <input
          id="di-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Delivery address"
        />
      </div>

      <div class="form-group">
        <label for="di-contact">Contact Person</label>
        <input
          id="di-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact person"
        />
      </div>

      <div class="form-group">
        <label for="di-machine-model">Machine Model</label>
        <input
          id="di-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="di-delivery-date">Delivery Date</label>
        <input
          id="di-delivery-date"
          type="text"
          :value="props.data.deliveryDate"
          @input="update('deliveryDate', $event)"
          placeholder="Delivery date"
        />
      </div>

      <div class="form-group">
        <label for="di-delivery-time">Delivery Time</label>
        <input
          id="di-delivery-time"
          type="text"
          :value="props.data.deliveryTime"
          @input="update('deliveryTime', $event)"
          placeholder="Delivery time"
        />
      </div>

      <div class="form-group full-width">
        <label for="di-instructions">Special Instructions</label>
        <textarea
          id="di-instructions"
          :value="props.data.specialInstructions"
          @input="update('specialInstructions', $event)"
          placeholder="Enter special delivery instructions..."
          rows="5"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="di-ae-name">Account Executive</label>
        <input
          id="di-ae-name"
          type="text"
          :value="props.data.aeName"
          @input="update('aeName', $event)"
          placeholder="Account Executive name"
        />
      </div>

      <div class="form-group">
        <label for="di-noted-by">Noted By</label>
        <input
          id="di-noted-by"
          type="text"
          :value="props.data.notedByName"
          @input="update('notedByName', $event)"
          placeholder="Noted by"
        />
      </div>
    </div>
  </div>
</template>
