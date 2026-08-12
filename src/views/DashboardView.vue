<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuth } from '@/composables/useAuth'
import { useRealtime } from '@/composables/useRealtime'
import { useRealtimeStore } from '@/stores/realtime'

const dashboardStore = useDashboardStore()
const realtimeStore = useRealtimeStore()
const { role } = useAuth()

// Subscribe to 'quotes' table for live count updates (Requirement 3.5)
const { subscribe, unsubscribe } = useRealtime('quotes', () => {
  // On any quote change, re-fetch dashboard counts
  dashboardStore.fetchCounts()
})

// Fetch dashboard data and subscribe to realtime on mount
onMounted(() => {
  dashboardStore.fetchCounts()
  subscribe()
})

onUnmounted(() => {
  unsubscribe()
})

function handleRetry() {
  dashboardStore.fetchCounts()
}
</script>

<template>
  <div class="dashboard-view">
    <h1 class="dashboard-title">Dashboard</h1>

    <!-- Stale data warning when realtime connection is lost (Requirement 3.7) -->
    <div
      v-if="realtimeStore.isConnectionLost"
      class="stale-data-warning"
      role="alert"
      aria-live="polite"
    >
      <span class="warning-icon" aria-hidden="true">⚠</span>
      <span v-if="realtimeStore.hasPersistentError">
        Real-time connection lost. Displayed data may be outdated. Please refresh the page.
      </span>
      <span v-else>
        Real-time connection interrupted. Data may be stale. Attempting to reconnect...
      </span>
    </div>

    <!-- Error state with Retry button (Requirement 3.6) -->
    <div
      v-if="dashboardStore.error"
      class="dashboard-error"
      role="alert"
      aria-live="assertive"
    >
      <p class="error-message">{{ dashboardStore.error }}</p>
      <button class="retry-button" @click="handleRetry">
        Retry
      </button>
    </div>

    <!-- Data cards section (Requirements 3.2, 3.3) -->
    <section v-else class="dashboard-cards" aria-label="Dashboard statistics">
      <!-- Monthly quote count card (Requirement 3.2) -->
      <div class="data-card">
        <span class="data-card-count">{{ dashboardStore.monthlyQuoteCount }}</span>
        <span class="data-card-label">Quotes This Month</span>
      </div>

      <!-- Active user count card — admin only (Requirement 3.3) -->
      <div v-if="role === 'superadmin'" class="data-card">
        <span class="data-card-count">{{ dashboardStore.activeUserCount }}</span>
        <span class="data-card-label">Active Users</span>
      </div>
    </section>

    <!-- Navigation shortcuts (Requirement 3.4) -->
    <section class="dashboard-shortcuts" aria-label="Quick navigation">
      <h2 class="shortcuts-title">Quick Access</h2>
      <nav class="shortcuts-grid">
        <RouterLink to="/quotes/new" class="shortcut-link">
          <span class="shortcut-icon" aria-hidden="true">📝</span>
          <span class="shortcut-label">Quote Builder</span>
        </RouterLink>
        <RouterLink to="/pricelist" class="shortcut-link">
          <span class="shortcut-icon" aria-hidden="true">🖨</span>
          <span class="shortcut-label">Machine Pricelist</span>
        </RouterLink>
        <RouterLink to="/consumables" class="shortcut-link">
          <span class="shortcut-icon" aria-hidden="true">🧴</span>
          <span class="shortcut-label">Consumables Pricelist</span>
        </RouterLink>
      </nav>
    </section>

    <!-- Loading state -->
    <div v-if="dashboardStore.loading" class="dashboard-loading" aria-live="polite">
      Loading dashboard data...
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  padding: var(--space-6);
}

.dashboard-title {
  font-size: var(--font-size-2xl);
  color: var(--color-gray-900);
  margin-bottom: var(--space-6);
}

/* Stale data warning banner */
.stale-data-warning {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  color: var(--color-gray-800);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.warning-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

/* Error state */
.dashboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  text-align: center;
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-base);
  margin: 0;
}

.retry-button {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.retry-button:hover {
  background-color: var(--color-primary-hover);
}

/* Data cards */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.data-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.data-card:hover {
  box-shadow: var(--shadow-md);
}

.data-card-count {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.data-card-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  text-align: center;
}

/* Navigation shortcuts */
.dashboard-shortcuts {
  margin-top: var(--space-6);
}

.shortcuts-title {
  font-size: var(--font-size-lg);
  color: var(--color-gray-700);
  margin-bottom: var(--space-4);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.shortcut-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  background-color: var(--color-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-gray-700);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.shortcut-link:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.shortcut-icon {
  font-size: var(--font-size-2xl);
}

.shortcut-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: center;
}

/* Loading state */
.dashboard-loading {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

/* Mobile responsiveness */
@media screen and (max-width: 767px) {
  .dashboard-view {
    padding: var(--space-4);
  }

  .dashboard-cards {
    grid-template-columns: 1fr;
  }

  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
