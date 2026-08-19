<script setup lang="ts">
import { computed } from 'vue'
import letterheadEspmiHeader from '@/assets/letterhead-espmi-1.jpg'
import letterheadEspmiFooter from '@/assets/letterhead-espmi-2.jpg'
import letterheadAcsHeader from '@/assets/letterhead-acs-1.jpg'
import letterheadAcsFooter from '@/assets/letterhead-acs-2.jpg'

const props = defineProps<{
  docType: string
  quoteState: any
  promptDetails?: any
}>()

// Map tab names to standardized codes
const activeDoc = computed(() => {
  const t = props.docType
  if (t === 'terms-conditions' || t === 'tc') return 'tc'
  if (t === 'delivery-instructions' || t === 'di') return 'di'
  if (t === 'warranty-card' || t === 'wc') return 'wc'
  if (t === 'cac') return 'cac'
  if (t === 'pdc') return 'pdc'
  if (t === 'pullout' || t === 'pull') return 'pull'
  return 'tc'
})

// Number to English words conversion
function numWords(n: number): string {
  let num = Math.floor(Math.abs(Number(n) || 0))
  if (num === 0) return 'Zero'
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function b3(x: number): string {
    let s = ''
    if (x >= 100) {
      s += ones[Math.floor(x / 100)] + ' Hundred'
      x %= 100
      if (x) s += ' '
    }
    if (x >= 20) {
      s += tens[Math.floor(x / 10)]
      x %= 10
      if (x) s += ' ' + ones[x]
    } else if (x > 0) {
      s += ones[x]
    }
    return s
  }

  let out = ''
  const scales: [number, string][] = [
    [1000000000, 'Billion'],
    [1000000, 'Million'],
    [1000, 'Thousand'],
    [1, '']
  ]
  for (const item of scales) {
    const u = item[0]
    const scaleName = item[1]
    if (num >= u) {
      const c = Math.floor(num / u)
      num %= u
      out += (out ? ' ' : '') + b3(c) + (scaleName ? ' ' + scaleName : '')
    }
  }
  return out.trim()
}

