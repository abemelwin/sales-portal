<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const hasUpdate = ref(false)
const isRefreshing = ref(false)
const currentVersion = import.meta.env.VITE_BUILD_TIME || String(Date.now())

let checkInterval: any = null

async function checkServerVersion() {
  try {
    // Fetch version.json bypassing browser cache using timestamp query param
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) return

    const data = await res.json()
    if (data && data.version && String(data.version) !== String(currentVersion)) {
      hasUpdate.value = true
    }
  } catch (err) {
    // Ignore fetch errors (e.g. offline)
  }
}

function handleRefresh() {
  isRefreshing.value = true
  window.location.reload()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && !hasUpdate.value) {
    checkServerVersion()
  }
}

onMounted(() => {
  // Initial check after 5 seconds
  setTimeout(checkServerVersion, 5000)

  // Periodic check every 30 seconds
  checkInterval = setInterval(checkServerVersion, 30000)

  // Check on tab focus
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="hasUpdate" class="update-banner" role="alert">
      <div class="update-content">
        <span class="update-icon">🚀</span>
        <span class="update-text">
          <strong>May bagong update sa system!</strong> I-click ang button para i-load ang latest version.
        </span>
      </div>
      <button class="update-btn" :disabled="isRefreshing" @click="handleRefresh">
        {{ isRefreshing ? 'Updating...' : '🔄 Click to Update' }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  color: #ffffff;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(192, 57, 43, 0.4);
  animation: pulse-border 2s infinite;
}

.update-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.update-icon {
  font-size: 18px;
}

.update-text strong {
  font-weight: 700;
}

.update-btn {
  background: #ffffff;
  color: #c0392b;
  border: none;
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.update-btn:hover {
  background: #fff0f0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.update-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Transitions & Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@keyframes pulse-border {
  0% { box-shadow: 0 4px 16px rgba(192, 57, 43, 0.4); }
  50% { box-shadow: 0 4px 24px rgba(192, 57, 43, 0.7); }
  100% { box-shadow: 0 4px 16px rgba(192, 57, 43, 0.4); }
}

@media screen and (max-width: 600px) {
  .update-banner {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 8px 12px;
  }
  
  .update-content {
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .update-btn {
    width: 100%;
  }
}
</style>
