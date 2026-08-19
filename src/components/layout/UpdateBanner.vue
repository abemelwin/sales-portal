<script setup lang="ts">
import { useVersionCheck } from '@/composables/useVersionCheck'

const { hasUpdate, reloadToUpdate } = useVersionCheck()
</script>

<template>
  <transition name="banner-slide">
    <div v-if="hasUpdate" class="system-update-banner" role="alert" aria-live="assertive">
      <div class="update-banner-content">
        <span class="update-icon">🚀</span>
        <div class="update-text">
          <strong>A new version of the Sales Portal is available!</strong>
          <span class="update-subtext">Please update to load the latest features, fixes, and improvements.</span>
        </div>
      </div>
      <button class="update-action-btn" @click="reloadToUpdate">
        🔄 Update to Latest Version
      </button>
    </div>
  </transition>
</template>

<style scoped>
.system-update-banner {
  position: sticky;
  top: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  font-family: system-ui, -apple-system, sans-serif;
  flex-wrap: wrap;
}

.update-banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-icon {
  font-size: 20px;
  animation: pulse 1.5s infinite;
}

.update-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

.update-subtext {
  font-size: 12px;
  opacity: 0.9;
}

.update-action-btn {
  padding: 8px 18px;
  background: #ffffff;
  color: #1e40af;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.update-action-btn:hover {
  background: #f8fafc;
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.update-action-btn:active {
  transform: translateY(0);
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@media (max-width: 640px) {
  .system-update-banner {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .update-banner-content {
    justify-content: center;
  }
  .update-action-btn {
    width: 100%;
  }
}
</style>
