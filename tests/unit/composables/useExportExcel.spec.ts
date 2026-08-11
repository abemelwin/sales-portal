import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExportExcel, MAX_EXPORT_ROWS } from '@/composables/useExportExcel'

// Mock the xlsx module
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

import * as XLSX from 'xlsx'

describe('useExportExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when data is empty (Requirement 6.7)', () => {
    const { exportToExcel } = useExportExcel()
    const result = exportToExcel([])

    expect(result.success).toBe(false)
    expect(result.error).toBe('No data available to export')
  })

  it('returns error when data is null/undefined (Requirement 6.7)', () => {
    const { exportToExcel } = useExportExcel()
    const result = exportToExcel(null as unknown as Record<string, unknown>[])

    expect(result.success).toBe(false)
    expect(result.error).toBe('No data available to export')
  })

  it('generates .xlsx file with correct data', () => {
    const { exportToExcel } = useExportExcel()
    const data = [
      { Brand: 'Epson', Model: 'L3210', Price: 5999 },
      { Brand: 'Canon', Model: 'G3010', Price: 6499 },
    ]

    const result = exportToExcel(data, { filename: 'test', sheetName: 'Machines' })

    expect(result.success).toBe(true)
    expect(result.rowsExported).toBe(2)
    expect(result.truncated).toBe(false)
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data)
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test.xlsx')
  })

  it('uses default filename and sheet name when not specified', () => {
    const { exportToExcel } = useExportExcel()
    const data = [{ Name: 'Test' }]

    exportToExcel(data)

    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'export.xlsx')
  })

  it('caps export at MAX_EXPORT_ROWS (10,000) and flags truncation', () => {
    const { exportToExcel } = useExportExcel()
    // Generate data exceeding the limit
    const data = Array.from({ length: MAX_EXPORT_ROWS + 500 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }))

    const result = exportToExcel(data)

    expect(result.success).toBe(true)
    expect(result.rowsExported).toBe(MAX_EXPORT_ROWS)
    expect(result.truncated).toBe(true)
    // Verify only MAX_EXPORT_ROWS were passed to sheet generation
    const passedData = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(passedData.length).toBe(MAX_EXPORT_ROWS)
  })

  it('supports exactly MAX_EXPORT_ROWS without truncation', () => {
    const { exportToExcel } = useExportExcel()
    const data = Array.from({ length: MAX_EXPORT_ROWS }, (_, i) => ({
      id: i,
    }))

    const result = exportToExcel(data)

    expect(result.success).toBe(true)
    expect(result.rowsExported).toBe(MAX_EXPORT_ROWS)
    expect(result.truncated).toBe(false)
  })

  it('remaps column headers when columnHeaders option is provided', () => {
    const { exportToExcel } = useExportExcel()
    const data = [
      { brand: 'Epson', model: 'L3210', unit_condition: 'Brand New' },
    ]

    exportToExcel(data, {
      columnHeaders: {
        brand: 'Brand',
        model: 'Model',
        unit_condition: 'Unit Condition',
      },
    })

    const passedData = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(passedData[0]).toEqual({
      Brand: 'Epson',
      Model: 'L3210',
      'Unit Condition': 'Brand New',
    })
  })

  it('handles generation failure with error notification (Requirement 6.8)', () => {
    const { exportToExcel } = useExportExcel()
    // Make writeFile throw
    ;(XLSX.writeFile as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('File system access denied')
    })

    const data = [{ Name: 'Test' }]
    const result = exportToExcel(data)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Export failed')
    expect(result.error).toContain('File system access denied')
  })

  it('handles non-Error exceptions gracefully (Requirement 6.8)', () => {
    const { exportToExcel } = useExportExcel()
    ;(XLSX.writeFile as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw 'unexpected error'
    })

    const data = [{ Name: 'Test' }]
    const result = exportToExcel(data)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Export failed. Please try again.')
  })

  it('exports MAX_EXPORT_ROWS constant as 10000', () => {
    expect(MAX_EXPORT_ROWS).toBe(10_000)
  })
})
