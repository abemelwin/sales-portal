<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const LAST_EMAIL_KEY = 'espmi_last_email'

// ─── Step control ───────────────────────────────────────────────────────────
type Step = 'credentials' | 'otp'
const step = ref<Step>('credentials')

// ─── Form fields ────────────────────────────────────────────────────────────
const email = ref(localStorage.getItem(LAST_EMAIL_KEY) || '')
const password = ref('')
const otpCode = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const otpResendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

// ─── Step 1: Submit credentials ─────────────────────────────────────────────
async function handleCredentials() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // First verify credentials via normal login
    const result = await authStore.login(email.value, password.value)
    if (!result.success) return

    // Credentials valid — sign out the session created by login,
    // then send OTP for second factor
    await authStore.logout()

    const otpResult = await authStore.sendOtp(email.value)
    if (!otpResult.success) return

    // Move to OTP step
    localStorage.setItem(LAST_EMAIL_KEY, email.value)
    step.value = 'otp'
    startCooldown()
  } finally {
    isSubmitting.value = false
  }
}

// ─── Step 2: Verify OTP ──────────────────────────────────────────────────────
async function handleOtp() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const result = await authStore.verifyOtp(email.value, otpCode.value.trim())
    if (result.success) {
      const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
      router.push(redirectPath)
    }
  } finally {
    isSubmitting.value = false
  }
}

// ─── Resend OTP ──────────────────────────────────────────────────────────────
async function resendOtp() {
  if (otpResendCooldown.value > 0) return
  await authStore.sendOtp(email.value)
  startCooldown()
}

function startCooldown(seconds = 60) {
  otpResendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    otpResendCooldown.value--
    if (otpResendCooldown.value <= 0) {
      clearInterval(cooldownTimer!)
      cooldownTimer = null
    }
  }, 1000)
}

function goBack() {
  step.value = 'credentials'
  otpCode.value = ''
  authStore.error = null
  if (cooldownTimer) clearInterval(cooldownTimer)
  otpResendCooldown.value = 0
}

// Only allow digits in OTP input
function onOtpInput(e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  otpCode.value = val
  ;(e.target as HTMLInputElement).value = val
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <h1 class="login-title">ES PRINT MEDIA INC.</h1>
      <p class="login-subtitle">Quotation System &mdash; Sign In</p>

      <!-- Account locked -->
      <div v-if="authStore.isLocked" class="alert alert-locked" role="alert" aria-live="assertive">
        Account locked due to too many failed login attempts. Please contact an administrator.
      </div>

      <!-- Error -->
      <div v-else-if="authStore.error" class="alert alert-error" role="alert" aria-live="polite">
        {{ authStore.error }}
      </div>

      <!-- ── Step 1: Email + Password ── -->
      <form v-if="step === 'credentials'" @submit.prevent="handleCredentials" class="login-form" novalidate>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="Enter your email"
            autocomplete="email"
            required
            :disabled="authStore.isLocked || isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              :disabled="authStore.isLocked || isSubmitting"
            />
            <button type="button" class="show-pass-btn" @click="showPassword = !showPassword" tabindex="-1">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.isLocked || isSubmitting || !email || !password"
          :aria-busy="isSubmitting"
        >
          <span v-if="isSubmitting" class="btn-spinner"></span>
          {{ isSubmitting ? 'Verifying...' : 'Continue' }}
        </button>
      </form>

      <!-- ── Step 2: OTP Code ── -->
      <div v-else class="login-form">
        <div class="otp-info">
          <div class="otp-icon">✉️</div>
          <p class="otp-desc">
            A 6-digit verification code was sent to<br>
            <strong>{{ email }}</strong>
          </p>
        </div>

        <form @submit.prevent="handleOtp" novalidate>
          <div class="form-group">
            <label for="otp" class="form-label">Verification Code</label>
            <input
              id="otp"
              :value="otpCode"
              @input="onOtpInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              class="form-input otp-input"
              placeholder="000000"
              autocomplete="one-time-code"
              required
              :disabled="isSubmitting"
            />
          </div>

          <button
            type="submit"
            class="btn-login"
            :disabled="isSubmitting || otpCode.length !== 6"
            :aria-busy="isSubmitting"
          >
            <span v-if="isSubmitting" class="btn-spinner"></span>
            {{ isSubmitting ? 'Verifying...' : 'Verify & Sign In' }}
          </button>
        </form>

        <div class="otp-actions">
          <button class="otp-back-btn" type="button" @click="goBack" :disabled="isSubmitting">
            ← Back
          </button>
          <button
            class="otp-resend-btn"
            type="button"
            @click="resendOtp"
            :disabled="otpResendCooldown > 0 || isSubmitting"
          >
            {{ otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Resend Code' }}
          </button>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="step-indicator">
        <span :class="['step-dot', step === 'credentials' ? 'step-dot--active' : 'step-dot--done']"></span>
        <span class="step-line"></span>
        <span :class="['step-dot', step === 'otp' ? 'step-dot--active' : '']"></span>
      </div>

      <p class="security-notice">
        <span aria-hidden="true">&#128274;</span>
        Secured with HTTPS
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: linear-gradient(135deg, #c0392b, #7b1e13);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-8);
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.login-title {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: #c0392b;
  text-align: center;
}

.login-subtitle {
  margin: 0 0 var(--space-6);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  text-align: center;
}

.alert {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.alert-locked {
  background-color: var(--color-warning-light);
  color: var(--color-gray-800);
  border: 1px solid var(--color-warning);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-gray-900);
  background-color: var(--color-white);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input::placeholder {
  color: var(--color-gray-400);
}

/* OTP input — big centered digits */
.otp-input {
  font-size: 28px;
  letter-spacing: 10px;
  text-align: center;
  font-weight: 700;
  color: #c0392b;
  padding: var(--space-3) var(--space-2);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 56px;
}

.show-pass-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #c0392b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
}

.show-pass-btn:hover {
  color: #7b1e13;
  text-decoration: underline;
}

.btn-login {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-2);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-white);
  background-color: #c0392b;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-login:hover:not(:disabled) {
  background-color: #a93226;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* OTP info block */
.otp-info {
  text-align: center;
  padding: var(--space-4) var(--space-2);
  background: #fef9f9;
  border: 1px solid #fde8e8;
  border-radius: var(--radius-md);
}

.otp-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.otp-desc {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin: 0;
  line-height: 1.6;
}

.otp-desc strong {
  color: #c0392b;
}

/* OTP action buttons */
.otp-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -8px;
}

.otp-back-btn {
  background: none;
  border: none;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 4px 0;
}

.otp-back-btn:hover:not(:disabled) {
  color: var(--color-gray-800);
}

.otp-back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.otp-resend-btn {
  background: none;
  border: none;
  color: #c0392b;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.otp-resend-btn:hover:not(:disabled) {
  text-decoration: underline;
}

.otp-resend-btn:disabled {
  color: var(--color-gray-400);
  cursor: not-allowed;
}

/* Step indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-top: var(--space-6);
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background 0.3s;
  flex-shrink: 0;
}

.step-dot--active {
  background: #c0392b;
}

.step-dot--done {
  background: #27ae60;
}

.step-line {
  width: 40px;
  height: 2px;
  background: #e0e0e0;
}

.security-notice {
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  text-align: center;
}

@media screen and (max-width: 374px) {
  .login-card {
    padding: var(--space-6);
  }
}
</style>
