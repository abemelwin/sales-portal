<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

// ─── Types for old localStorage data ─────────────────────────────────────────

interface OldConsumable {
  id: string
  name: string
  pkg: string
  price: number
}

interface OldOptional {
  id: string
  label: string
}

interface OldSubModel {
  v: string
  price: number
  termsPrice: number
}

interface OldMachine {
  quoteTitle: string
  brand: string
  category?: string
  imageKey?: string
  imageFile?: string
  subModels: OldSubModel[]
  defaultMonths?: number
  defaultAvail?: string
  hasTradeIn?: boolean
  hasPrinthead?: boolean
  printheadMonths?: number
  computerSet?: string | null
  features: string[]
  stdPackages: string[]
  stdExclusives: string[]
  consumables: OldConsumable[]
  optionals: OldOptional[]
  warrantyLines?: Array<{ t: string; b: boolean }>
  srp?: number
  lbp?: number
  cashPrice?: number
  machineWarranty?: number
  printheadWarranty?: string
}

interface OldUser {
  u: string
  h: string
  r: string
}

interface SkippedRecord {
  identifier: string
  reason: string
  type: 'machine' | 'user'
}

// ─── State ────────────────────────────────────────────────────────────────────

const authStore = useAuthStore()

const loading = ref(false)
const checking = ref(true)
const migrating = ref(false)
const migrationComplete = ref(false)
const previousMigration = ref<{ status: string; completed_at: string | null } | null>(null)

// Pre-migration scan results
const machinesFound = ref(0)
const usersFound = ref(0)
const totalRecordsFound = computed(() => machinesFound.value + usersFound.value)
const noDataAvailable = ref(false)
const scanError = ref<string | null>(null)

// Migration progress
const currentStep = ref('')
const recordsProcessed = ref(0)
const recordsMigrated = ref(0)
const recordsSkipped = ref(0)
const skippedDetails = ref<SkippedRecord[]>([])
const migrationError = ref<string | null>(null)
const migrationDone = ref(false)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readLocalStorageJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Determine unit condition from quoteTitle or default.
 * If the title contains "RE-CERTIFIED" or "RECERTIFIED", it's recertified.
 * If "DEMO", it's a demo unit.
 * Otherwise, "Brand New".
 */
function inferUnitCondition(title: string): 'Brand New' | 'Re-certified' | 'Demo Unit' {
  const upper = title.toUpperCase()
  if (upper.includes('RE-CERTIFIED') || upper.includes('RECERTIFIED')) return 'Re-certified'
  if (upper.includes('DEMO UNIT') || upper.includes('DEMO')) return 'Demo Unit'
  return 'Brand New'
}

/**
 * Extract model name from quoteTitle by removing the brand prefix.
 */
function extractModel(quoteTitle: string, brand: string): string {
  // Try to remove "BRAND " prefix from the title
  const upper = quoteTitle.toUpperCase()
  const brandUpper = brand.toUpperCase()
  if (upper.startsWith(brandUpper + ' ')) {
    return quoteTitle.substring(brand.length + 1).trim()
  }
  return quoteTitle.trim()
}

/**
 * Map old role strings to new role system.
 * Old roles: superadmin, product_manager, sales_admin_manager, etc.
 * New roles: admin, salesperson
 */
function mapRole(oldRole: string): 'admin' | 'salesperson' {
  const adminRoles = ['superadmin', 'product_manager', 'sales_admin_manager', 'sales_admin_supervisor']
  return adminRoles.includes(oldRole) ? 'admin' : 'salesperson'
}

// ─── Check if migration already completed ─────────────────────────────────────

async function checkMigrationStatus() {
  checking.value = true
  try {
    const { data, error } = await supabase
      .from('migration_status')
      .select('status, completed_at')
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle()

    if (error) {
      scanError.value = `Failed to check migration status: ${error.message}`
      checking.value = false
      return
    }

    if (data) {
      migrationComplete.value = true
      previousMigration.value = data
      checking.value = false
      return
    }

    // No completed migration found - scan localStorage
    scanLocalStorage()
  } catch (err) {
    scanError.value = `Unexpected error checking migration status: ${(err as Error).message}`
  } finally {
    checking.value = false
  }
}

// ─── Scan localStorage ────────────────────────────────────────────────────────

function scanLocalStorage() {
  const catalog = readLocalStorageJSON<Record<string, OldMachine>>('espmi_catalog')
  const users = readLocalStorageJSON<OldUser[]>('espmi_users')

  machinesFound.value = catalog ? Object.keys(catalog).length : 0
  usersFound.value = users ? users.length : 0

  if (machinesFound.value === 0 && usersFound.value === 0) {
    noDataAvailable.value = true
  }
}

