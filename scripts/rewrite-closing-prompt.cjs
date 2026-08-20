const fs = require('fs');
const file = 'c:\\Users\\Owner\\OneDrive\\Desktop\\Sales Portal\\src\\components\\quote\\ClosingDocsPrompt.vue';

const content = `<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  company: string
  address: string
  clientName: string
  clientContact: string
  clientConforme: string
  aeName: string
  tradeInDescriptions: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: any): void
}>()

// Form fields with defaults from quote
const buyerName = ref('')
const sigPosition = ref('OWNER')
const machineOrigin = ref('')
const accountExec = ref('')
const soNumber = ref('')
const regAddress = ref('')
const deliveryAddress = ref('')
const freight = ref('')
const contactPerson = ref('')
const contactNumber = ref('')
const deliveryDate = ref('')
const installDate = ref('')
const additionalItems = ref<string[]>([])
const dpDate = ref('')
const pdcCollect = ref('')
const otherInstr = ref('NONE')
const docsWho = ref('')
const tradeBrandModel = ref('')
const pulloutInstr = ref('')
const pulloutAddr = ref('')
const custRep = ref('')
const serialNumber = ref('')
const firstPdcDate = ref('')

// Prefill defaults when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (!buyerName.value) buyerName.value = props.clientConforme || ''
    if (!regAddress.value) regAddress.value = props.address || ''
    if (!deliveryAddress.value) deliveryAddress.value = props.address || ''
    if (!contactPerson.value) contactPerson.value = props.clientName || ''
    if (!contactNumber.value) contactNumber.value = props.clientContact || ''
    if (!custRep.value) custRep.value = props.clientName || ''
    if (!accountExec.value) accountExec.value = props.aeName || ''
    if (!tradeBrandModel.value && props.tradeInDescriptions.length) {
      tradeBrandModel.value = props.tradeInDescriptions.join('; ')
    }
    if (!pulloutAddr.value) pulloutAddr.value = props.address || ''
  }
})

function addItem() {
  additionalItems.value.push('')
}

function removeItem(idx: number) {
  additionalItems.value.splice(idx, 1)
}

function handleConfirm() {
  emit('confirm', {
    buyerName: buyerName.value,
    sigPosition: sigPosition.value,
    machineOrigin: machineOrigin.value,
    accountExec: accountExec.value,
    soNumber: soNumber.value,
    regAddress: regAddress.value,
    deliveryAddress: deliveryAddress.value,
    freight: freight.value,
    contactPerson: contactPerson.value,
    contactNumber: contactNumber.value,
    deliveryDate: deliveryDate.value,
    installDate: installDate.value,
    additionalItems: additionalItems.value.filter(Boolean),
    dpDate: dpDate.value,
    pdcCollect: pdcCollect.value,
    otherInstr: otherInstr.value,
    docsWho: docsWho.value,
    tradeBrandModel: tradeBrandModel.value,
    pulloutInstr: pulloutInstr.value,
    pulloutAddr: pulloutAddr.value,
    custRep: custRep.value,
    serialNumber: serialNumber.value,
    firstPdcDate: firstPdcDate.value,
  })
}
<\/script>

<template>
  <div v-if="open" class="dp-overlay" @click.self="emit('close')">
    <div class="dp-card">
      <div class="dp-head">
        <h3>Closing Document Details</h3>
        <span class="dp-close" @click="emit('close')">&times;</span>
      </div>
      <div class="dp-body">
        <div class="dp-note">
          Company &amp; address are captured from the quotation:<br>
          <b>{{ company || '(no company entered in quotation)' }}</b><br>
          <span>{{ address }}</span>
        </div>

        <div class="dp-sec">Contract / Terms &amp; Conditions</div>
        <label class="dp-lbl">Buyer Signatory Name</label>
        <input class="dp-in" v-model="buyerName" placeholder="Defaults to Client Conforme">
        <label class="dp-lbl">Signatory Position</label>
        <input class="dp-in" v-model="sigPosition" placeholder="OWNER">

        <div class="dp-sec">Delivery Instructions</div>
        <label class="dp-lbl">Machine Origin</label>
        <input class="dp-in" v-model="machineOrigin" placeholder="e.g. Manila Office / Branch stock">
        <label class="dp-lbl">Account Executive</label>
        <input class="dp-in" v-model="accountExec" placeholder="Defaults to quote AE">
        <label class="dp-lbl">SO Number</label>
        <input class="dp-in" v-model="soNumber" placeholder="Sales Order No.">
        <label class="dp-lbl">Registered Address</label>
        <input class="dp-in" v-model="regAddress" placeholder="Defaults to Client Address">
        <label class="dp-lbl">Delivery Address</label>
        <input class="dp-in" v-model="deliveryAddress" placeholder="Defaults to Client Address">
        <label class="dp-lbl">Freight Arrangement</label>
        <input class="dp-in" v-model="freight" placeholder="e.g. Shipper / For pick-up">
        <label class="dp-lbl">Contact Person</label>
        <input class="dp-in" v-model="contactPerson" placeholder="Defaults to Client Name">
        <label class="dp-lbl">Contact Number</label>
        <input class="dp-in" v-model="contactNumber" placeholder="Defaults to quotation contact">
        <div class="dp-row">
          <div>
            <label class="dp-lbl">Delivery Date</label>
            <input class="dp-in" type="date" v-model="deliveryDate">
          </div>
          <div>
            <label class="dp-lbl">Installation Date</label>
            <input class="dp-in" type="date" v-model="installDate">
          </div>
        </div>
        <label class="dp-lbl">Additional Delivery Items</label>
        <div v-for="(item, idx) in additionalItems" :key="idx" class="dp-addl-row">
          <input class="dp-in" v-model="additionalItems[idx]" placeholder="Item description">
          <button type="button" class="dp-addl-del" @click="removeItem(idx)">&times;</button>
        </div>
        <button type="button" class="dp-add-btn" @click="addItem">+ Add Item</button>

        <label class="dp-lbl">Date of Downpayment</label>
        <input class="dp-in" type="date" v-model="dpDate">
        <label class="dp-lbl">When to Collect PDCs</label>
        <input class="dp-in" v-model="pdcCollect" placeholder="e.g. Upon delivery">
        <label class="dp-lbl">Other Collection Instructions</label>
        <input class="dp-in" v-model="otherInstr" placeholder="NONE">
        <label class="dp-lbl">Who Will Get the Documents?</label>
        <input class="dp-in" v-model="docsWho" placeholder="e.g. Technician who will install">

        <div class="dp-sec">Trade-In Pullout (if trade-in deal)</div>
        <label class="dp-lbl">Brand &amp; Model of Trade-In Machine</label>
        <input class="dp-in" v-model="tradeBrandModel" placeholder="Defaults to trade-in description(s)">
        <label class="dp-lbl">Pullout Instructions for Trade-In Unit</label>
        <input class="dp-in" v-model="pulloutInstr" placeholder="e.g. Pull out upon delivery of new unit">
        <label class="dp-lbl">Pullout Address</label>
        <input class="dp-in" v-model="pulloutAddr" placeholder="Defaults to delivery address">

        <div class="dp-sec">Customer Acceptance</div>
        <label class="dp-lbl">Customer Representative</label>
        <input class="dp-in" v-model="custRep" placeholder="Person who will accept the machine">
        <label class="dp-lbl">Serial Number</label>
        <input class="dp-in" v-model="serialNumber" placeholder="Machine serial no.">

        <div class="dp-sec">Installment (PDC Schedule)</div>
        <label class="dp-lbl">First PDC / Amortization Date</label>
        <input class="dp-in" type="date" v-model="firstPdcDate">
      </div>
      <div class="dp-foot">
        <button class="dp-cancel" @click="emit('close')">Cancel</button>
        <button class="dp-ok" @click="handleConfirm">Open Documents &raquo;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.dp-card {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.dp-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
}
.dp-head h3 {
  margin: 0;
  font-size: 16px;
  color: #c0392b;
  font-weight: 700;
}
.dp-close {
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}
.dp-close:hover { color: #333; }
.dp-body {
  padding: 14px 18px;
  overflow-y: auto;
  flex: 1;
}
.dp-note {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: #555;
  margin-bottom: 12px;
}
.dp-sec {
  font-size: 12px;
  font-weight: 700;
  color: #c0392b;
  margin: 14px 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.dp-lbl {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  margin: 8px 0 3px;
}
.dp-in {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}
.dp-in:focus {
  outline: none;
  border-color: #c0392b;
}
.dp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.dp-addl-row {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}
.dp-addl-row .dp-in { flex: 1; }
.dp-addl-del {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  background: #fafafa;
  border-radius: 4px;
  color: #c0392b;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-end;
}
.dp-add-btn {
  margin: 4px 0 8px;
  padding: 5px 10px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.dp-foot {
  display: flex;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #eee;
  justify-content: flex-end;
}
.dp-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.dp-ok {
  padding: 10px 24px;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.dp-ok:hover { background: #a93226; }
</style>
`;

fs.writeFileSync(file, content);
console.log('ClosingDocsPrompt.vue rewritten to match reference modal');
