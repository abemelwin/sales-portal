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
    <h2 class="doc-title">Pullout Form</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="po-client-name">Client Name</label>
        <input
          id="po-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="po-company">Company</label>
        <input
          id="po-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group full-width">
        <label for="po-address">Address</label>
        <input
          id="po-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Client address"
        />
      </div>

      <div class="form-group">
        <label for="po-contact">Contact</label>
        <input
          id="po-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact number"
        />
      </div>

      <div class="form-group">
        <label for="po-machine-model">Machine Model</label>
        <input
          id="po-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="po-serial-number">Serial Number</label>
        <input
          id="po-serial-number"
          type="text"
          :value="props.data.serialNumber"
          @input="update('serialNumber', $event)"
          placeholder="Serial number"
        />
      </div>

      <div class="form-group">
        <label for="po-pullout-date">Pullout Date</label>
        <input
          id="po-pullout-date"
          type="text"
          :value="props.data.pulloutDate"
          @input="update('pulloutDate', $event)"
          placeholder="Pullout date"
        />
      </div>

      <div class="form-group">
        <label for="po-pullout-reason">Reason for Pullout</label>
        <input
          id="po-pullout-reason"
          type="text"
          :value="props.data.pulloutReason"
          @input="update('pulloutReason', $event)"
          placeholder="Reason for pullout"
        />
      </div>

      <div class="form-group full-width">
        <label for="po-condition">Unit Condition at Pullout</label>
        <textarea
          id="po-condition"
          :value="props.data.unitConditionAtPullout"
          @input="update('unitConditionAtPullout', $event)"
          placeholder="Describe unit condition..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group full-width">
        <label for="po-remarks">Remarks</label>
        <textarea
          id="po-remarks"
          :value="props.data.remarks"
          @input="update('remarks', $event)"
          placeholder="Additional remarks..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="po-ae-name">Account Executive</label>
        <input
          id="po-ae-name"
          type="text"
          :value="props.data.aeName"
          @input="update('aeName', $event)"
          placeholder="Account Executive name"
        />
      </div>

      <div class="form-group">
        <label for="po-client-conforme">Client Conforme</label>
        <input
          id="po-client-conforme"
          type="text"
          :value="props.data.clientConforme"
          @input="update('clientConforme', $event)"
          placeholder="Client conforme"
        />
      </div>

      <div class="form-group">
        <label for="po-noted-by">Noted By</label>
        <input
          id="po-noted-by"
          type="text"
          :value="props.data.notedByName"
          @input="update('notedByName', $event)"
          placeholder="Noted by"
        />
      </div>
    </div>
  </div>
</template>
