<script setup lang="ts">
import { computed } from 'vue'
import { useRealtimeStore } from '@/stores/realtime'

/**
 * Non-blocking connectivity warning/error banner.
 *
 * Displays one of two states:
 * 1. Warning (yellow): Connection lost, reconnection in progress — data may be outdated
 *    (Requirement 11.4)
 * 2. Error (red): All reconnection attempts exhausted — user must refresh page
 *    (Requirement 11.6)
 *
 * Requirements: 11.4, 11.5, 11.6
 */

const realtimeStore = useRealtimeStore()

const showBanner = computed(() => realtimeStore.isConnectionLost || realtimeStore.hasPersistentError)

const bannerType = computed<'warning' | 'error'>(() => {
  if (realtimeStore.hasPersistentError) return 'error'
  return 'warning'
})

const bannerMessage = computed(() => {
  if (realtimeStore.hasPersistentError) {
    return realtimeStore.error ?? 'Real-time connection lost. Please refresh the page to restore live updates.'
  }
  return 'Connection interrupted — displayed data may be outdated. Attempting to reconnect...'
})

function handleRefresh() {
  window.location.reload()
}
</script>

<template>
  <Transition name="banner-slide">
    <div
      v-if="showBanner"
      class="connectivity-banner"
      :class="`connectivity-banner--${bannerType}`"
      role="alert"
      aria-live="polite"
    >
      <div class="connectivity-banner__content">
        <span class="connectivity-banner__icon" aria-hidden="true">
          <svg v-if="bannerType === 'warning'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </span>
        <p class="connectivity-banner__message">{{ bannerMessage }}</p>
      </div>
      <button
        v-if="bannerType === 'error'"
        class="connectivity-banner__action"
        @click="handleRefresh"
      >
        Refresh Page
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.connectivity-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid transparent;
  z-index: 1000;
}

.connectivity-banner--warning {
  background-color: var(--color-warning-light);
  border-bottom-color: var(--color-warning);
}

.connectivity-banner--error {
  background-color: var(--color-error-light);
  border-bottom-color: var(--color-error);
}

.connectivity-banner__content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.connectivity-banner__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.connectivity-banner--warning .connectivity-banner__icon {
  color: var(--color-warning);
}

.connectivity-banner--error .connectivity-banner__icon {
  color: var(--color-error);
}

.connectivity-banner__message {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: 1.4;
}

.connectivity-banner--warning .connectivity-banner__message {
  color: var(--color-gray-800);
}

.connectivity-banner--error .connectivity-banner__message {
  color: var(--color-error);
}

.connectivity-banner__action {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-white);
  background-color: var(--color-error);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  min-height: 32px;
  min-width: auto;
}

.connectivity-banner__action:hover {
  background-color: #b91c1c;
}

.connectivity-banner__action:focus-visible {
  outline: 2px solid var(--color-error);
  outline-offset: 2px;
}

/* Transition animation */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: transform var(--transition-base), opacity var(--transition-base);
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Print: hide banner */
@media print {
  .connectivity-banner {
    display: none !important;
  }
}
</style>
