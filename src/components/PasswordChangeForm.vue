<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Feedback state
const successMessage = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

// Validation
const newPasswordError = computed(() => {
  if (!newPassword.value) return ''
  if (newPassword.value.length < 8) return 'Password must be at least 8 characters.'
  if (newPassword.value.length > 128) return 'Password must be at most 128 characters.'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  if (confirmPassword.value !== newPassword.value) return 'Passwords do not match.'
  return ''
})

const isFormValid = computed(() => {
  return (
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 8 &&
    newPassword.value.length <= 128 &&
    confirmPassword.value === newPassword.value &&
    !isSubmitting.value
  )
})

async function handleSubmit() {
  // Clear previous messages
  successMessage.value = ''
  errorMessage.value = ''

  // Client-side validation gate
  if (!isFormValid.value) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await authStore.changePassword(currentPassword.value, newPassword.value)

    if (result.success) {
      successMessage.value = 'Password changed successfully.'
      // Clear form on success
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      errorMessage.value = result.error || 'Failed to change password.'
    }
  } catch {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="password-change-form">
    <h2 class="password-change-form__title">Change Password</h2>

    <!-- Success message -->
    <div v-if="successMessage" class="password-change-form__message password-change-form__message--success" role="alert">
      {{ successMessage }}
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="password-change-form__message password-change-form__message--error" role="alert">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" novalidate>
      <!-- Current Password -->
      <div class="password-change-form__field">
        <label for="current-password" class="password-change-form__label">Current Password</label>
        <input
          id="current-password"
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          required
          class="password-change-form__input"
        />
      </div>

      <!-- New Password -->
      <div class="password-change-form__field">
        <label for="new-password" class="password-change-form__label">New Password</label>
        <input
          id="new-password"
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          required
          class="password-change-form__input"
          :class="{ 'password-change-form__input--invalid': newPasswordError }"
          aria-describedby="new-password-error"
        />
        <p
          v-if="newPasswordError"
          id="new-password-error"
          class="password-change-form__error"
          role="alert"
        >
          {{ newPasswordError }}
        </p>
        <p v-else class="password-change-form__hint">Must be 8–128 characters.</p>
      </div>

      <!-- Confirm New Password -->
      <div class="password-change-form__field">
        <label for="confirm-password" class="password-change-form__label">Confirm New Password</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          class="password-change-form__input"
          :class="{ 'password-change-form__input--invalid': confirmPasswordError }"
          aria-describedby="confirm-password-error"
        />
        <p
          v-if="confirmPasswordError"
          id="confirm-password-error"
          class="password-change-form__error"
          role="alert"
        >
          {{ confirmPasswordError }}
        </p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="password-change-form__submit"
        :disabled="!isFormValid"
      >
        <span v-if="isSubmitting">Changing...</span>
        <span v-else>Change Password</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.password-change-form {
  max-width: 28rem;
  padding: var(--space-6);
  background: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.password-change-form__title {
  margin-bottom: var(--space-6);
  font-size: var(--font-size-xl);
  color: var(--color-gray-900);
}

.password-change-form__message {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
}

.password-change-form__message--success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.password-change-form__message--error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.password-change-form__field {
  margin-bottom: var(--space-4);
}

.password-change-form__label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.password-change-form__input {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
  color: var(--color-gray-900);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.password-change-form__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.password-change-form__input--invalid {
  border-color: var(--color-error);
}

.password-change-form__input--invalid:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.password-change-form__error {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.password-change-form__hint {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.password-change-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  margin-top: var(--space-2);
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-white);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.password-change-form__submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.password-change-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