// Currency number formatting
function fmtN(val: number | null | undefined): string {
  const n = Number(val) || 0
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Date formatting (YYYY-MM-DD -> Month DD, YYYY)
function formatDate(val: string | null | undefined): string {
  if (!val) return ''
  const d = new Date(val + 'T00:00:00')
  if (isNaN(d.getTime())) return val
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// Letterhead image sources
const letterheadHeaderSrc = computed(() => {
  return props.quoteState?.letterhead === 'ACS / Alternative' ? letterheadAcsHeader : letterheadEspmiHeader
})

const letterheadFooterSrc = computed(() => {
  return props.quoteState?.letterhead === 'ACS / Alternative' ? letterheadAcsFooter : letterheadEspmiFooter
})

// Company name substitution helper
const coName = computed(() => {
  return props.quoteState?.warrantyCompany?.trim() || 'ES Print Media Inc.'
})

function coSub(text: string): string {
  const c = coName.value
  return text
    .split('ES Print Industries Inc.').join(c)
    .split('ES Print Media Inc.').join(c)
    .split('ES PRINT INDUSTRIES INC.').join(c.toUpperCase())
    .split('ES PRINT MEDIA INC.').join(c.toUpperCase())
    .split('ES Print-supplied').join(c + '-supplied')
    .split('ES Print does not guarantee').join(c + ' does not guarantee')
    .split('ES Print will not conduct').join(c + ' will not conduct')
    .split('ES Print will no longer').join(c + ' will no longer')
}

// Quote Data calculations
const price = computed(() => Number(props.quoteState?.contract_price ?? props.quoteState?.contractPrice) || 0)
const priceWords = computed(() => numWords(price.value))
const priceFig = computed(() => Math.round(price.value))

const dt = computed(() => String(props.quoteState?.deal_type ?? props.quoteState?.dealType ?? 'Cash'))
const isTerms = computed(() => {
  const d = dt.value.toLowerCase()
  return d.includes('term') || d.includes('installment') || d === 'std_terms' || d === 'ti_terms'
})

const ptDown = computed(() => {
  if (props.quoteState?.down_payment !== undefined && props.quoteState?.down_payment !== null) {
    return Number(props.quoteState.down_payment) || 0
  }
  if (props.quoteState?.downPayment !== undefined && props.quoteState?.downPayment !== null) {
    return Number(props.quoteState.downPayment) || 0
  }
  return 0
})

const tradeIns = computed(() => props.quoteState?.trade_ins ?? props.quoteState?.tradeIns ?? [])
const validTradeIns = computed(() => {
  return tradeIns.value.filter((ti: any) => {
    const d = (ti.description ?? ti.desc ?? '').trim()
    const v = Number(ti.value ?? ti.val) || 0
    return d.length > 0 || v > 0
  })
})
const tradeInSum = computed(() => validTradeIns.value.reduce((sum: number, ti: any) => sum + (Number(ti.value ?? ti.val) || 0), 0))
const tiDesc = computed(() => validTradeIns.value.map((t: any) => (t.description ?? t.desc ?? '').trim()).filter(Boolean).join('; '))

const isTI = computed(() => {
  const d = dt.value.toLowerCase()
  const hasTradeInRecords = validTradeIns.value.length > 0 && tradeInSum.value > 0
  return d.includes('trade') || d.includes('ti_') || hasTradeInRecords
})

const months = computed(() => {
  const m = Number(props.quoteState?.months)
  if (!isNaN(m) && m > 0) return m
  return isTerms.value ? 12 : 0
})

const balance = computed(() => Math.max(price.value - (isTerms.value ? ptDown.value : 0) - tradeInSum.value, 0))
const monthly = computed(() => (isTerms.value && months.value > 0) ? balance.value / months.value : 0)

const machineTitle = computed(() => {
  if (props.quoteState?.selectedModel) return props.quoteState.selectedModel
  if (props.quoteState?.selectedBrand) return props.quoteState.selectedBrand
  if (props.quoteState?.model) return props.quoteState.model
  if (props.quoteState?.brand) return props.quoteState.brand
  if (props.quoteState?.quote_title) return props.quoteState.quote_title
  return ''
})
const machineCondition = computed(() => {
  return props.quoteState?.unitCondition ?? props.quoteState?.unit_condition ?? props.quoteState?.unit_condition_override ?? ''
})
const machineLabel = computed(() => {
  const t = machineTitle.value
  const c = machineCondition.value
  return t ? t + (c ? ` (${c})` : '') : ''
})

const hasPrinthead = computed(() => {
  if (props.quoteState?.has_printhead !== undefined && props.quoteState?.has_printhead !== null) {
    return !!props.quoteState.has_printhead
  }
  if (props.quoteState?.hasPrinthead !== undefined && props.quoteState?.hasPrinthead !== null) {
    return !!props.quoteState.hasPrinthead
  }
  const cat = (props.quoteState?.selectedCategory || props.quoteState?.selectedBrand || props.quoteState?.brand || '').toLowerCase()
  const title = (machineTitle.value || '').toLowerCase()
  const printerKeywords = ['eco solvent', 'solvent', 'sublimation', 'dtf', 'dtg', 'uv', 'large format', 'printer', 'inkjet', 'printhead']
  return printerKeywords.some(k => cat.includes(k) || title.includes(k))
})

// Prompt Details merged with defaults
const prompt = computed(() => props.promptDetails || {})

const clientNameVal = computed(() => props.quoteState?.client_name ?? props.quoteState?.clientName ?? '')
const clientName = computed(() => clientNameVal.value)
const clientConformeVal = computed(() => props.quoteState?.client_conforme ?? props.quoteState?.clientConforme ?? '')
const addressVal = computed(() => props.quoteState?.address || '')
const contactVal = computed(() => props.quoteState?.contact || '')
const aeNameVal = computed(() => props.quoteState?.ae_name ?? props.quoteState?.aeName ?? '')

const buyerName = computed(() => prompt.value.buyerName || clientConformeVal.value || clientNameVal.value || '')
const sigPosition = computed(() => prompt.value.sigPosition || 'OWNER')
const company = computed(() => props.quoteState?.company || '')
const regAddress = computed(() => prompt.value.regAddress || addressVal.value || '')
const deliveryAddress = computed(() => prompt.value.deliveryAddress || addressVal.value || '')
const machineOrigin = computed(() => prompt.value.machineOrigin || '')
const accountExec = computed(() => prompt.value.accountExec || aeNameVal.value || '')
const soNumber = computed(() => prompt.value.soNumber || '')
const freight = computed(() => prompt.value.freight || '')
const contactPerson = computed(() => prompt.value.contactPerson || clientNameVal.value || '')
const contactNumber = computed(() => prompt.value.contactNumber || contactVal.value || '')
const deliveryDate = computed(() => prompt.value.deliveryDate || '')
const installDate = computed(() => prompt.value.installDate || '')
const additionalItems = computed<string[]>(() => prompt.value.additionalItems || [])

const dpDate = computed(() => prompt.value.dpDate || '')
const pdcCollect = computed(() => prompt.value.pdcCollect || (isTerms.value ? 'UPON DELIVERY' : 'NONE'))
const otherInstr = computed(() => prompt.value.otherInstr || 'NONE')
const docsWho = computed(() => prompt.value.docsWho || 'Technician who will install machine')

const tradeBrandModel = computed(() => prompt.value.tradeBrandModel || tiDesc.value)
const pulloutInstr = computed(() => prompt.value.pulloutInstr || '')
const pulloutAddr = computed(() => prompt.value.pulloutAddr || deliveryAddress.value)

const custRep = computed(() => prompt.value.custRep || contactPerson.value)
const serialNumber = computed(() => prompt.value.serialNumber || '')
const firstPdcDate = computed(() => prompt.value.firstPdcDate || '')

// Compute PDC rows
const pdcRows = computed(() => {
  const rows: { no: string; date: string; amount: string; notes: string }[] = []
  
  // Downpayment row
  const dpD = dpDate.value ? formatDate(dpDate.value) : ''
  rows.push({
    no: 'DOWNPAYMENT',
    date: dpD,
    amount: fmtN(ptDown.value),
    notes: ''
  })

  // Monthly amortizations
  for (let i = 1; i <= months.value; i++) {
    let dtStr = ''
    if (firstPdcDate.value) {
      const base = new Date(firstPdcDate.value + 'T00:00:00')
      base.setMonth(base.getMonth() + (i - 1))
      dtStr = formatDate(base.toISOString().slice(0, 10))
    }
    rows.push({
      no: String(i),
      date: dtStr,
      amount: fmtN(monthly.value),
      notes: ''
    })
  }

  return rows
})
</script>

<template>
  <div id="tc-paper" class="closing-doc-paper">
    <!-- Header Letterhead -->
    <div class="tc-lh">
      <img :src="letterheadHeaderSrc" alt="Header Letterhead" />
    </div>

    <!-- 1. TERMS AND CONDITIONS -->
    <div v-if="activeDoc === 'tc'" class="tc-body">
      <div class="tc-title">TERMS AND CONDITIONS</div>
      <p>WHEREAS, the SELLER offered to sell to the BUYER a/an {{ (machineLabel || 'EQUIPMENT').toUpperCase() }};</p>
      <p>WHEREAS, the BUYER has accepted the offer of the SELLER.</p>
      <p>NOW THEREFORE, for and in consideration of the total sum of {{ priceWords }} (Php{{ priceFig }}) Philippine Currency, and of the covenants herein after set forth the SELLER agrees to sell and the BUYER agrees to buy the aforesaid product subject to the following terms and conditions:</p>

      <ol class="tc-clauses">
        <li>That this agreement shall be treated as a General Supply Agreement where SELLER agrees and covenants to supply the BUYER all the supplies/services required by the subject unit, as BUYER may order, and such parts and/or services that it may require subsequent to the delivery and beyond the warranty period.</li>
        
        <li v-if="isTerms">
          That BUYER commits itself to pay SELLER the sum of {{ priceWords }} (Php{{ priceFig }}) payable in the following terms:
          <table class="tc-terms">
            <tr><td>CONTRACT PRICE</td><td>PHP {{ fmtN(price) }}</td></tr>
            <tr v-if="isTI"><td>TRADE-IN VALUE</td><td>PHP {{ fmtN(tradeInSum) }}</td></tr>
            <tr><td>DOWNPAYMENT</td><td>PHP {{ fmtN(ptDown) }}</td></tr>
            <tr><td>BALANCE</td><td>PHP {{ fmtN(balance) }}</td></tr>
            <tr><td>TERMS</td><td>{{ months }} months</td></tr>
            <tr><td>MONTHLY AMORTIZATION</td><td>PHP {{ fmtN(monthly) }}</td></tr>
          </table>
        </li>
        <li v-else-if="isTI">
          That BUYER commits itself to pay SELLER in CASH the net amount computed as follows:
          <table class="tc-terms">
            <tr><td>CONTRACT PRICE</td><td>PHP {{ fmtN(price) }}</td></tr>
            <tr><td>TRADE-IN VALUE</td><td>PHP {{ fmtN(tradeInSum) }}</td></tr>
            <tr><td>NET AMOUNT</td><td>PHP {{ fmtN(balance) }}</td></tr>
          </table>
        </li>
        <li v-else>
          That BUYER commits itself to pay SELLER the sum of {{ priceWords }} (Php{{ priceFig }}) payable in CASH;
        </li>

        <li v-if="isTerms">
          That should Buyer fail to make one (1) monthly payment for any reason whatsoever when the monthly payment respectively falls due, the Seller shall give a written notice, to the Buyer of said fact and shall give Buyer a grace period of five (5) working days to settle the outstanding monthly payment in cash. Should the Buyer fail to pay within this five (5) day period, the Buyer grants the Seller the option to demand full payment of the outstanding balance and/or to pull out the machine upon giving notice 48-hours prior thereto.
        </li>

        <li v-if="isTI && tradeBrandModel">
          That the trade-in machine is a {{ tradeBrandModel }}, and that the buyer warrants this machine and its parts are free from any liens and encumbrances whatsoever and that the buyer has a good, valid and full right, ownership and interest on the said machine.
        </li>

        <li>The BUYER’s failure to abide by the payment terms for the machine, consumables and other items set forth shall give Seller the right to charge interest of one and a half percent (1.5%) per month and/or penalties amounting to one percent (1%) per month on the outstanding balance. Returned checks will be deposited after five (5) working days.</li>
        <li>That BUYER allows the Seller to conduct regular and random inspection of the subject {{ hasPrinthead ? 'printer' : 'equipment' }}, provided that Seller would inform BUYER of the desired inspection one (1) day prior the date of inspection requested.</li>
        <li>{{ coSub(hasPrinthead ? 'That BUYER acknowledges that the use of inks, cleaning solution and spare parts other than those supplied by the ES Print Media Inc. will void equipment’s warranty.' : 'That BUYER acknowledges that the use of spare parts other than those supplied by the ES Print Media Inc. will void equipment’s warranty.') }}</li>
        <li>That the Buyer agrees not to transfer, relocate, move the equipment without the supervision of {{ coName }} trained Engineers. Damage(s) caused by improper handling will not be covered by warranty.</li>
        <li>The BUYER is expected to exercise diligence of a good father of a family in maintaining and keeping the subject machine away from damage or disaster, such as ensuring that the elected installation site is flood and water-free.</li>
        <li>Seller shall have the right to withhold warranty coverage service to the BUYER should the latter refuse to sign the Customer Acceptance Certificate or to delay the signing of the said certificate for any unjustifiable reason.</li>
        <li>BUYER agrees that the Seller may unilaterally deem the warranty coverage terminated, even prior to its expiration, should the BUYER fail to pay in full to the Seller. Thus, the parts and service warranty shall no longer be honored by the Seller even after the BUYER updates its account with the Seller.</li>
        <li>The parties promise to faithfully comply with the terms and conditions stated in the CAC and Limited Warranty Certificate.</li>
        <li>BUYER shall not at all times directly or indirectly solicit, induce, recruit, encourage or otherwise endeavor to cause or attempt to cause any employee or consultant of the Seller to terminate their relationship with Seller.</li>
        <li>
          In no event shall {{ coName }} be liable to the BUYER for any of the following:
          <ol type="a" class="tc-sub">
            <li>Any indirect, incidental, consequential, special or exemplary costs, claims, expenses, loss or damages, including those arising out of, or in connection with, the manufacture, delivery and/or installation of the products supplied</li>
            <li>Downtime cost, lost revenues, profits, business opportunities, anticipated savings or goodwill.</li>
            <li>Loss or damages or expenses arising from, or in connection with, any loss of data or interruption in use, or availability, of data; and/or.</li>
            <li>Loss or damage suffered by the BUYER as a result of, or in connection with, any claims brought against the BUYER by any third party which arise out of or in connection with the Products supplied by {{ coName }}.</li>
          </ol>
        </li>
        <li>In case there be a scope change or anything that results in a scope change, the Seller shall have the right to adjust its pricing or fee estimates reflecting such changes, by securing the prior written approval of the Buyer.</li>
        <li>It is an essential consideration of this Agreement that all matters pertaining to the supply by {{ coName }} to the BUYER shall be held in the strictest confidence.</li>
        <li>If any provision of this Terms and Conditions is held by a court of law to be illegal, invalid or unenforceable, (i) that provision shall be deemed amended to achieve as nearly as possible the same economic effect as the original provision, and (ii) the legality, validity and enforceability of the remaining provisions of this Agreement shall not be affected or impaired thereby.</li>
        <li>This Terms and Condition shall be governed by the laws of the Philippines and the parties mutually agree that any and all suits arising out of this Agreement shall be filed in the proper courts of Makati City, Philippines.</li>
      </ol>

      <div class="tc-sig">
        Signature:<br>
        Name: <span class="ln">{{ buyerName }}</span><br>
        Company: <span class="ln">{{ company }}</span><br>
        Position: <span class="ln">{{ sigPosition }}</span><br>
        Date: <span class="ln"></span>
      </div>
    </div>

    <!-- 2. DELIVERY INSTRUCTIONS -->
    <div v-else-if="activeDoc === 'di'" class="tc-body">
      <div class="tc-title">DELIVERY INSTRUCTIONS</div>
      <table class="doc-form">
        <tr><td class="dl">MACHINE ORIGIN</td><td class="dv">{{ machineOrigin }}</td></tr>
        <tr><td class="dl">MACHINE MODEL</td><td class="dv">{{ machineLabel }}</td></tr>
        <tr><td class="dl">ACCOUNT EXECUTIVE</td><td class="dv">{{ accountExec }}</td></tr>
        <tr><td class="dl">SO NUMBER</td><td class="dv">{{ soNumber }}</td></tr>
        <tr><td class="dl">COMPANY NAME</td><td class="dv">{{ company }}</td></tr>
        <tr><td class="dl">COMPANY ADDRESS</td><td class="dv">{{ regAddress }}</td></tr>
        <tr><td colspan="2" class="dsec">DELIVERY INSTRUCTIONS</td></tr>
        <tr><td class="dl">REGISTERED ADDRESS</td><td class="dv">{{ regAddress }}</td></tr>
        <tr><td class="dl">DELIVERY ADDRESS</td><td class="dv">{{ deliveryAddress }}</td></tr>
        <tr><td class="dl">FREIGHT ARRANGEMENT</td><td class="dv">{{ freight }}</td></tr>
        <tr><td class="dl">CONTACT PERSON</td><td class="dv">{{ contactPerson }}</td></tr>
        <tr><td class="dl">CONTACT NUMBER</td><td class="dv">{{ contactNumber }}</td></tr>
        <tr><td class="dl">DELIVERY DATE</td><td class="dv">{{ formatDate(deliveryDate) }}</td></tr>
        <tr><td class="dl">INSTALLATION DATE</td><td class="dv">{{ formatDate(installDate) }}</td></tr>
        <tr><td class="dl">VAT IN / VAT EX ?</td><td class="dv">{{ props.quoteState?.vatInclusive ? 'VAT IN' : 'VAT EX' }}</td></tr>
        
        <tr v-if="additionalItems.length">
          <td class="dl">ADDITIONAL DELIVERY ITEMS</td>
          <td class="dv">
            <div v-for="(item, idx) in additionalItems" :key="idx">{{ idx + 1 }}. {{ item }}</div>
          </td>
        </tr>
        <tr v-else>
          <td class="dl">ADDITIONAL DELIVERY ITEMS</td>
          <td class="dv">NONE</td>
        </tr>

        <template v-if="isTI">
          <tr><td colspan="2" class="dsec">TRADE-IN PULLOUT</td></tr>
          <tr><td class="dl">BRAND AND MODEL OF TRADE-IN MACHINE</td><td class="dv">{{ tradeBrandModel }}</td></tr>
          <tr><td class="dl">PULLOUT INSTRUCTIONS FOR TRADE-IN UNIT</td><td class="dv">{{ pulloutInstr }}</td></tr>
          <tr><td class="dl">PULLOUT ADDRESS</td><td class="dv">{{ pulloutAddr }}</td></tr>
        </template>

        <tr><td colspan="2" class="dsec">COLLECTION INSTRUCTIONS</td></tr>
        <tr><td class="dl">DATE OF DP</td><td class="dv">{{ dpDate ? formatDate(dpDate) : 'TO FOLLOW' }}</td></tr>
        <tr><td class="dl">WHEN TO COLLECT PDCs</td><td class="dv">{{ pdcCollect }}</td></tr>
        <tr><td class="dl">OTHERS</td><td class="dv">{{ otherInstr }}</td></tr>
        <tr><td colspan="2" class="dsec">DOCUMENTATION INSTRUCTIONS</td></tr>
        <tr><td class="dl">WHO WILL GET DOCS ?</td><td class="dv">{{ docsWho }}</td></tr>
      </table>
    </div>

    <!-- 3. WARRANTY CERTIFICATE -->
    <div v-else-if="activeDoc === 'wc'" class="tc-body">
      <div class="tc-title">LIMITED WARRANTY CERTIFICATE</div>
      <p>Preliminarily, the following are NOT covered by the warranty:</p>
      <ol type="a" class="tc-sub">
        <li>Routine cleaning, or normal cosmetic and mechanical wear</li>
        <li>Damage from misuse, abuse or neglect</li>
        <li>Damage from use outside the machine’s usage parameters</li>
        <li>Damage from use of parts and supplies not supplied by {{ coName }}.</li>
        <li>Damage from modification or incorporation into other machines/products</li>
        <li>Damage resulting from Acts of God, war, earthquakes, fire, floods, typhoons, and the like.</li>
      </ol>
      <p>{{ coName }} warrants that the machine purchased is free from defects in materials or workmanship under normal use during the warranty period.</p>
      <p>The warranty period commences on the date of signed Customer Acceptance Certificate and will end as indicated in {{ coName }}’s Quotation.</p>
      <p>The warranty extends only to <b>{{ company || clientName || '____________' }}</b> for the <b>{{ machineTitle }}</b> and is non-transferable.</p>
      <p>Service will be provided by {{ coName }} during warranty period and after warranty period through mobile support to address/solve any issue before dispatching service engineer for repair. Only authorized Technical Support from {{ coName }} are allowed to service the machine.</p>
      <p>For your information and guidance.</p>

      <div class="tc-sig" style="margin-top:14mm">
        <b>EDWARD V. SO KUA</b><br>
        {{ coName }}<br><br><br>
        Acknowledged by: <span class="ln"></span><br>
        <span style="font-size:8pt">Signature over Printed Name</span><br>
        Date: <span class="ln"></span>
      </div>
    </div>

    <!-- 4. CUSTOMER ACCEPTANCE CERTIFICATE (CAC) -->
    <div v-else-if="activeDoc === 'cac'" class="tc-body">
      <div class="tc-title">CUSTOMER ACCEPTANCE CERTIFICATE<br>AND LIMITED WARRANTY CERTIFICATE</div>
      <table class="doc-form">
        <tr><td class="dl">CUSTOMER NAME</td><td class="dv">{{ company || clientName }}</td></tr>
        <tr><td class="dl">REGISTERED ADDRESS</td><td class="dv">{{ regAddress }}</td></tr>
        <tr><td class="dl">DELIVERY ADDRESS</td><td class="dv">{{ deliveryAddress }}</td></tr>
        <tr><td class="dl">CUSTOMER REPRESENTATIVE</td><td class="dv">{{ custRep }}</td></tr>
      </table>

      <p>This Acceptance is based on the successful completion of the {{ coName.toUpperCase() }} Product Installation.</p>
      <p>By signing below, the undersigned hereby agrees to the acceptance of the following machine in good condition and that the installed product performance meets {{ coName }} specifications.</p>

      <table class="doc-form">
        <tr><td class="dl">MAKE</td><td class="dv">{{ props.quoteState?.selectedBrand || 'Aeon LASER' }}</td></tr>
        <tr><td class="dl">MODEL</td><td class="dv">{{ machineLabel }}</td></tr>
        <tr><td class="dl">SERIAL NUMBER</td><td class="dv">{{ serialNumber }}</td></tr>
      </table>

      <p>The undersigned hereby agrees to the start of the warranty period, and to pay the balance of the payment terms (if any) indicated in the Payment Terms section of {{ coName.toUpperCase() }}’s Quotation and/or Terms and Conditions and that all contractual terms commence or remain in full affect.</p>
      <p>The undersigned also agrees that the following are NOT COVERED BY WARRANTY:</p>

      <template v-if="hasPrinthead">
        <ul class="tc-sub">
          <li>Routine cleaning, normal cosmetic and mechanical wear.</li>
          <li>Clogged printhead or damaged print head caused by:
            <ul>
              <li>Poor maintenance, dirty printhead nozzles or surroundings.</li>
              <li>Head-strike, scratches on the printhead nozzles, damage to printhead assembly.</li>
              <li>Long-storage, dried inks on the ink lines.</li>
              <li>Power surge / power fluctuations.</li>
              <li>Poor working environment (not meeting temperature requirements).</li>
              <li>Use / activation of longer cleaning / little charge option in de-clogging print nozzles.</li>
            </ul>
          </li>
          <li>Damage caused by improper handling and non-compliance on environment requirements.</li>
          <li>Damage from misuse, abuse, neglect and use outside the machine’s usage parameters.</li>
          <li>Damage from use of parts, supplies and service other than those supplied by {{ coName }}.</li>
          <li>Damage from modification or incorporation into other machine / products.</li>
          <li>Damage resulting from fire, flood, act of nature, or any other cause beyond control of {{ coName }}.</li>
          <li>Incorrect voltage / current of mains supply, or physical, environmental or electrical stress which is unusual or not recommended.</li>
          <li>Work station, heat press (15” x 15”), automatic voltage regulator (if any).</li>
          <li>Software problem including viruses.</li>
          <li>Damage caused by vermin / insects.</li>
        </ul>
        <p>To achieve optimal color output and accuracy, Color Management Services will only be provided when using:</p>
        <ul style="list-style:none;padding-left:6mm">
          <li>✔ {{ coName }}-supplied Printers</li>
          <li>✔ {{ coName }}-supplied Inks</li>
          <li>✔ {{ coName }}-supplied Sublimation Paper / Solvent Media</li>
        </ul>
        <p>{{ coName }} does not guarantee optimal results when using sublimation paper / solvent media from other suppliers due to variations in ink transfer rates and material composition; therefore {{ coName }} will not conduct Color Management Services.</p>
        <p>Once Color Management has been completed, the client may choose to use sublimation / solvent media of their choice. {{ coName }} will no longer be responsible for any variations / changes in the color output or print quality.</p>
      </template>
      <template v-else>
        <ol type="a" class="tc-sub">
          <li>Routine cleaning, normal cosmetic and mechanical wear.</li>
          <li>Damages caused by improper handling and non-compliance on environment requirements.</li>
          <li>Damage from misuse, abuse and neglect.</li>
          <li>Damage from use outside the machine’s usage parameters.</li>
          <li>Damage from use of parts, supplies and service other than those supplied by {{ coName }}.</li>
          <li>Damage from modification or incorporation into other machine / products.</li>
          <li>Damage resulting from fire, flood, act of God, or any other cause beyond the control of {{ coName }}.</li>
          <li>Incorrect voltage/current of mains supply, or physical, environmental or electrical stress which is unusual or not recommended.</li>
          <li>Warranty shall be rendered null and void if the Product is damaged by vermin / insects.</li>
        </ol>
      </template>

      <div class="tc-sig3">
        <div><span class="ln"></span><br>CUSTOMER SIGNATURE OVER PRINTED NAME<br>Date: __________</div>
        <div><span class="ln"></span><br>FIELD SERVICE ENGINEER SIGNATURE OVER PRINTED NAME<br>Date: __________</div>
        <div><span class="ln"></span><br>WITNESS SIGNATURE OVER PRINTED NAME<br>Date: __________</div>
      </div>
    </div>

    <!-- 5. PDC SCHEDULE -->
    <div v-else-if="activeDoc === 'pdc'" class="tc-body">
      <div class="tc-title">PAYMENT SCHEDULE</div>
      <div v-if="!isTerms" style="padding: 30mm 10mm; text-align: center; color: #c0392b; font-size: 11pt">
        PDC Schedule applies to installment deals only. Set the Deal Type to an installment option in the Quote Generator.
      </div>
      <template v-else>
        <p style="text-align:center;margin:0 0 1mm">Machine: <b>{{ machineLabel }}</b></p>
        <p style="text-align:center">Please make checks payable to: <b>{{ coName.toUpperCase() }}</b></p>

        <table class="pdc-tbl">
          <thead>
            <tr><th>NO.</th><th>DATE</th><th>AMOUNT</th><th>NOTES</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in pdcRows" :key="idx">
              <td>{{ r.no }}</td>
              <td>{{ r.date }}</td>
              <td class="amt">{{ r.amount }}</td>
              <td>{{ r.notes }}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size:8.5pt;color:#555;margin-top:4mm">
          Contract Price: PHP {{ fmtN(price) }} &nbsp;•&nbsp; Downpayment: PHP {{ fmtN(ptDown) }} &nbsp;•&nbsp; Balance: PHP {{ fmtN(balance) }} &nbsp;•&nbsp; Terms: {{ months }} months
        </p>
      </template>
    </div>

    <!-- 6. TRADE-IN PULLOUT FORM -->
    <div v-else-if="activeDoc === 'pull'" class="tc-body">
      <div class="tc-title">TRADE-IN MACHINE PULL OUT FORM</div>
      <div v-if="!isTI" style="padding: 30mm 10mm; text-align: center; color: #c0392b; font-size: 11pt">
        Trade-in Pullout Form applies to trade-in deals only. Set the Deal Type to a Trade-In option in the Quote Generator.
      </div>
      <template v-else>
        <p>DATE: <span class="ln"></span></p>
        <p>PULLOUT ADDRESS: <b>{{ pulloutAddr }}</b></p>
        <p>The following machine and its parts are voluntarily surrendered by <b>{{ company || clientName || '____________' }}</b> to {{ coName }}:</p>

        <table class="doc-form">
          <thead>
            <tr><th>QUANTITY</th><th>DESCRIPTION</th><th>SERIAL NUMBER</th></tr>
          </thead>
          <tbody>
            <tr v-for="(u, idx) in (validTradeIns.length ? validTradeIns : (tiDesc ? [{ description: tiDesc }] : []))" :key="idx">
              <td style="text-align:center">1</td>
              <td>{{ u.description || u.desc || tiDesc }}</td>
              <td></td>
            </tr>
            <tr v-for="b in (10 - Math.min(10, validTradeIns.length || (tiDesc ? 1 : 0)))" :key="'blank-' + b">
              <td style="height:7mm"></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <p>This also serves as a certification that the above machine and its parts are free from any liens and encumbrances whatsoever and that the client has a good, valid and full right, ownership and interest on the said machine.</p>

        <div class="tc-sig3" style="margin-top:12mm">
          <div>Prepared by:<br><br><span class="ln"></span><br>Signature over Printed Name</div>
          <div>Acknowledged and Confirmed by:<br><br><span class="ln"></span><br>Signature over Printed Name</div>
          <div>Witnessed by:<br><br><span class="ln"></span><br>Signature over Printed Name</div>
        </div>
      </template>
    </div>

    <!-- Footer Letterhead -->
    <div class="tc-ft">
      <img :src="letterheadFooterSrc" alt="Footer Letterhead" />
    </div>
  </div>
</template>

<style scoped>
.closing-doc-paper {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  margin: 0 auto;
  padding: 0;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
  color: #000;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tc-lh {
  width: 100%;
  margin-bottom: 4mm;
}

.tc-lh img {
  width: 100%;
  height: auto;
  display: block;
}

.tc-ft {
  width: 100%;
  margin-top: auto;
  padding-top: 6mm;
}

.tc-ft img {
  width: 100%;
  height: auto;
  display: block;
}

.tc-body {
  padding: 0 16mm;
}

.tc-title {
  text-align: center;
  font-size: 13pt;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 2mm 0 4mm;
  text-decoration: underline;
  color: #000;
}

.tc-body p {
  font-size: 9.5pt;
  line-height: 1.5;
  margin-bottom: 2.5mm;
  text-align: justify;
  color: #000;
}

.tc-clauses {
  font-size: 9.5pt;
  line-height: 1.5;
  padding-left: 8mm;
  margin: 0;
  color: #000;
}

.tc-clauses > li {
  margin-bottom: 2.5mm;
  text-align: justify;
  padding-left: 2mm;
}

.tc-sub {
  margin: 1.5mm 0 0 2mm;
  padding-left: 6mm;
}

.tc-sub li {
  margin-bottom: 1mm;
  text-align: justify;
}

.tc-terms {
  margin: 2mm 0 2mm 6mm;
  border-collapse: collapse;
  font-size: 9pt;
  width: 100%;
  max-width: 400px;
}

.tc-terms td {
  padding: 2px 14px 2px 0;
}

.tc-terms td:last-child {
  text-align: right;
  font-weight: 600;
}

.tc-sig {
  margin-top: 12mm;
  font-size: 9.5pt;
  line-height: 2.3;
  color: #000;
}

.tc-sig .ln {
  display: inline-block;
  min-width: 72mm;
  border-bottom: 1px solid #000;
  margin-left: 4px;
}

table.doc-form {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
  margin: 2mm 0 3mm;
}

table.doc-form td,
table.doc-form th {
  border: 1px solid #333;
  padding: 2mm 3mm;
  vertical-align: top;
  text-align: left;
  color: #000;
}

table.doc-form td.dl {
  width: 42mm;
  font-weight: 700;
  background: #f6f6f6;
}

table.doc-form td.dsec {
  background: #c0392b;
  color: #fff;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
}

table.doc-form th {
  background: #f0f0f0;
  font-weight: 700;
  text-align: center;
}

table.pdc-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin: 3mm 0;
}

table.pdc-tbl th {
  background: #c0392b;
  color: #fff;
  padding: 2mm;
  border: 1px solid #333;
}

table.pdc-tbl td {
  border: 1px solid #333;
  padding: 1.6mm 3mm;
  color: #000;
}

table.pdc-tbl td.amt {
  text-align: right;
}

.tc-sub ul {
  list-style: disc;
  margin: 1mm 0 1mm 6mm;
}

.tc-sig3 {
  display: flex;
  gap: 8mm;
  margin-top: 10mm;
  font-size: 8.5pt;
  color: #000;
}

.tc-sig3 > div {
  flex: 1;
  line-height: 1.5;
}

.tc-sig3 .ln {
  display: block;
  border-bottom: 1px solid #000;
  min-height: 9mm;
  margin-bottom: 1mm;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .closing-doc-paper {
    width: 210mm !important;
    height: 297mm !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 auto !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
    page-break-after: avoid !important;
  }

  .tc-lh img,
  .tc-ft img {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  table.doc-form td.dsec,
  table.pdc-tbl th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
