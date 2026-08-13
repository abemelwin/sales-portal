<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const authStore = useAuthStore()

const LAST_EMAIL_KEY = 'espmi_last_email'
const email = ref(localStorage.getItem(LAST_EMAIL_KEY) || '')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const result = await authStore.login(email.value, password.value)

    if (result.success) {
      // Remember last email for next login
      localStorage.setItem(LAST_EMAIL_KEY, email.value)
      // Redirect to saved return URL or dashboard
      const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
      router.push(redirectPath)
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <h1 class="login-title">ES PRINT MEDIA INC.</h1>
      <p class="login-subtitle">Quotation System &mdash; Sign In</p>

      <!-- Account locked message -->
      <div
        v-if="authStore.isLocked"
        class="alert alert-locked"
        role="alert"
        aria-live="assertive"
      >
        Account locked due to too many failed login attempts. Please contact an administrator.
      </div>

      <!-- Error message -->
      <div
        v-else-if="authStore.error"
        class="alert alert-error"
        role="alert"
        aria-live="polite"
      >
        {{ authStore.error }}
      </div>

      <form
        @submit.prevent="handleSubmit"
        class="login-form"
        aria-label="Login form"
        novalidate
      >
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="text"
            class="form-input"
            placeholder="Enter your email"
            autocomplete="email"
            required
            :disabled="authStore.isLocked || isSubmitting"
            aria-required="true"
            aria-describedby="email-hint"
          />
          <span id="email-hint" class="sr-only">Enter the email address associated with your account</span>
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
            aria-required="true"
            aria-describedby="password-hint"
          />
          <button type="button" class="show-pass-btn" @click="showPassword = !showPassword" tabindex="-1">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
          <span id="password-hint" class="sr-only">Enter your account password</span>
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.isLocked || isSubmitting || !email || !password"
          :aria-busy="isSubmitting"
        >
          <span v-if="isSubmitting" class="btn-loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- HTTPS enforcement notice -->
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

.password-wrapper {
  position: relative;
}

.password-wrapper .form-input {
  padding-right: 60px;
}

.show-pass-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-gray-500);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
}

.show-pass-btn:hover {
  color: var(--color-primary);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 56px;
  width: 100%;
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
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.btn-login:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-login:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.security-notice {
  margin: var(--space-6) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
  text-align: center;
}

/* Responsive adjustments */
@media screen and (max-width: 374px) {
  .login-card {
    padding: var(--space-6);
  }
}
</style>
