<script setup lang="ts">
import { reactive, computed } from 'vue'

export interface ClosingDocsFormData {
  sigName: string
  sigPosition: string
  machineOrigin: string
  accountExec: string
  soNumber: string
  registeredAddress: string
  deliveryAddress: string
  freightArrangement: string
  contactPerson: string
  contactNumber: string
  deliveryDate: string
  installDate: string
  additionalItems: string[]
  dpDate: string
  pdcCollect: string
  otherInstructions: string
  docsWho: string
  tradeBrandModel: string
  pulloutInstructions: string
  pulloutAddress: string
  customerRep: string
  serialNumber: string
  firstPdcDate: string
  dpSchedule: { date: string; amount: string }[]
}

interface Props {
  open: boolean
  company: string
  address: string
  clientName: string
  clientContact: string
  clientConforme: string
  aeName: string
  tradeInDescriptions: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [data: ClosingDocsFormData]
}>()

const form = reactive({
  sigName: '',
  sigPosition: 'OWNER',
  machineOrigin: '',
  accountExec: '',
  soNumber: '',
  registeredAddress: '',
  deliveryAddress: '',
  freightArrangement: '',
  contactPerson: '',
  contactNumber: '',
  deliveryDate: '',
  installDate: '',
  additionalItems: [] as string[],
  dpDate: '',
  pdcCollect: '',
  otherInstructions: '',
  docsWho: '',
  tradeBrandModel: '',
  pulloutInstructions: '',
  pulloutAddress: '',
  customerRep: '',
  serialNumber: '',
  firstPdcDate: '',
  dpSchedule: [] as { date: string; amount: string }[],
})

// Pre-fill computed defaults
const sigNameValue = computed({
  get: () => form.sigName || props.clientConforme,
  set: (v: string) => { form.sigName = v },
})

const accountExecValue = computed({
  get: () => form.accountExec || props.aeName,
  set: (v: string) => { form.accountExec = v },
})

const registeredAddressValue = computed({
  get: () => form.registeredAddress || props.address,
  set: (v: string) => { form.registeredAddress = v },
})

const deliveryAddressValue = computed({
  get: () => form.deliveryAddress || props.address,
  set: (v: string) => { form.deliveryAddress = v },
})

const contactPersonValue = computed({
  get: () => form.contactPerson || props.clientName,
  set: (v: string) => { form.contactPerson = v },
})

const contactNumberValue = computed({
  get: () => form.contactNumber || props.clientContact,
  set: (v: string) => { form.contactNumber = v },
})

const tradeBrandModelValue = computed({
  get: () => form.tradeBrandModel || props.tradeInDescriptions.join(', '),
  set: (v: string) => { form.tradeBrandModel = v },
})

const customerRepValue = computed({
  get: () => form.customerRep || props.clientName,
  set: (v: string) => { form.customerRep = v },
})

function addAdditionalItem() {
  form.additionalItems.push('')
}

function removeAdditionalItem(index: number) {
  form.additionalItems.splice(index, 1)
}

function addDpScheduleItem() {
  form.dpSchedule.push({ date: '', amount: '' })
}

function removeDpScheduleItem(index: number) {
  form.dpSchedule.splice(index, 1)
}

function handleConfirm() {
  const data: ClosingDocsFormData = {
    sigName: sigNameValue.value,
    sigPosition: form.sigPosition,
    machineOrigin: form.machineOrigin,
    accountExec: accountExecValue.value,
    soNumber: form.soNumber,
    registeredAddress: registeredAddressValue.value,
    deliveryAddress: deliveryAddressValue.value,
    freightArrangement: form.freightArrangement,
    contactPerson: contactPersonValue.value,
    contactNumber: contactNumberValue.value,
    deliveryDate: form.deliveryDate,
    installDate: form.installDate,
    additionalItems: [...form.additionalItems],
    dpDate: form.dpDate,
    pdcCollect: form.pdcCollect,
    otherInstructions: form.otherInstructions,
    docsWho: form.docsWho,
    tradeBrandModel: tradeBrandModelValue.value,
    pulloutInstructions: form.pulloutInstructions,
    pulloutAddress: form.pulloutAddress,
    customerRep: customerRepValue.value,
    serialNumber: form.serialNumber,
    firstPdcDate: form.firstPdcDate,
    dpSchedule: form.dpSchedule.map((item) => ({ ...item })),
  }
  emit('confirm', data)
}
</script>

