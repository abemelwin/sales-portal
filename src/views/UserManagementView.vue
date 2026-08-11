<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { Role, User } from '@/types'

const userStore = useUserStore()
const authStore = useAuthStore()

// ─── Pagination (Requirement 10.4: max 50 rows/page) ─────────────────────────
const PAGE_SIZE = 50
const currentPage = ref(1)

const totalPages = computed(() => {
  const total = userStore.users.length
  return total > 0 ? Math.ceil(total / PAGE_SIZE) : 1
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return userStore.users.slice(start, end)
})

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// ─── Create Form State ────────────────────────────────────────────────────────
const showCreateForm = ref(false)
const creating = ref(false)
const successMessage = ref('')
let successTimeout: ReturnType<typeof setTimeout> | null = null

const form = reactive({
  username: '',
  display_name: '',
  password: '',
  role: 'salesperson' as Role,
})

const formErrors = reactive<Record<string, string>>({})
const serverError = ref('')

// ─── Confirmation Dialog State ────────────────────────────────────────────────
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)
const confirmLoading = ref(false)
const confirmError = ref('')

// ─── Role Change State ────────────────────────────────────────────────────────
const showRoleChangeDialog = ref(false)
const roleChangeTarget = ref<User | null>(null)
const roleChangeNewRole = ref<Role>('salesperson')
const roleChangeLoading = ref(false)
const roleChangeError = ref('')

// ─── Validation ───────────────────────────────────────────────────────────────

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  serverError.value = ''

  // Username validation (Requirement 10.1, 10.7)
  const username = form.username.trim()
  if (!username) {
    formErrors.username = 'Username is required.'
  } else if (username.length < 3) {
    formErrors.username = 'Username must be at least 3 characters.'
  } else if (username.length > 64) {
    formErrors.username = 'Username must be 64 characters or less.'
  } else if (!USERNAME_REGEX.test(username)) {
    formErrors.username = 'Username must contain only letters, numbers, and underscores.'
  }

  // Display name validation (Requirement 10.1, 10.7)
  const displayName = form.display_name.trim()
  if (!displayName) {
    formErrors.display_name = 'Display name is required.'
  } else if (displayName.length > 128) {
    formErrors.display_name = 'Display name must be 128 characters or less.'
  }

  // Password validation (Requirement 10.1, 10.7)
  if (!form.password) {
    formErrors.password = 'Password is required.'
  } else if (form.password.length < 8) {
    formErrors.password = 'Password must be at least 8 characters.'
  } else if (form.password.length > 128) {
    formErrors.password = 'Password must be 128 characters or less.'
  }

  return Object.keys(formErrors).length === 0
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function showSuccess(msg: string) {
  successMessage.value = msg
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => {
    successMessage.value = ''
  }, 5000)
}

function isDuplicateUsernameError(errMsg: string): boolean {
  const lower = errMsg.toLowerCase()
  return (
    lower.includes('already') ||
    lower.includes('duplicate') ||
    lower.includes('unique') ||
    lower.includes('taken') ||
    lower.includes('exists') ||
    lower.includes('23505')
  )
}

function openCreateForm() {
  resetForm()
  showCreateForm.value = true
}

function closeCreateForm() {
  showCreateForm.value = false
  resetForm()
}

function resetForm() {
  form.username = ''
  form.display_name = ''
  form.password = ''
  form.role = 'salesperson'
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  serverError.value = ''
}

async function handleCreateUser() {
  if (!validateForm()) return

  creating.value = true
  serverError.value = ''

  const result = await userStore.createUser({
    username: form.username.trim(),
    display_name: form.display_name.trim(),
    password: form.password,
    role: form.role,
  })

  creating.value = false

  if (result.success) {
    showSuccess(`User "${form.display_name.trim()}" created successfully!`)
    closeCreateForm()
  } else if (result.error) {
    if (isDuplicateUsernameError(result.error)) {
      formErrors.username = 'This username is already taken.'
    } else {
      serverError.value = result.error
    }
  }
}

function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive'
}

function getStatusClass(isActive: boolean): string {
  return isActive ? 'status-active' : 'status-inactive'
}

function getRoleLabel(role: Role): string {
  return role === 'admin' ? 'Admin' : 'Salesperson'
}

// ─── Role Change (Requirement 10.2) ──────────────────────────────────────────

function openRoleChangeDialog(user: User) {
  roleChangeTarget.value = user
  roleChangeNewRole.value = user.role === 'admin' ? 'salesperson' : 'admin'
  roleChangeError.value = ''
  showRoleChangeDialog.value = true
}

