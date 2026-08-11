import * as XLSX from 'xlsx'

/** Maximum number of data rows supported for Excel export (Requirement 6.5) */
export const MAX_EXPORT_ROWS = 10_000

export interface ExportExcelOptions {
  /** Filename without extension. Defaults to 'export'. */
  filename?: string
  /** Sheet name in the workbook. Defaults to 'Sheet1'. */
  sheetName?: string
  /** Custom column headers. If provided, keys in data are mapped to these display headers. */
  columnHeaders?: Record<string, string>
}

export interface ExportExcelResult {
  success: boolean
  error?: string
  /** Number of rows actually exported (may be capped at MAX_EXPORT_ROWS) */
  rowsExported?: number
  /** Whether data was truncated to fit the row limit */
  truncated?: boolean
}

/**
 * Composable for generating and downloading .xlsx files via SheetJS.
 *
 * - Generates .xlsx with column headers matching visible table columns (Req 6.5)
 * - Supports up to 10,000 rows (Req 6.5)
 * - Shows "No data available to export" when data is empty (Req 6.7)
 * - Handles generation failure with error notification (Req 6.8)
 */
export function useExportExcel() {
  /**
   * Export an array of row objects to an .xlsx file.
   *
   * @param data - Array of row objects to export. Keys become column headers.
   * @param options - Export configuration (filename, sheet name, column headers).
   * @returns Result object indicating success/failure with details.
   */
  function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    options: ExportExcelOptions = {}
  ): ExportExcelResult {
    const { filename = 'export', sheetName = 'Sheet1', columnHeaders } = options

    // Guard: no data available (Requirement 6.7)
    if (!data || data.length === 0) {
      return { success: false, error: 'No data available to export' }
    }

    try {
      // Cap at MAX_EXPORT_ROWS to prevent performance issues (Requirement 6.5)
      const truncated = data.length > MAX_EXPORT_ROWS
      const exportData = truncated ? data.slice(0, MAX_EXPORT_ROWS) : data

      // If custom column headers are provided, remap keys to display names
      let sheetData: Record<string, unknown>[]
      if (columnHeaders) {
        sheetData = exportData.map((row) => {
          const mappedRow: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(row)) {
            const header = columnHeaders[key] ?? key
            mappedRow[header] = value
          }
          return mappedRow
        })
      } else {
        sheetData = exportData as Record<string, unknown>[]
      }

      const worksheet = XLSX.utils.json_to_sheet(sheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      XLSX.writeFile(workbook, `${filename}.xlsx`)

      return {
        success: true,
        rowsExported: exportData.length,
        truncated,
      }
    } catch (err) {
      // Requirement 6.8: Handle generation failure with error notification
      const message =
        err instanceof Error
          ? `Export failed: ${err.message}. Please try again.`
          : 'Export failed. Please try again.'
      return {
        success: false,
        error: message,
      }
    }
  }

  return { exportToExcel }
}
