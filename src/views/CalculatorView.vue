<script setup lang="ts">
import { ref, computed } from 'vue'

// ─── Tab state ──────────────────────────────────────────────────────────────────
type CalcTab = 'financial' | 'dost'
const activeCalcTab = ref<CalcTab>('financial')

// ─── Financial Calculator ───────────────────────────────────────────────────────

// Input states
const basePrice = ref<number>(1000000)
const downpayment = ref<number>(200000)
const annualInterestRate = ref<number>(12)
const termsMonths = ref<number>(12)

// Copy feedback state
const copied = ref(false)

// Presets
const dpPercentPresets = [0, 10, 20, 30, 50]
const ratePresets = [7, 10, 12, 14, 21, 28]
const termsPresets = [3, 6, 12, 18, 24]

// Downpayment percentage of base price
const currentDpPercent = computed(() => {
  if (!basePrice.value || basePrice.value <= 0) return 0
  return Math.round((downpayment.value / basePrice.value) * 100)
})

function applyDpPercent(percent: number) {
  if (!basePrice.value) return
  downpayment.value = Math.round((basePrice.value * percent) / 100)
}

// Calculations matching the user's Excel formula:
// Principal Financed = Base Price - Downpayment
// Total Interest = (Base Price - Downpayment) * (Annual Interest Rate / 100 / 12) * Terms
// Contract Price = Downpayment + Principal Financed + Total Interest = Base Price + Total Interest
// Balance = Contract Price - Downpayment = Principal Financed + Total Interest
// Monthly Amortization = Balance / Terms

const principalFinanced = computed(() => {
  const bp = Number(basePrice.value) || 0
  const dp = Number(downpayment.value) || 0
  return Math.max(0, bp - dp)
})

const totalInterest = computed(() => {
  const ratePerMonth = (Number(annualInterestRate.value) || 0) / 100 / 12
  const terms = Number(termsMonths.value) || 0
  return principalFinanced.value * ratePerMonth * terms
})

const contractPrice = computed(() => {
  const dp = Number(downpayment.value) || 0
  return dp + principalFinanced.value + totalInterest.value
})

const balance = computed(() => {
  const dp = Number(downpayment.value) || 0
  return Math.max(0, contractPrice.value - dp)
})

const monthlyAmortization = computed(() => {
  const terms = Number(termsMonths.value) || 1
  if (terms <= 0) return 0
  return balance.value / terms
})

