import { ref } from 'vue'

export interface ModalOptions {
  title?: string
  message: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  type?: 'confirm' | 'prompt'
}

const isOpen = ref(false)
const modalOptions = ref<ModalOptions>({ message: '', type: 'confirm' })
const promptInputValue = ref('')
const inputError = ref('')

let resolvePromise: ((value: any) => void) | null = null

export function useModal() {
  function confirm(options: string | ModalOptions): Promise<boolean> {
    const opts: ModalOptions = typeof options === 'string'
      ? { message: options, type: 'confirm', confirmText: 'Confirm', cancelText: 'Cancel' }
      : { confirmText: 'Confirm', cancelText: 'Cancel', ...options, type: 'confirm' }

    modalOptions.value = opts
    inputError.value = ''
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function prompt(options: string | ModalOptions): Promise<string | null> {
    const opts: ModalOptions = typeof options === 'string'
      ? { message: options, type: 'prompt', confirmText: 'OK', cancelText: 'Cancel' }
      : { confirmText: 'OK', cancelText: 'Cancel', ...options, type: 'prompt' }

    modalOptions.value = opts
    promptInputValue.value = opts.defaultValue || ''
    inputError.value = ''
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise) {
      if (modalOptions.value.type === 'prompt') {
        resolvePromise(promptInputValue.value)
      } else {
        resolvePromise(true)
      }
      resolvePromise = null
    }
  }

  function handleCancel() {
    isOpen.value = false
    if (resolvePromise) {
      if (modalOptions.value.type === 'prompt') {
        resolvePromise(null)
      } else {
        resolvePromise(false)
      }
      resolvePromise = null
    }
  }

  return {
    isOpen,
    modalOptions,
    promptInputValue,
    inputError,
    confirm,
    prompt,
    handleConfirm,
    handleCancel,
  }
}
