<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isMandatory = computed(() => !!authStore.user?.must_change_password)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = false

  if (!form.currentPassword) {
    error.value = 'Current password is required.'
    return
  }
  if (form.newPassword.length < 8) {
    error.value = 'New password must be at least 8 characters.'
    return
  }
  if (form.newPassword.length > 128) {
    error.value = 'New password must be 128 characters or less.'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'New passwords do not match.'
    return
  }

  loading.value = true
  const result = await authStore.changePassword(form.currentPassword, form.newPassword)
  loading.value = false

  if (result.success) {
    success.value = true
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''

    setTimeout(() => {
      router.push('/quotes/new')
    }, 1200)
  } else {
    error.value = result.error || 'Failed to change password.'
  }
}
</script>

<template>
  <div class="change-password-view">
    <div class="card">
      <h1>Change Password</h1>

      <!-- Mandatory notice banner -->
      <div v-if="isMandatory" class="alert alert-warning" role="alert">
        <strong>Mandatory Password Change:</strong> For security reasons, you must change your initial/reset password before accessing the system.
      </div>

      <div v-if="success" class="alert alert-success" role="status">
        Password changed successfully. Redirecting...
      </div>

      <div v-if="error" class="alert alert-error" role="alert">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-group">
          <label for="current-password">Current Password</label>
          <input
            id="current-password"
            v-model="form.currentPassword"
            type="password"
            class="input-field"
            autocomplete="current-password"
            aria-required="true"
          />
        </div>

        <div class="form-group">
          <label for="new-password">New Password</label>
          <input
            id="new-password"
            v-model="form.newPassword"
            type="password"
            class="input-field"
            autocomplete="new-password"
            aria-required="true"
          />
          <small class="hint">8–128 characters</small>
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="input-field"
            autocomplete="new-password"
            aria-required="true"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Changing...' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.change-password-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px;
  min-height: calc(100vh - var(--nav-height));
  background: #eef0f2;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,.12);
  padding: 32px 28px;
  width: 100%;
  max-width: 400px;
}

h1 {
  font-size: 18px;
  color: #c0392b;
  margin: 0 0 20px;
  font-weight: 700;
}

.alert {
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #16a34a;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  color: #d46b08;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.input-field {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  background: #fafafa;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #c0392b;
  background: #fff;
}

.hint {
  display: block;
  font-size: 11px;
  color: #aaa;
  margin-top: 3px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #c0392b;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: #a93226;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media screen and (max-width: 480px) {
  .change-password-view {
    padding: 16px 12px;
  }
  .card {
    padding: 20px 16px;
  }
}
</style>
