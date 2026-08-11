import { ref, computed } from 'vue'

const DEFAULT_PAGE_SIZE = 25

export interface PaginationOptions {
  pageSize?: number
}

/**
 * Reactive offset-based pagination state for use with Supabase `.range()` queries.
 * 
 * @param options - Optional configuration (pageSize defaults to 25)
 * @returns Reactive pagination state, computed helpers, and action methods
 * 
 * Requirements: 7.1
 */
export function usePagination(options: PaginationOptions = {}) {
  const pageSize = ref(options.pageSize ?? DEFAULT_PAGE_SIZE)
  const currentPage = ref(1)
  const totalCount = ref(0)

  // ─── Computed ───────────────────────────────────────────────────────────────

  /** Offset for Supabase .range() queries: (currentPage - 1) * pageSize */
  const offset = computed(() => (currentPage.value - 1) * pageSize.value)

  /** Total number of pages based on totalCount and pageSize */
  const totalPages = computed(() =>
    totalCount.value > 0 ? Math.ceil(totalCount.value / pageSize.value) : 1
  )

  // ─── Actions ────────────────────────────────────────────────────────────────

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

  function goToPage(page: number) {
    const target = Math.max(1, Math.min(page, totalPages.value))
    currentPage.value = target
  }

  function setTotalCount(count: number) {
    totalCount.value = count
    // Ensure currentPage is still valid after total count changes
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  }

  return {
    // State
    currentPage,
    pageSize,
    totalCount,

    // Computed
    offset,
    totalPages,

    // Actions
    nextPage,
    prevPage,
    goToPage,
    setTotalCount,
  }
}