function closeRoleChangeDialog() {
  showRoleChangeDialog.value = false
  roleChangeTarget.value = null
  roleChangeError.value = ''
}

async function handleRoleChange() {
  if (!roleChangeTarget.value) return

  roleChangeLoading.value = true
  roleChangeError.value = ''

  const result = await userStore.updateRole(
    roleChangeTarget.value.user_id,
    roleChangeNewRole.value
  )

  roleChangeLoading.value = false

  if (result.success) {
    showSuccess(
      `Role for "${roleChangeTarget.value.display_name}" changed to ${getRoleLabel(roleChangeNewRole.value)}.`
    )
    closeRoleChangeDialog()
  } else {
    roleChangeError.value = result.error || 'Failed to change role.'
  }
}

// ─── Deactivation (Requirement 10.3, 10.6) ───────────────────────────────────

function openDeactivateDialog(user: User) {
  confirmTitle.value = 'Deactivate User'
  confirmMessage.value = `Are you sure you want to deactivate "${user.display_name}"? This will invalidate their active sessions and prevent them from logging in.`
  confirmError.value = ''
  confirmAction.value = async () => {
    confirmLoading.value = true
    confirmError.value = ''

    const result = await userStore.deactivateUser(user.user_id)

    confirmLoading.value = false

    if (result.success) {
      showSuccess(`User "${user.display_name}" has been deactivated.`)
      closeConfirmDialog()
    } else {
      confirmError.value = result.error || 'Failed to deactivate user.'
    }
  }
  showConfirmDialog.value = true
}

// ─── Reactivation (Requirement 10.8) ─────────────────────────────────────────

function openReactivateDialog(user: User) {
  confirmTitle.value = 'Reactivate User'
  confirmMessage.value = `Are you sure you want to reactivate "${user.display_name}"? Their previous role (${getRoleLabel(user.role)}) will be restored.`
  confirmError.value = ''
  confirmAction.value = async () => {
    confirmLoading.value = true
    confirmError.value = ''

    const result = await userStore.reactivateUser(user.user_id)

    confirmLoading.value = false

    if (result.success) {
      showSuccess(`User "${user.display_name}" has been reactivated with role ${getRoleLabel(user.role)}.`)
      closeConfirmDialog()
    } else {
      confirmError.value = result.error || 'Failed to reactivate user.'
    }
  }
  showConfirmDialog.value = true
}

function closeConfirmDialog() {
  showConfirmDialog.value = false
  confirmAction.value = null
  confirmError.value = ''
}

async function executeConfirmAction() {
  if (confirmAction.value) {
    await confirmAction.value()
  }
}

/**
 * Check if the deactivate button should be disabled for a user.
 * Disabled if user is the last active admin (Requirement 10.6).
 */
function isDeactivateDisabled(user: User): boolean {
  return userStore.isLastActiveAdmin(user.user_id)
}

/**
 * Check if the current user is the same as the target (prevent self-actions).
 */
function isSelf(user: User): boolean {
  return authStore.user?.user_id === user.user_id
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await userStore.fetchUsers()
})
</script>

