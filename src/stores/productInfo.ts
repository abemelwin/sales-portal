import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { ProductInfoLink } from '@/types'

export const useProductInfoStore = defineStore('productInfo', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const productLinks = ref<ProductInfoLink[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all product info links (Requirement 9.1, 9.2).
   */
  async function fetchLinks(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('product_info_links')
        .select('*')
        .order('display_name')

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      productLinks.value = (data as ProductInfoLink[]) ?? []
    } catch (err) {
      error.value = 'An unexpected error occurred while fetching product info links.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Add a new product info link (Requirement 9.5, 9.6).
   */
  async function addLink(
    machineId: string,
    displayName: string,
    url: string,
    docType: string
  ): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Client-side validation (Requirement 9.5)
      if (displayName.length < 1 || displayName.length > 150) {
        error.value = 'Display name must be between 1 and 150 characters.'
        return { success: false, error: error.value }
      }

      if (url.length > 2048) {
        error.value = 'URL must not exceed 2048 characters.'
        return { success: false, error: error.value }
      }

      // Basic URL format validation
      try {
        new URL(url)
      } catch {
        error.value = 'Please provide a valid URL.'
        return { success: false, error: error.value }
      }

      const { error: insertError } = await supabase
        .from('product_info_links')
        .insert({
          machine_id: machineId,
          display_name: displayName,
          url,
          document_type: docType,
        })

      if (insertError) {
        error.value = insertError.message
        return { success: false, error: insertError.message }
      }

      // Refresh links
      await fetchLinks()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while adding the product info link.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Edit an existing product info link (Requirement 9.5).
   */
  async function editLink(
    id: string,
    data: { display_name?: string; url?: string; document_type?: string }
  ): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      // Validate if provided
      if (data.display_name !== undefined) {
        if (data.display_name.length < 1 || data.display_name.length > 150) {
          error.value = 'Display name must be between 1 and 150 characters.'
          return { success: false, error: error.value }
        }
      }

      if (data.url !== undefined) {
        if (data.url.length > 2048) {
          error.value = 'URL must not exceed 2048 characters.'
          return { success: false, error: error.value }
        }
        try {
          new URL(data.url)
        } catch {
          error.value = 'Please provide a valid URL.'
          return { success: false, error: error.value }
        }
      }

      const { error: updateError } = await supabase
        .from('product_info_links')
        .update(data)
        .eq('id', id)

      if (updateError) {
        error.value = updateError.message
        return { success: false, error: updateError.message }
      }

      // Refresh links
      await fetchLinks()
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while editing the product info link.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a product info link (Requirement 9.5).
   */
  async function deleteLink(id: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('product_info_links')
        .delete()
        .eq('id', id)

      if (deleteError) {
        error.value = deleteError.message
        return { success: false, error: deleteError.message }
      }

      // Remove from local state
      productLinks.value = productLinks.value.filter((link) => link.id !== id)
      return { success: true }
    } catch (err) {
      error.value = 'An unexpected error occurred while deleting the product info link.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Public Interface ───────────────────────────────────────────────────────

  return {
    // State
    productLinks,
    loading,
    error,

    // Actions
    fetchLinks,
    addLink,
    editLink,
    deleteLink,
  }
})
