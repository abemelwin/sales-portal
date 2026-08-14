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
    <h2 class="doc-title">Terms &amp; Conditions</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="tc-client-name">Client Name</label>
        <input
          id="tc-client-name"
          type="text"
          :value="props.data.clientName"
          @input="update('clientName', $event)"
          placeholder="Client name"
        />
      </div>

      <div class="form-group">
        <label for="tc-company">Company</label>
        <input
          id="tc-company"
          type="text"
          :value="props.data.company"
          @input="update('company', $event)"
          placeholder="Company name"
        />
      </div>

      <div class="form-group">
        <label for="tc-address">Address</label>
        <input
          id="tc-address"
          type="text"
          :value="props.data.address"
          @input="update('address', $event)"
          placeholder="Client address"
        />
      </div>

      <div class="form-group">
        <label for="tc-contact">Contact</label>
        <input
          id="tc-contact"
          type="text"
          :value="props.data.contact"
          @input="update('contact', $event)"
          placeholder="Contact number"
        />
      </div>

      <div class="form-group">
        <label for="tc-machine-model">Machine Model</label>
        <input
          id="tc-machine-model"
          type="text"
          :value="props.data.machineModel"
          @input="update('machineModel', $event)"
          placeholder="Machine model"
        />
      </div>

      <div class="form-group">
        <label for="tc-contract-price">Contract Price</label>
        <input
          id="tc-contract-price"
          type="text"
          :value="props.data.contractPrice"
          @input="update('contractPrice', $event)"
          placeholder="Contract price"
        />
      </div>

      <div class="form-group">
        <label for="tc-down-payment">Down Payment</label>
        <input
          id="tc-down-payment"
          type="text"
          :value="props.data.downPayment"
          @input="update('downPayment', $event)"
          placeholder="Down payment amount"
        />
      </div>

      <div class="form-group">
        <label for="tc-monthly-amortization">Monthly Amortization</label>
        <input
          id="tc-monthly-amortization"
          type="text"
          :value="props.data.monthlyAmortization"
          @input="update('monthlyAmortization', $event)"
          placeholder="Monthly amortization"
        />
      </div>

      <div class="form-group full-width">
        <label for="tc-terms">Terms &amp; Conditions Text</label>
        <textarea
          id="tc-terms"
          :value="props.data.termsText"
          @input="update('termsText', $event)"
          placeholder="Enter terms and conditions..."
          rows="8"
        ></textarea>
      </div>

    </div>

    <!-- Signature block -->
    <div class="sig-section">
      <div class="sig-labels-row">
        <span>Very truly yours,</span>
        <span>Conforme:</span>
      </div>

      <div class="sig-grid">
        <div class="sig-cell">
          <div class="sig-line"></div>
          <input
            class="sig-name-input"
            type="text"
            :value="props.data.aeName"
            @input="update('aeName', $event)"
            placeholder="Account Executive name"
            aria-label="Account Executive name"
          />
          <div class="sig-role">Account Executive</div>
          <div class="sig-sub">Signature over Printed Name</div>
        </div>
        <div class="sig-cell">
          <div class="sig-line"></div>
          <input
            class="sig-name-input"
            type="text"
            :value="props.data.clientConforme"
            @input="update('clientConforme', $event)"
            placeholder="Client name"
            aria-label="Client conforme name"
          />
          <div class="sig-role">Client</div>
          <div class="sig-sub">Signature over Printed Name</div>
        </div>
      </div>

      <div class="sig-noted">
        <div class="sig-noted-label">Noted By:</div>
        <div class="sig-noted-line"></div>
        <input
          class="sig-noted-name-input"
          type="text"
          :value="props.data.notedByName"
          @input="update('notedByName', $event)"
          placeholder="Noted by name"
          aria-label="Noted by name"
        />
        <input
          class="sig-noted-role-input"
          type="text"
          :value="props.data.notedByRole"
          @input="update('notedByRole', $event)"
          placeholder="Role / Title"
          aria-label="Noted by role"
        />
      </div>
    </div>
  </div>
</template>
