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
    <h2 class="doc-title">Collection Agreement Confirmation (CAC)</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="cac-client-name">Client Name</label>
        <input
          id="cac-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="cac-company">Company</label>
        <input
          id="cac-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group full-width">
        <label for="cac-address">Address</label>
        <input
          id="cac-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Client address"
        />
      </div>

      <div class="form-group">
        <label for="cac-contact">Contact</label>
        <input
          id="cac-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact number"
        />
      </div>

      <div class="form-group">
        <label for="cac-machine-model">Machine Model</label>
        <input
          id="cac-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="cac-contract-price">Contract Price</label>
        <input
          id="cac-contract-price"
          type="text"
          :value="props.data.contractPrice"
          @input="update('contractPrice', $event)"
          placeholder="Contract price"
        />
      </div>

      <div class="form-group">
        <label for="cac-down-payment">Down Payment</label>
        <input
          id="cac-down-payment"
          type="text"
          :value="props.data.downPayment"
          @input="update('downPayment', $event)"
          placeholder="Down payment"
        />
      </div>

      <div class="form-group">
        <label for="cac-monthly-amortization">Monthly Amortization</label>
        <input
          id="cac-monthly-amortization"
          type="text"
          :value="props.data.monthlyAmortization"
          @input="update('monthlyAmortization', $event)"
          placeholder="Monthly amortization"
        />
      </div>

      <div class="form-group">
        <label for="cac-collection-date">Collection Date</label>
        <input
          id="cac-collection-date"
          type="text"
          :value="props.data.collectionDate"
          @input="update('collectionDate', $event)"
          placeholder="Collection date"
        />
      </div>

      <div class="form-group">
        <label for="cac-collection-time">Collection Time</label>
        <input
          id="cac-collection-time"
          type="text"
          :value="props.data.collectionTime"
          @input="update('collectionTime', $event)"
          placeholder="Collection time"
        />
      </div>

      <div class="form-group full-width">
        <label for="cac-remarks">Remarks</label>
        <textarea
          id="cac-remarks"
          :value="props.data.remarks"
          @input="update('remarks', $event)"
          placeholder="Additional remarks..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="cac-ae-name">Account Executive</label>
        <input
          id="cac-ae-name"
          type="text"
          :value="props.data.aeName"
          @input="update('aeName', $event)"
          placeholder="Account Executive name"
        />
      </div>

      <div class="form-group">
        <label for="cac-client-conforme">Client Conforme</label>
        <input
          id="cac-client-conforme"
          type="text"
          :value="props.data.clientConforme"
          @input="update('clientConforme', $event)"
          placeholder="Client conforme"
        />
      </div>
    </div>
  </div>
</template>