<template>
  <div class="user-management-view">
    <header class="page-header">
      <h1>User Management</h1>
      <button
        class="btn btn-primary"
        @click="openCreateForm"
      >
        + Create User
      </button>
    </header>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success" role="alert">
      {{ successMessage }}
    </div>

    <!-- Store Error -->
    <div v-if="userStore.error && !showCreateForm" class="alert alert-error" role="alert">
      {{ userStore.error }}
    </div>

    <!-- ═══ User Table ═══ -->
    <section class="user-table-section">
      <div v-if="userStore.loading && userStore.users.length === 0" class="loading-state">
        Loading users...
      </div>

      <div v-else-if="userStore.users.length === 0" class="empty-state">
        <p>No users found.</p>
      </div>

      <template v-else>
        <table class="user-table" aria-label="Users">
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>{{ user.display_name }}</td>
              <td class="username-cell">{{ user.user_id ? user.user_id.substring(0, 8) + '...' : '—' }}</td>
              <td>
                <span class="role-badge" :class="'role-' + user.role">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(user.is_active)">
                  {{ getStatusLabel(user.is_active) }}
                </span>
              </td>
              <td class="actions-cell">
                <!-- Change Role button -->
                <button
                  v-if="user.is_active"
                  class="btn btn-sm btn-action"
                  :disabled="isSelf(user)"
                  :title="isSelf(user) ? 'Cannot change your own role' : `Change role to ${user.role === 'admin' ? 'Salesperson' : 'Admin'}`"
                  @click="openRoleChangeDialog(user)"
                >
                  Change Role
                </button>

                <!-- Deactivate button (for active users) -->
                <button
                  v-if="user.is_active"
                  class="btn btn-sm btn-danger"
                  :disabled="isDeactivateDisabled(user) || isSelf(user)"
                  :title="isDeactivateDisabled(user) ? 'Cannot deactivate the last active admin' : isSelf(user) ? 'Cannot deactivate yourself' : 'Deactivate user'"
                  @click="openDeactivateDialog(user)"
                >
                  Deactivate
                </button>

                <!-- Reactivate button (for inactive users) -->
                <button
                  v-if="!user.is_active"
                  class="btn btn-sm btn-success"
                  title="Reactivate user"
                  @click="openReactivateDialog(user)"
                >
                  Reactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <nav v-if="totalPages > 1" class="pagination" aria-label="User table pagination">
          <button
            class="btn btn-sm btn-secondary"
            :disabled="currentPage <= 1"
            @click="prevPage()"
          >
            &laquo; Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="btn btn-sm btn-secondary"
            :disabled="currentPage >= totalPages"
            @click="nextPage()"
          >
            Next &raquo;
          </button>
        </nav>
      </template>
    </section>

    <!-- ═══ Create User Modal ═══ -->
    <div v-if="showCreateForm" class="modal-overlay" @click.self="closeCreateForm">
      <div class="modal" role="dialog" aria-labelledby="create-user-title" aria-modal="true">
        <h2 id="create-user-title">Create New User</h2>

        <!-- Server Error -->
        <div v-if="serverError" class="alert alert-error" role="alert">
          {{ serverError }}
        </div>

        <form @submit.prevent="handleCreateUser" novalidate>
          <!-- Username -->
          <div class="form-group">
            <label for="create-username">Username <span class="required">*</span></label>
            <input
              id="create-username"
              v-model="form.username"
              type="text"
              maxlength="64"
              placeholder="3–64 chars, letters, numbers, underscores"
              class="input-field"
              :class="{ 'input-error': formErrors.username }"
              aria-required="true"
              aria-describedby="username-hint"
              autocomplete="off"
            />
            <small id="username-hint" class="field-hint">
              Alphanumeric and underscores only, 3–64 characters.
            </small>
            <span v-if="formErrors.username" class="field-error" role="alert">
              {{ formErrors.username }}
            </span>
          </div>

          <!-- Display Name -->
          <div class="form-group">
            <label for="create-display-name">Display Name <span class="required">*</span></label>
            <input
              id="create-display-name"
              v-model="form.display_name"
              type="text"
              maxlength="128"
              placeholder="1–128 characters"
              class="input-field"
              :class="{ 'input-error': formErrors.display_name }"
              aria-required="true"
            />
            <span v-if="formErrors.display_name" class="field-error" role="alert">
              {{ formErrors.display_name }}
            </span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="create-password">Initial Password <span class="required">*</span></label>
            <input
              id="create-password"
              v-model="form.password"
              type="password"
              maxlength="128"
              placeholder="8–128 characters"
              class="input-field"
              :class="{ 'input-error': formErrors.password }"
              aria-required="true"
              aria-describedby="password-hint"
              autocomplete="new-password"
            />
            <small id="password-hint" class="field-hint">
              Must be between 8 and 128 characters.
            </small>
            <span v-if="formErrors.password" class="field-error" role="alert">
              {{ formErrors.password }}
            </span>
          </div>

          <!-- Role Selection -->
          <div class="form-group">
            <label for="create-role">Role <span class="required">*</span></label>
            <select
              id="create-role"
              v-model="form.role"
              class="input-field"
              aria-required="true"
            >
              <option value="salesperson">Salesperson</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <!-- Form Actions -->
          <div class="modal-actions">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="creating"
            >
              {{ creating ? 'Creating...' : 'Create User' }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeCreateForm"
              :disabled="creating"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- ═══ Confirmation Dialog ═══ -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click.self="closeConfirmDialog">
      <div class="modal" role="dialog" aria-labelledby="confirm-dialog-title" aria-modal="true">
        <h2 id="confirm-dialog-title">{{ confirmTitle }}</h2>

        <div v-if="confirmError" class="alert alert-error" role="alert">
          {{ confirmError }}
        </div>

        <p class="confirm-message">{{ confirmMessage }}</p>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-danger"
            :disabled="confirmLoading"
            @click="executeConfirmAction"
          >
            {{ confirmLoading ? 'Processing...' : 'Confirm' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="confirmLoading"
            @click="closeConfirmDialog"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Role Change Dialog ═══ -->
    <div v-if="showRoleChangeDialog" class="modal-overlay" @click.self="closeRoleChangeDialog">
      <div class="modal" role="dialog" aria-labelledby="role-change-title" aria-modal="true">
        <h2 id="role-change-title">Change User Role</h2>

        <div v-if="roleChangeError" class="alert alert-error" role="alert">
          {{ roleChangeError }}
        </div>

        <div v-if="roleChangeTarget" class="role-change-content">
          <p>
            Change role for <strong>{{ roleChangeTarget.display_name }}</strong>
            from <span class="role-badge" :class="'role-' + roleChangeTarget.role">{{ getRoleLabel(roleChangeTarget.role) }}</span>
            to:
          </p>

          <div class="form-group">
            <label for="role-change-select">New Role</label>
            <select
              id="role-change-select"
              v-model="roleChangeNewRole"
              class="input-field"
            >
              <option value="salesperson">Salesperson</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <p class="role-change-note">
            The new role will apply on the user's next authenticated request.
          </p>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="roleChangeLoading || (roleChangeTarget?.role === roleChangeNewRole)"
            @click="handleRoleChange"
          >
            {{ roleChangeLoading ? 'Updating...' : 'Change Role' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="roleChangeLoading"
            @click="closeRoleChangeDialog"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management-view {
  padding: var(--space-6);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* ─── Page Header ────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
}

/* ─── Alerts ─────────────────────────────────────────────────────────────── */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
}

.alert-success {
  background-color: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.alert-error {
  background-color: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

/* ─── States ─────────────────────────────────────────────────────────────── */
.loading-state,
.empty-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-gray-500);
}

/* ─── User Table ─────────────────────────────────────────────────────────── */
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.user-table th,
.user-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.user-table th {
  font-weight: 600;
  background-color: var(--color-gray-50);
  color: var(--color-gray-700);
}

.user-table tbody tr:hover {
  background-color: var(--color-gray-50);
}

.username-cell {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}

/* ─── Badges ─────────────────────────────────────────────────────────────── */
.role-badge,
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  line-height: 1;
}

.role-admin {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.role-salesperson {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.status-active {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.status-inactive {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding: var(--space-3) 0;
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal h2 {
  margin: 0 0 var(--space-5);
  font-size: var(--font-size-xl);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

/* ─── Form ───────────────────────────────────────────────────────────────── */
.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.required {
  color: var(--color-error);
}

.input-field {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-field.input-error {
  border-color: var(--color-error);
}

.input-field.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.field-hint {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.field-error {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

/* ─── Buttons ────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border-color: var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-50);
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  min-height: 36px;
  min-width: 36px;
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media screen and (max-width: 768px) {
  .user-management-view {
    padding: var(--space-4);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .user-table {
    font-size: var(--font-size-xs);
  }

  .user-table th,
  .user-table td {
    padding: var(--space-2) var(--space-3);
  }

  .modal {
    max-width: 100%;
    margin: var(--space-4);
  }

  .actions-cell {
    flex-direction: column;
  }
}

/* ─── Action Buttons ─────────────────────────────────────────────────────── */
.actions-cell {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.btn-action {
  background-color: var(--color-info-light, #e0f2fe);
  color: var(--color-info, #0369a1);
  border-color: var(--color-info, #0369a1);
}

.btn-action:hover:not(:disabled) {
  background-color: var(--color-info, #0369a1);
  color: var(--color-white);
}

.btn-danger {
  background-color: var(--color-error-light, #fef2f2);
  color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-error, #dc2626);
  color: var(--color-white);
}

.btn-success {
  background-color: var(--color-success-light, #f0fdf4);
  color: var(--color-success, #16a34a);
  border-color: var(--color-success, #16a34a);
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-success, #16a34a);
  color: var(--color-white);
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────── */
.confirm-message {
  margin: var(--space-4) 0;
  color: var(--color-gray-700);
  line-height: 1.5;
}

/* ─── Role Change Dialog ─────────────────────────────────────────────────── */
.role-change-content p {
  margin: var(--space-3) 0;
  color: var(--color-gray-700);
  line-height: 1.5;
}

.role-change-note {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-style: italic;
}
</style>