<template>
  <div v-if="open" class="dp-overlay" @click.self="emit('close')">
    <div class="dp-card">
      <!-- Header -->
      <div class="dp-head">
        <h3>Closing Documents</h3>
        <span class="dp-close" @click="emit('close')">&times;</span>
      </div>

      <!-- Body -->
      <div class="dp-body">
        <!-- Note -->
        <div class="dp-note">
          Company &amp; address are captured from the quotation:<br />
          <b>{{ company || '(no company entered in quotation)' }}</b
          ><br />
          <span>{{ address }}</span>
        </div>

        <!-- Section: Contract / Terms & Conditions -->
        <div class="dp-sec">Contract / Terms &amp; Conditions</div>
        <div class="dp-field">
          <label class="fp-lbl">Buyer Signatory Name</label>
          <input
            class="fp-in"
            type="text"
            v-model="sigNameValue"
            placeholder="Defaults to Client Conforme"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Signatory Position</label>
          <input class="fp-in" type="text" v-model="form.sigPosition" />
        </div>

        <!-- Section: Delivery Instructions -->
        <div class="dp-sec">Delivery Instructions</div>
        <div class="dp-field">
          <label class="fp-lbl">Machine Origin</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.machineOrigin"
            placeholder="e.g. Manila Office / Branch stock"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Account Executive</label>
          <input
            class="fp-in"
            type="text"
            v-model="accountExecValue"
            placeholder="Defaults to quote AE"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">SO Number</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.soNumber"
            placeholder="Sales Order No."
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Registered Address</label>
          <input
            class="fp-in"
            type="text"
            v-model="registeredAddressValue"
            placeholder="Defaults to Client Address"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Delivery Address</label>
          <input
            class="fp-in"
            type="text"
            v-model="deliveryAddressValue"
            placeholder="Defaults to Client Address"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Freight Arrangement</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.freightArrangement"
            placeholder="e.g. Shipper / For pick-up"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Contact Person</label>
          <input
            class="fp-in"
            type="text"
            v-model="contactPersonValue"
            placeholder="Defaults to Client Name"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Contact Number</label>
          <input
            class="fp-in"
            type="text"
            v-model="contactNumberValue"
            placeholder="Defaults to quotation contact"
          />
        </div>
        <div class="dp-row">
          <div class="dp-field">
            <label class="fp-lbl">Delivery Date</label>
            <input class="fp-in" type="date" v-model="form.deliveryDate" />
          </div>
          <div class="dp-field">
            <label class="fp-lbl">Installation Date</label>
            <input class="fp-in" type="date" v-model="form.installDate" />
          </div>
        </div>

        <!-- Additional Delivery Items (dynamic list) -->
        <div class="dp-field">
          <label class="fp-lbl">Additional Delivery Items</label>
          <div
            v-for="(_item, index) in form.additionalItems"
            :key="index"
            class="dp-dynamic-row"
          >
            <input
              class="fp-in"
              type="text"
              v-model="form.additionalItems[index]"
              placeholder="Item description"
            />
            <button
              type="button"
              class="dp-remove-btn"
              @click="removeAdditionalItem(index)"
            >
              &times;
            </button>
          </div>
          <button type="button" class="dp-add-btn" @click="addAdditionalItem">
            + Add Item
          </button>
        </div>

        <div class="dp-field">
          <label class="fp-lbl">Date of Downpayment</label>
          <input class="fp-in" type="date" v-model="form.dpDate" />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">When to Collect PDCs</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.pdcCollect"
            placeholder="e.g. Upon delivery"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Other Collection Instructions</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.otherInstructions"
            placeholder="NONE"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Who Will Get the Documents?</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.docsWho"
            placeholder="e.g. Technician who will install"
          />
        </div>

        <!-- Section: Trade-In Pullout -->
        <div class="dp-sec">Trade-In Pullout (if trade-in deal)</div>
        <div class="dp-field">
          <label class="fp-lbl">Brand &amp; Model of Trade-In Machine</label>
          <input
            class="fp-in"
            type="text"
            v-model="tradeBrandModelValue"
            placeholder="Brand & model"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl"
            >Pullout Instructions for Trade-In Unit</label
          >
          <input
            class="fp-in"
            type="text"
            v-model="form.pulloutInstructions"
            placeholder="e.g. Pull out upon delivery of new unit"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Pullout Address</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.pulloutAddress"
            placeholder="Defaults to delivery address"
          />
        </div>

        <!-- Section: Customer Acceptance -->
        <div class="dp-sec">Customer Acceptance</div>
        <div class="dp-field">
          <label class="fp-lbl">Customer Representative</label>
          <input
            class="fp-in"
            type="text"
            v-model="customerRepValue"
            placeholder="Customer rep name"
          />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Serial Number</label>
          <input
            class="fp-in"
            type="text"
            v-model="form.serialNumber"
            placeholder="Machine serial no."
          />
        </div>

        <!-- Section: Installment (PDC Schedule) -->
        <div class="dp-sec">Installment (PDC Schedule)</div>
        <div class="dp-field">
          <label class="fp-lbl">First PDC / Amortization Date</label>
          <input class="fp-in" type="date" v-model="form.firstPdcDate" />
        </div>
        <div class="dp-field">
          <label class="fp-lbl">Downpayment Schedule (optional)</label>
          <div
            v-for="(dpItem, index) in form.dpSchedule"
            :key="index"
            class="dp-dynamic-row"
          >
            <input
              class="fp-in dp-schedule-date"
              type="date"
              v-model="dpItem.date"
            />
            <input
              class="fp-in dp-schedule-amount"
              type="text"
              v-model="dpItem.amount"
              placeholder="Amount"
            />
            <button
              type="button"
              class="dp-remove-btn"
              @click="removeDpScheduleItem(index)"
            >
              &times;
            </button>
          </div>
          <button
            type="button"
            class="dp-add-btn"
            @click="addDpScheduleItem"
          >
            + Add Downpayment
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="dp-foot">
        <button type="button" class="dp-cancel" @click="emit('close')">
          Cancel
        </button>
        <button type="button" class="dp-ok" @click="handleConfirm">
          Open Documents &raquo;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-overlay {
  position: fixed;
  inset: 0;
  z-index: 800;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-card {
  background: #fff;
  border-radius: 10px;
  width: 470px;
  max-width: 94vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
}

.dp-head {
  display: flex;
  align-items: center;
  padding: 13px 18px;
  border-bottom: 2px solid #c0392b;
}

.dp-head h3 {
  flex: 1;
  color: #c0392b;
  font-size: 15px;
  margin: 0;
}

.dp-close {
  cursor: pointer;
  font-size: 24px;
  color: #999;
  line-height: 1;
}

.dp-body {
  padding: 14px 18px;
  overflow-y: auto;
}

.dp-note {
  background: #fff8f8;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11px;
  color: #555;
  margin-bottom: 6px;
  line-height: 1.5;
}

.dp-sec {
  font-size: 11px;
  font-weight: 700;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #eee;
  margin: 14px 0 6px;
  padding-bottom: 3px;
}

.dp-field {
  margin-bottom: 6px;
}

.dp-row {
  display: flex;
  gap: 6px;
}

.dp-row .dp-field {
  flex: 1;
}

.fp-lbl {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #666;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.fp-in {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #222;
  background: #fafafa;
  font-family: inherit;
  box-sizing: border-box;
}

.fp-in:focus {
  outline: none;
  border-color: #c0392b;
  background: #fff;
}

.dp-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #eee;
}

.dp-foot button {
  flex: 1;
  padding: 11px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.dp-cancel {
  background: #eee;
  color: #555;
}

.dp-ok {
  background: #c0392b;
  color: #fff;
}

/* Dynamic list styles */
.dp-dynamic-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.dp-dynamic-row .fp-in {
  flex: 1;
}

.dp-remove-btn {
  background: transparent;
  border: 1px solid #c0392b;
  color: #c0392b;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  width: 24px;
  height: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dp-remove-btn:hover {
  background: #fdecea;
}

.dp-add-btn {
  padding: 4px 10px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  margin-top: 2px;
}

.dp-add-btn:hover {
  background: #fdecea;
}

/* Schedule row inputs */
.dp-schedule-date {
  flex: 1;
}

.dp-schedule-amount {
  flex: 1;
}
</style>