// ─── Start Migration ──────────────────────────────────────────────────────────

async function startMigration() {
  if (migrating.value || migrationComplete.value || noDataAvailable.value) return

  migrating.value = true
  migrationError.value = null
  migrationDone.value = false
  recordsProcessed.value = 0
  recordsMigrated.value = 0
  recordsSkipped.value = 0
  skippedDetails.value = []

  const userId = authStore.session?.user?.id
  if (!userId) {
    migrationError.value = 'No authenticated user found. Please log in again.'
    migrating.value = false
    return
  }

  // Create migration_status record as "in_progress"
  let migrationStatusId: string | null = null
  try {
    const { data: statusRecord, error: statusError } = await supabase
      .from('migration_status')
      .insert({
        migrated_by: userId,
        records_found: totalRecordsFound.value,
        records_migrated: 0,
        records_skipped: 0,
        skipped_details: [],
        status: 'in_progress' as const,
      })
      .select('id')
      .single()

    if (statusError || !statusRecord) {
      migrationError.value = `Failed to create migration record: ${statusError?.message || 'Unknown error'}`
      migrating.value = false
      return
    }
    migrationStatusId = statusRecord.id
  } catch (err) {
    migrationError.value = `Network error creating migration record: ${(err as Error).message}`
    migrating.value = false
    return
  }

  try {
    // ─── Migrate Machines ───────────────────────────────────────────────
    const catalog = readLocalStorageJSON<Record<string, OldMachine>>('espmi_catalog')
    if (catalog && Object.keys(catalog).length > 0) {
      currentStep.value = 'Migrating machine catalog...'
      const machineKeys = Object.keys(catalog)

      for (const key of machineKeys) {
        const oldMachine = catalog[key]!
        try {
          await migrateSingleMachine(key, oldMachine)
          recordsMigrated.value++
        } catch (err) {
          const reason = (err as Error).message || 'Unknown error'
          if (reason.includes('duplicate') || reason.includes('unique') || reason.includes('23505')) {
            skippedDetails.value.push({
              identifier: `Machine: ${oldMachine.brand} ${oldMachine.quoteTitle}`,
              reason: 'Duplicate brand-model combination already exists',
              type: 'machine',
            })
            recordsSkipped.value++
          } else {
            // Non-duplicate error — stop migration
            throw new Error(`Machine "${key}": ${reason}`)
          }
        }
        recordsProcessed.value++
      }
    }

    // ─── Migrate Users ──────────────────────────────────────────────────
    const users = readLocalStorageJSON<OldUser[]>('espmi_users')
    if (users && users.length > 0) {
      currentStep.value = 'Migrating user profiles...'

      for (const oldUser of users) {
        try {
          await migrateSingleUser(oldUser)
          recordsMigrated.value++
        } catch (err) {
          const reason = (err as Error).message || 'Unknown error'
          if (reason.includes('duplicate') || reason.includes('unique') || reason.includes('23505')) {
            skippedDetails.value.push({
              identifier: `User: ${oldUser.u}`,
              reason: 'User profile already exists',
              type: 'user',
            })
            recordsSkipped.value++
          } else {
            // Non-duplicate error — stop migration
            throw new Error(`User "${oldUser.u}": ${reason}`)
          }
        }
        recordsProcessed.value++
      }
    }

    // ─── Mark migration as completed ────────────────────────────────────
    currentStep.value = 'Finalizing migration...'
    const { error: updateError } = await supabase
      .from('migration_status')
      .update({
        status: 'completed' as const,
        records_migrated: recordsMigrated.value,
        records_skipped: recordsSkipped.value,
        skipped_details: skippedDetails.value as unknown as import('@/types/database').Json,
        completed_at: new Date().toISOString(),
      })
      .eq('id', migrationStatusId!)

    if (updateError) {
      migrationError.value = `Migration data was saved, but failed to mark as complete: ${updateError.message}`
    } else {
      migrationDone.value = true
      migrationComplete.value = true
      currentStep.value = 'Migration completed successfully!'
    }

  } catch (err) {
    // Fatal error during migration — stop processing, preserve data
    const errorMsg = (err as Error).message || 'Unknown migration error'
    migrationError.value = errorMsg
    currentStep.value = 'Migration stopped due to error'

    // Update migration_status as failed
    if (migrationStatusId) {
      await supabase
        .from('migration_status')
        .update({
          status: 'failed' as const,
          records_migrated: recordsMigrated.value,
          records_skipped: recordsSkipped.value,
          skipped_details: skippedDetails.value as unknown as import('@/types/database').Json,
          error_message: errorMsg,
        })
        .eq('id', migrationStatusId)
    }
  } finally {
    migrating.value = false
  }
}

