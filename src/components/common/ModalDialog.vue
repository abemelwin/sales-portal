<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useModal } from '@/composables/useModal'

const {
  isOpen,
  modalOptions,
  promptInputValue,
  handleConfirm,
  handleCancel,
} = useModal()

const inputRef = ref<HTMLInputElement | null>(null)

watch(isOpen, (newVal) => {
  if (newVal && modalOptions.value.type === 'prompt') {
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    handleCancel()
  } else if (e.key === 'Enter') {
    handleConfirm()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        @click.self="handleCancel"
        @keydown="onKeydown"
        tabindex="-1"
      >
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Header icon & title -->
          <div class="modal-header">
            <div class="modal-icon-badge" :class="{ 'modal-icon-badge--danger': modalOptions.isDanger }">
              <svg v-if="modalOptions.type === 'prompt'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <svg v-else-if="modalOptions.isDanger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 class="modal-title">
              {{ modalOptions.title || (modalOptions.type === 'prompt' ? 'Input Required' : 'Confirmation') }}
            </h3>
          </div>

          <!-- Body content -->
          <div class="modal-body">
            <p class="modal-message">{{ modalOptions.message }}</p>

            <div v-if="modalOptions.type === 'prompt'" class="modal-input-group">
              <input
                ref="inputRef"
                v-model="promptInputValue"
                type="text"
                class="modal-input"
                :placeholder="modalOptions.placeholder || 'Type here...'"
                @keyup.enter="handleConfirm"
              />
            </div>
          </div>

          <!-- Action buttons -->
          <div class="modal-footer">
            <button
              type="button"
              class="modal-btn modal-btn--cancel"
              @click="handleCancel"
            >
              {{ modalOptions.cancelText || 'Cancel' }}
            </button>
            <button
              type="button"
              class="modal-btn modal-btn--confirm"
              :class="{ 'modal-btn--danger': modalOptions.isDanger }"
              @click="handleConfirm"
            >
              {{ modalOptions.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 1rem;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 12px 24px;
}

.modal-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  flex-shrink: 0;
}

.modal-icon-badge--danger {
  background: #fef2f2;
  color: #dc2626;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-body {
  padding: 0 24px 20px 24px;
}

.modal-message {
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

.modal-input-group {
  margin-top: 10px;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.modal-input:focus {
  background: #ffffff;
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.15);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.modal-btn {
  padding: 9px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.modal-btn--cancel {
  background: #ffffff;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.modal-btn--cancel:hover {
  background: #f1f5f9;
  color: #334155;
}

.modal-btn--confirm {
  background: #c0392b;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(192, 57, 43, 0.2);
}

.modal-btn--confirm:hover {
  background: #a93226;
}

.modal-btn--danger {
  background: #dc2626;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.modal-btn--danger:hover {
  background: #b91c1c;
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
