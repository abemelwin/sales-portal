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
    <h2 class="doc-title">Post-Dated Checks (PDC)</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="pdc-client-name">Client Name</label>
        <input
          id="pdc-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="pdc-company">Company</label>
        <input
          id="pdc-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group full-width">
        <label for="pdc-address">Address</label>
        <input
          id="pdc-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Client address"
        />
      </div>

      <div class="form-group">
        <label for="pdc-contact">Contact</label>
        <input
          id="pdc-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact number"
        />
      </div>

      <div class="form-group">
        <label for="pdc-machine-model">Machine Model</label>
        <input
          id="pdc-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="pdc-contract-price">Contract Price</label>
        <input
          id="pdc-contract-price"
          type="text"
          :value="props.data.contractPrice"
          @input="update('contractPrice', $event)"
          placeholder="Contract price"
        />
      </div>

      <div class="form-group">
        <label for="pdc-down-payment">Down Payment</label>
        <input
          id="pdc-down-payment"
          type="text"
          :value="props.data.downPayment"
          @input="update('downPayment', $event)"
          placeholder="Down payment"
        />
      </div>

      <div class="form-group">
        <label for="pdc-monthly-amortization">Monthly Amortization</label>
        <input
          id="pdc-monthly-amortization"
          type="text"
          :value="props.data.monthlyAmortization"
          @input="update('monthlyAmortization', $event)"
          placeholder="Monthly amortization"
        />
      </div>

      <div class="form-group">
        <label for="pdc-bank-name">Bank Name</label>
        <input
          id="pdc-bank-name"
          type="text"
          :value="props.data.bankName"
          @input="update('bankName', $event)"
          placeholder="Bank name"
        />
      </div>

      <div class="form-group">
        <label for="pdc-check-numbers">Check Number(s)</label>
        <input
          id="pdc-check-numbers"
          type="text"
          :value="props.data.checkNumbers"
          @input="update('checkNumbers', $event)"
          placeholder="Check numbers"
        />
      </div>

      <div class="form-group">
        <label for="pdc-number-of-checks">Number of Checks</label>
        <input
          id="pdc-number-of-checks"
          type="text"
          :value="props.data.numberOfChecks"
          @input="update('numberOfChecks', $event)"
          placeholder="Number of checks"
        />
      </div>

      <div class="form-group">
        <label for="pdc-check-amount">Amount per Check</label>
        <input
          id="pdc-check-amount"
          type="text"
          :value="props.data.checkAmount"
          @input="update('checkAmount', $event)"
          placeholder="Amount per check"
        />
      </div>

      <div class="form-group full-width">
        <label for="pdc-remarks">Remarks</label>
        <textarea
          id="pdc-remarks"
          :value="props.data.remarks"
          @input="update('remarks', $event)"
          placeholder="Additional remarks..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="pdc-ae-name">Account Executive</label>
        <input
          id="pdc-ae-name"
          type="text"
          :value="props.data.aeName"
          @input="update('aeName', $event)"
          placeholder="Account Executive name"
        />
      </div>

      <div class="form-group">
        <label for="pdc-client-conforme">Client Conforme</label>
        <input
          id="pdc-client-conforme"
          type="text"
          :value="props.data.clientConforme"
          @input="update('clientConforme', $event)"
          placeholder="Client conforme"
        />
      </div>
    </div>
  </div>
</template>