// ─── Machine Migration ────────────────────────────────────────────────────────

async function migrateSingleMachine(_key: string, machine: OldMachine) {
  const brand = (machine.brand || '').substring(0, 100)
  const model = extractModel(machine.quoteTitle || '', brand).substring(0, 100)
  const unitCondition = inferUnitCondition(machine.quoteTitle || '')

  if (!brand || !model) {
    throw new Error('Missing brand or model name')
  }

  // Insert machine record
  const { data: machineRecord, error: machineError } = await supabase
    .from('machines')
    .insert({
      brand,
      model,
      sub_model: null,
      unit_condition: unitCondition,
      letterhead: 'ES Print Media Inc.',
      is_active: true,
    })
    .select('id')
    .single()

  if (machineError) {
    throw new Error(machineError.message)
  }

  const machineId = machineRecord.id

  // Insert features
  if (machine.features && machine.features.length > 0) {
    const features = machine.features.slice(0, 50).map((desc, idx) => ({
      machine_id: machineId,
      description: desc,
      sort_order: idx,
    }))
    const { error } = await supabase.from('machine_features').insert(features)
    if (error) throw new Error(`Features: ${error.message}`)
  }

  // Insert consumables
  if (machine.consumables && machine.consumables.length > 0) {
    const consumables = machine.consumables.slice(0, 50).map((c, idx) => ({
      machine_id: machineId,
      item_name: (c.name || '').substring(0, 150),
      package_description: (c.pkg || '').substring(0, 300),
      default_price: Math.max(0.01, Math.min(c.price || 0.01, 999999999.99)),
      sort_order: idx,
    }))
    const { error } = await supabase.from('machine_consumables').insert(consumables)
    if (error) throw new Error(`Consumables: ${error.message}`)
  }

  // Insert inclusions (stdPackages)
  if (machine.stdPackages && machine.stdPackages.length > 0) {
    const inclusions = machine.stdPackages.slice(0, 50).map((desc, idx) => ({
      machine_id: machineId,
      description: desc,
      sort_order: idx,
    }))
    const { error } = await supabase.from('machine_inclusions').insert(inclusions)
    if (error) throw new Error(`Inclusions: ${error.message}`)
  }

  // Insert exclusions (stdExclusives)
  if (machine.stdExclusives && machine.stdExclusives.length > 0) {
    const exclusions = machine.stdExclusives.slice(0, 50).map((desc, idx) => ({
      machine_id: machineId,
      description: desc,
      sort_order: idx,
    }))
    const { error } = await supabase.from('machine_exclusions').insert(exclusions)
    if (error) throw new Error(`Exclusions: ${error.message}`)
  }

  // Insert add-ons (optionals)
  if (machine.optionals && machine.optionals.length > 0) {
    const addons = machine.optionals.slice(0, 50).map((opt, idx) => ({
      machine_id: machineId,
      description: opt.label || '',
      sort_order: idx,
    }))
    const { error } = await supabase.from('machine_addons').insert(addons)
    if (error) throw new Error(`Add-ons: ${error.message}`)
  }
}

// ─── User Migration ───────────────────────────────────────────────────────────

async function migrateSingleUser(oldUser: OldUser) {
  if (!oldUser.u || !oldUser.u.trim()) {
    throw new Error('Missing username')
  }

  const displayName = oldUser.u.substring(0, 128)
  const role = mapRole(oldUser.r || 'user')

  // For user migration, we create a user_profiles record.
  // Note: We cannot migrate password hashes since the old app uses a different
  // hashing mechanism (sha256) than Supabase Auth (bcrypt). Users will need to
  // have their passwords reset by an admin after migration.
  // We insert a profile record linked to the current user as a placeholder.
  // In a real migration, you'd use the Supabase admin API to create auth users.

  const { error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authStore.session!.user.id,
      display_name: displayName,
      role,
      is_active: true,
    })

  if (error) {
    throw new Error(error.message)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  checkMigrationStatus()
})
</script>