// Number formatting helpers
function fmtCurrency(val: number): string {
  const n = Number(val) || 0
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── DOST Calculator ────────────────────────────────────────────────────────

interface DostRow {
  machine: string
  dostVatIn: number
}

const dostRows = ref<DostRow[]>([
  { machine: '', dostVatIn: 0 },
])

const VAT_RATE = 0.12

function addDostRow() {
  if (dostRows.value.length >= 10) return
  dostRows.value.push({ machine: '', dostVatIn: 0 })
}

function removeDostRow(idx: number) {
  if (dostRows.value.length <= 1) return
  dostRows.value.splice(idx, 1)
}

// Per-row computations
function dostVat(row: DostRow): number {
  return row.dostVatIn - (row.dostVatIn / (1 + VAT_RATE))
}

function dostVatEx(row: DostRow): number {
  return row.dostVatIn / (1 + VAT_RATE)
}

// ESPMI price per row (user-editable)
const espmiPrices = ref<number[]>([0])

function ensureEspmiPrices() {
  while (espmiPrices.value.length < dostRows.value.length) {
    espmiPrices.value.push(0)
  }
}

function dostOp(idx: number): number {
  ensureEspmiPrices()
  return dostVatEx(dostRows.value[idx]) - (espmiPrices.value[idx] || 0)
}

// Totals
const dostTotalVatIn = computed(() => dostRows.value.reduce((sum, r) => sum + (r.dostVatIn || 0), 0))
const dostTotalVat = computed(() => dostRows.value.reduce((sum, r) => sum + dostVat(r), 0))
const dostTotalEspmi = computed(() => {
  ensureEspmiPrices()
  return espmiPrices.value.reduce((sum, p) => sum + (p || 0), 0)
})
const dostTotalOp = computed(() => {
  return dostRows.value.reduce((sum, _, idx) => sum + dostOp(idx), 0)
})
const dostTotalForEspmi = computed(() => dostTotalVat.value + dostTotalEspmi.value)
const dostTotalFromClient = computed(() => dostTotalVatIn.value)

// Copy DOST summary
async function copyDostSummary() {
  const lines = dostRows.value.map((r, i) => {
    ensureEspmiPrices()
    return `${r.machine || 'Machine ' + (i+1)}: DOST ₱${fmtCurrency(r.dostVatIn).slice(1)} | ESPMI ₱${fmtCurrency(espmiPrices.value[i] || 0).slice(1)} | OP ₱${fmtCurrency(dostOp(i)).slice(1)}`
  }).join('\n')

  const text = `=== DOST CALCULATOR SUMMARY ===
${lines}

TOTAL OVERPRICE FOR CLIENT:        ${fmtCurrency(dostTotalOp.value)}
TOTAL AMOUNT FOR ESPMI (VAT+COST): ${fmtCurrency(dostTotalForEspmi.value)}
TOTAL FROM CLIENT:                  ${fmtCurrency(dostTotalFromClient.value)}`

  try {
    await navigator.clipboard.writeText(text)
    dostCopied.value = true
    setTimeout(() => { dostCopied.value = false }, 2500)
  } catch {
    alert(text)
  }
}

const dostCopied = ref(false)

// Copy text summary to clipboard
async function copySummary() {
  const text = `
=== ESPMI FINANCIAL CALCULATOR SUMMARY ===
BASE PRICE:             ${fmtCurrency(basePrice.value)}
DOWNPAYMENT:            ${fmtCurrency(downpayment.value)} (${currentDpPercent.value}%)
ANNUAL INTEREST RATE:   ${annualInterestRate.value}%
TERMS (IN MONTHS):      ${termsMonths.value} months

------------------------------------------
CONTRACT PRICE:         ${fmtCurrency(contractPrice.value)}
DOWNPAYMENT:            ${fmtCurrency(downpayment.value)}
BALANCE:                ${fmtCurrency(balance.value)}
TERMS:                  ${termsMonths.value} months
MONTHLY AMORTIZATION:   ${fmtCurrency(monthlyAmortization.value)} / month
------------------------------------------
Principal Financed:     ${fmtCurrency(principalFinanced.value)}
Total Interest Charges: ${fmtCurrency(totalInterest.value)}
`.trim()

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch (e) {
    // Fallback if clipboard API fails
    alert('Summary:\n\n' + text)
  }
}
</script>

<template>
  <div class="calculator-page">
    <!-- Tab Toggle -->
    <div class="calc-tab-bar">
      <button :class="['calc-tab-btn', activeCalcTab === 'financial' && 'calc-tab-btn--active']" @click="activeCalcTab = 'financial'">
        Financial Calculator
      </button>
      <button :class="['calc-tab-btn', activeCalcTab === 'dost' && 'calc-tab-btn--active']" @click="activeCalcTab = 'dost'">
        DOST Calculator
      </button>
    </div>

    <!-- ═══ FINANCIAL CALCULATOR ═══ -->
    <div v-if="activeCalcTab === 'financial'">
    <div class="calc-header">
      <h1>Financial Installment Calculator</h1>
      <p class="calc-subtitle">Compute Contract Price, Balance, and Monthly Amortizations instantly.</p>
    </div>

    <div class="calc-grid">
      <!-- INPUTS CARD -->
      <div class="calc-card inputs-card">
        <h2 class="card-title">
          <span class="title-icon">⚙️</span> Calculation Inputs
        </h2>

        <!-- Base Price -->
        <div class="form-group">
          <label for="base-price">Base Price (₱)</label>
          <div class="input-wrap">
            <span class="currency-prefix">₱</span>
            <input
              id="base-price"
              v-model.number="basePrice"
              type="number"
              min="0"
              step="1000"
              class="calc-input"
              placeholder="e.g. 1,000,000"
            />
          </div>
        </div>

        <!-- Downpayment -->
        <div class="form-group">
          <div class="label-row">
            <label for="downpayment">Downpayment (₱)</label>
            <span class="badge-info">{{ currentDpPercent }}% of Base Price</span>
          </div>
          <div class="input-wrap">
            <span class="currency-prefix">₱</span>
            <input
              id="downpayment"
              v-model.number="downpayment"
              type="number"
              min="0"
              step="1000"
              class="calc-input"
              placeholder="e.g. 200,000"
            />
          </div>
          <div class="preset-pills">
            <span class="preset-label">Quick %:</span>
            <button
              v-for="p in dpPercentPresets"
              :key="p"
              type="button"
              class="pill-btn"
              :class="{ active: currentDpPercent === p }"
              @click="applyDpPercent(p)"
            >
              {{ p }}%
            </button>
          </div>
        </div>

        <!-- Annual Interest Rate -->
        <div class="form-group">
          <label for="interest-rate">Annual Interest Rate (%)</label>
          <div class="input-wrap">
            <input
              id="interest-rate"
              v-model.number="annualInterestRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              class="calc-input suffix-input"
              placeholder="e.g. 12"
            />
            <span class="currency-suffix">% / yr</span>
          </div>
          <div class="preset-pills">
            <span class="preset-label">Quick Rate:</span>
            <button
              v-for="r in ratePresets"
              :key="r"
              type="button"
              class="pill-btn"
              :class="{ active: annualInterestRate === r }"
              @click="annualInterestRate = r"
            >
              {{ r }}%
            </button>
          </div>
        </div>

        <!-- Terms (in Months) -->
        <div class="form-group">
          <label for="terms-months">Terms (in Months)</label>
          <div class="input-wrap">
            <input
              id="terms-months"
              v-model.number="termsMonths"
              type="number"
              min="1"
              max="120"
              step="1"
              class="calc-input suffix-input"
              placeholder="e.g. 12"
            />
            <span class="currency-suffix">months</span>
          </div>
          <div class="preset-pills">
            <span class="preset-label">Quick Terms:</span>
            <button
              v-for="t in termsPresets"
              :key="t"
              type="button"
              class="pill-btn"
              :class="{ active: termsMonths === t }"
              @click="termsMonths = t"
            >
              {{ t }}m
            </button>
          </div>
        </div>
      </div>

      <!-- RESULTS SUMMARY CARD (Formatted exactly as requested) -->
      <div class="calc-card results-card">
        <h2 class="card-title">
          <span class="title-icon">📊</span> Calculation Output
        </h2>

        <!-- Formula Table Format from Screenshot -->
        <div class="excel-format-box">
          <div class="excel-row">
            <span class="excel-label">BASE PRICE</span>
            <span class="excel-val">{{ fmtCurrency(basePrice) }}</span>
          </div>
          <div class="excel-row">
            <span class="excel-label">DOWNPAYMENT</span>
            <span class="excel-val">{{ fmtCurrency(downpayment) }}</span>
          </div>
          <div class="excel-row">
            <span class="excel-label">ANNUAL INTEREST RATE</span>
            <span class="excel-val">{{ annualInterestRate }}%</span>
          </div>
          <div class="excel-row">
            <span class="excel-label">TERMS (IN MONTHS)</span>
            <span class="excel-val">{{ termsMonths }} months</span>
          </div>

          <div class="excel-divider" />

          <!-- Formulated Outputs -->
          <div class="excel-row contract-row">
            <span class="excel-label">CONTRACT PRICE</span>
            <span class="excel-val contract-val">{{ fmtCurrency(contractPrice) }}</span>
          </div>
          <div class="excel-row">
            <span class="excel-label">DOWNPAYMENT</span>
            <span class="excel-val">{{ fmtCurrency(downpayment) }}</span>
          </div>
          <div class="excel-row highlight-row">
            <span class="excel-label">BALANCE</span>
            <span class="excel-val bold-val">{{ fmtCurrency(balance) }}</span>
          </div>
          <div class="excel-row">
            <span class="excel-label">TERMS</span>
            <span class="excel-val">{{ termsMonths }} months</span>
          </div>
          <div class="excel-row monthly-row">
            <span class="excel-label">MONTHLY AMORTIZATION</span>
            <span class="excel-val monthly-val">{{ fmtCurrency(monthlyAmortization) }} <small>/ mo</small></span>
          </div>
        </div>

        <!-- Formula breakdown note -->
        <div class="formula-breakdown">
          <div class="breakdown-item">
            <span class="bk-label">Principal Financed:</span>
            <span class="bk-val">{{ fmtCurrency(principalFinanced) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="bk-label">Total Interest Charges:</span>
            <span class="bk-val text-red">{{ fmtCurrency(totalInterest) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="bk-label">Monthly Interest Rate:</span>
            <span class="bk-val">{{ ((annualInterestRate || 0) / 12).toFixed(2) }}% / month</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button type="button" class="btn btn-copy" @click="copySummary">
            {{ copied ? '✓ Copied to Clipboard!' : '📋 Copy Summary' }}
          </button>
        </div>
      </div>
    </div>
    </div><!-- end financial tab -->

    <!-- ═══ DOST CALCULATOR ═══ -->
    <div v-if="activeCalcTab === 'dost'">
      <div class="calc-header">
        <h1>DOST Calculator</h1>
        <p class="calc-subtitle">Compute DOST pricing breakdown: VAT, ESPMI cost, and overprice per machine.</p>
      </div>

      <div class="calc-card" style="max-width: 900px">
        <h2 class="card-title"><span class="title-icon">🏛️</span> Machine Pricing</h2>

        <!-- Table -->
        <div class="dost-table-wrap">
          <table class="dost-table">
            <thead>
              <tr>
                <th>Machine</th>
                <th class="num">DOST, VAT IN</th>
                <th class="num">VAT</th>
                <th class="num">DOST VAT EX</th>
                <th class="num">ESPMI, VAT EX</th>
                <th class="num">OP (Overprice)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in dostRows" :key="idx">
                <td>
                  <input v-model="row.machine" class="dost-in dost-in--name" placeholder="Machine name" />
                </td>
                <td>
                  <input v-model.number="row.dostVatIn" class="dost-in dost-in--num" type="number" min="0" step="1000" placeholder="0" />
                </td>
                <td class="num computed">{{ fmtCurrency(dostVat(row)) }}</td>
                <td class="num computed">{{ fmtCurrency(dostVatEx(row)) }}</td>
                <td>
                  <input v-model.number="espmiPrices[idx]" class="dost-in dost-in--num" type="number" min="0" step="1000" placeholder="0" @focus="ensureEspmiPrices()" />
                </td>
                <td class="num computed op-val">{{ fmtCurrency(dostOp(idx)) }}</td>
                <td>
                  <button v-if="dostRows.length > 1" class="dost-del" @click="removeDostRow(idx)">&times;</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="dost-total-row">
                <td><strong>TOTAL</strong></td>
                <td class="num"><strong>{{ fmtCurrency(dostTotalVatIn) }}</strong></td>
                <td class="num">{{ fmtCurrency(dostTotalVat) }}</td>
                <td class="num"></td>
                <td class="num"><strong>{{ fmtCurrency(dostTotalEspmi) }}</strong></td>
                <td class="num op-val"><strong>{{ fmtCurrency(dostTotalOp) }}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button v-if="dostRows.length < 10" class="dost-add-btn" @click="addDostRow">+ Add Machine</button>

        <!-- Summary Cards -->
        <div class="dost-summary">
          <div class="dost-summary-card">
            <span class="dost-sum-label">Total Overprice for Client</span>
            <span class="dost-sum-val">{{ fmtCurrency(dostTotalOp) }}</span>
          </div>
          <div class="dost-summary-card">
            <span class="dost-sum-label">Total Amount for ESPMI (VAT + ESPMI VAT EX)</span>
            <span class="dost-sum-val">{{ fmtCurrency(dostTotalForEspmi) }}</span>
          </div>
          <div class="dost-summary-card dost-summary-card--highlight">
            <span class="dost-sum-label">Total Amount to be Received from Client</span>
            <span class="dost-sum-val">{{ fmtCurrency(dostTotalFromClient) }}</span>
          </div>
        </div>

        <div class="action-buttons" style="margin-top: 16px">
          <button type="button" class="btn btn-copy" @click="copyDostSummary">
            {{ dostCopied ? '✓ Copied!' : '📋 Copy Summary' }}
          </button>
        </div>
      </div>
    </div><!-- end dost tab -->

  </div>
</template>

<style scoped>
.calculator-page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.calc-header {
  margin-bottom: 24px;
  text-align: left;
}

.calc-header h1 {
  font-size: 22px;
  color: #c0392b;
  font-weight: 700;
  margin: 0 0 4px;
}

.calc-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0;
}

/* Grid Layout */
.calc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.calc-card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

/* Form inputs */
.form-group {
  margin-bottom: 18px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #4b5563;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-info {
  font-size: 11px;
  background: #fef2f2;
  color: #c0392b;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 12px;
  font-weight: 700;
  color: #6b7280;
  font-size: 15px;
}

.currency-suffix {
  position: absolute;
  right: 12px;
  font-weight: 600;
  color: #9ca3af;
  font-size: 12px;
}

.calc-input::-webkit-outer-spin-button,
.calc-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.calc-input {
  width: 100%;
  padding: 10px 12px 10px 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  background: #f9fafb;
  transition: border-color 0.15s, background-color 0.15s;
  -moz-appearance: textfield;
  appearance: textfield;
}

.calc-input.suffix-input {
  padding-left: 12px;
  padding-right: 60px;
}

.calc-input:focus {
  outline: none;
  border-color: #c0392b;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

/* Preset Pills */
.preset-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 11px;
  color: #9ca3af;
  margin-right: 2px;
}

.pill-btn {
  padding: 4px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn:hover {
  background: #fee2e2;
  color: #c0392b;
  border-color: #fca5a5;
}

.pill-btn.active {
  background: #c0392b;
  color: #ffffff;
  border-color: #c0392b;
}

/* Excel Format Output Box */
.excel-format-box {
  background: #fcfcfc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.excel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  font-size: 12px;
  border-bottom: 1px dashed #f1f5f9;
}

.excel-row:last-child {
  border-bottom: none;
}

.excel-label {
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.excel-val {
  font-weight: 700;
  color: #1e293b;
  font-family: monospace, 'Courier New', Courier;
  font-size: 13px;
}

.excel-divider {
  height: 2px;
  background: #cbd5e1;
  margin: 10px 0;
}

.highlight-row {
  background: #f8fafc;
  padding: 8px;
  border-radius: 4px;
  margin: 2px 0;
}

.grand-val {
  font-size: 16px;
  color: #2563eb;
}

.bold-val {
  font-size: 14px;
  color: #0f172a;
}

.contract-row,
.monthly-row {
  background: #fef2f2;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin: 6px 0;
}

.contract-row .excel-label,
.monthly-row .excel-label {
  color: #991b1b;
  font-weight: 800;
  font-size: 13px;
}

.contract-val,
.monthly-val {
  font-size: 18px;
  font-weight: 800;
  color: #c0392b;
}

.monthly-val small {
  font-size: 11px;
  font-weight: 600;
  color: #991b1b;
}

/* Formula breakdown */
.formula-breakdown {
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 18px;
  font-size: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
}

.bk-label {
  color: #64748b;
}

.bk-val {
  font-weight: 600;
  color: #334155;
}

.text-red {
  color: #c0392b;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 11px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.btn-copy {
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-copy:hover {
  background: #e5e7eb;
}

/* Responsive (< 768px) */
@media screen and (max-width: 767px) {
  .calculator-page {
    padding: 14px;
  }

  .calc-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .excel-row {
    font-size: 11px;
  }

  .monthly-val {
    font-size: 16px;
  }

  .calc-input {
    font-size: 16px;
  }
}

/* ─── Tab Bar ─── */
.calc-tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
  max-width: 400px;
}

.calc-tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  color: #555;
  transition: all 0.2s;
}

.calc-tab-btn:hover {
  color: #c0392b;
}

.calc-tab-btn--active {
  background: #c0392b;
  color: #fff;
  box-shadow: 0 2px 6px rgba(192,57,43,0.25);
}

/* ─── DOST Calculator ─── */
.dost-table-wrap {
  overflow-x: auto;
  margin-bottom: 12px;
}

.dost-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.dost-table th {
  background: #c0392b;
  color: #fff;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.dost-table th.num {
  text-align: right;
}

.dost-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.dost-table td.num {
  text-align: right;
  font-family: monospace;
  font-size: 12px;
}

.dost-table td.computed {
  color: #555;
}

.dost-table td.op-val {
  color: #c0392b;
  font-weight: 700;
}

.dost-in {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  box-sizing: border-box;
}

.dost-in:focus {
  outline: none;
  border-color: #c0392b;
}

.dost-in--name {
  min-width: 140px;
}

.dost-in--num {
  min-width: 100px;
  text-align: right;
  -moz-appearance: textfield;
  appearance: textfield;
}

.dost-in--num::-webkit-outer-spin-button,
.dost-in--num::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.dost-del {
  background: none;
  border: 1px solid #ddd;
  color: #c0392b;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dost-del:hover {
  background: #fdecea;
}

.dost-total-row td {
  border-top: 2px solid #c0392b;
  padding-top: 10px;
}

.dost-add-btn {
  padding: 8px 14px;
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 20px;
}

.dost-add-btn:hover {
  background: #fdecea;
}

/* DOST Summary Cards */
.dost-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.dost-summary-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}

.dost-summary-card--highlight {
  background: #fef2f2;
  border-color: #fecaca;
}

.dost-sum-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}

.dost-sum-val {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #111;
  font-family: monospace;
}

.dost-summary-card--highlight .dost-sum-val {
  color: #c0392b;
}

@media screen and (max-width: 767px) {
  .dost-summary {
    grid-template-columns: 1fr;
  }
  .calc-tab-bar {
    max-width: 100%;
  }
}
</style>