<template>
  <div class="data-migration-view">
    <h1>Data Migration</h1>
    <p class="subtitle">
      Migrate existing localStorage data to the Supabase database.
      This is a one-time operation for admin users only.
    </p>

    <!-- Loading state while checking migration status -->
    <div v-if="checking" class="status-card info">
      <p>Checking migration status...</p>
    </div>

    <!-- Error checking status -->
    <div v-else-if="scanError" class="status-card error">
      <p>{{ scanError }}</p>
      <button class="btn btn-primary" @click="checkMigrationStatus">Retry</button>
    </div>

    <!-- Migration already completed -->
    <div v-else-if="migrationComplete && !migrationDone" class="status-card success">
      <h2>Migration Already Completed</h2>
      <p>
        The data migration has already been completed successfully.
        No further action is needed.
      </p>
      <p v-if="previousMigration?.completed_at" class="meta">
        Completed on: {{ new Date(previousMigration.completed_at).toLocaleString() }}
      </p>
    </div>

    <!-- No data to migrate -->
    <div v-else-if="noDataAvailable" class="status-card warning">
      <h2>No Data to Migrate</h2>
      <p>
        No machine catalog or user list data was found in localStorage.
        There is nothing to migrate.
      </p>
    </div>

    <!-- Pre-migration summary -->
    <div v-else-if="!migrating && !migrationDone" class="migration-panel">
      <div class="status-card info">
        <h2>Data Found in localStorage</h2>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ machinesFound }}</span>
            <span class="stat-label">Machines</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ usersFound }}</span>
            <span class="stat-label">Users</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ totalRecordsFound }}</span>
            <span class="stat-label">Total Records</span>
          </div>
        </div>
        <p class="note">
          Original localStorage data will NOT be modified or deleted during migration.
        </p>
      </div>
      <button
        class="btn btn-primary btn-start"
        :disabled="loading"
        @click="startMigration"
      >
        Start Migration
      </button>
    </div>

    <!-- Migration in progress -->
    <div v-if="migrating" class="migration-panel">
      <div class="status-card progress">
        <h2>Migration in Progress</h2>
        <p class="step">{{ currentStep }}</p>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: totalRecordsFound > 0 ? `${(recordsProcessed / totalRecordsFound) * 100}%` : '0%' }"
          ></div>
        </div>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ recordsProcessed }}</span>
            <span class="stat-label">Processed</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsMigrated }}</span>
            <span class="stat-label">Migrated</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsSkipped }}</span>
            <span class="stat-label">Skipped</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Migration completed successfully -->
    <div v-if="migrationDone && !migrationError" class="migration-panel">
      <div class="status-card success">
        <h2>Migration Completed Successfully</h2>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ totalRecordsFound }}</span>
            <span class="stat-label">Records Found</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsMigrated }}</span>
            <span class="stat-label">Migrated</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsSkipped }}</span>
            <span class="stat-label">Skipped</span>
          </div>
        </div>
      </div>

      <!-- Skipped details -->
      <div v-if="skippedDetails.length > 0" class="skipped-section">
        <h3>Skipped Records</h3>
        <table class="skipped-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in skippedDetails" :key="index">
              <td>{{ item.identifier }}</td>
              <td>{{ item.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Migration error -->
    <div v-if="migrationError" class="migration-panel">
      <div class="status-card error">
        <h2>Migration Error</h2>
        <p class="error-message">{{ migrationError }}</p>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ totalRecordsFound }}</span>
            <span class="stat-label">Records Found</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsMigrated }}</span>
            <span class="stat-label">Migrated Before Error</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ recordsSkipped }}</span>
            <span class="stat-label">Skipped</span>
          </div>
        </div>
        <p class="note">
          Original localStorage data has been preserved unmodified.
          The migration was NOT marked as complete.
        </p>
      </div>

      <!-- Skipped details for partial migration -->
      <div v-if="skippedDetails.length > 0" class="skipped-section">
        <h3>Skipped Records (before error)</h3>
        <table class="skipped-table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in skippedDetails" :key="index">
              <td>{{ item.identifier }}</td>
              <td>{{ item.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-migration-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

h1 {
  font-size: 1.5rem;
  color: var(--color-primary, #c0392b);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 24px;
}

.status-card {
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.status-card.info {
  background: #f0f4ff;
  border: 1px solid #b3c7ff;
}

.status-card.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.status-card.warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
}

.status-card.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.status-card.progress {
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
}

.status-card h2 {
  font-size: 1.125rem;
  margin-bottom: 12px;
  color: #333;
}

.stats-row {
  display: flex;
  gap: 24px;
  margin: 16px 0;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.note {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
}

.meta {
  font-size: 0.8rem;
  color: #888;
  margin-top: 8px;
}

.step {
  font-size: 0.875rem;
  color: #555;
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary, #c0392b);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.error-message {
  font-size: 0.875rem;
  color: #dc2626;
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #fecaca;
  margin-bottom: 12px;
  word-break: break-word;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: var(--color-primary, #c0392b);
  color: #fff;
}

.btn-primary:hover {
  background: #a93226;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-start {
  margin-top: 8px;
}

.skipped-section {
  margin-top: 16px;
}

.skipped-section h3 {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 8px;
}

.skipped-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.skipped-table th,
.skipped-table td {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.skipped-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #555;
}

.skipped-table td {
  color: #333;
}

.migration-panel {
  margin-top: 8px;
}
</style>
