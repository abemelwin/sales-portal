import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { supabase } from '@/services/supabase'
import type { ImportResult } from '@/types'

/**
 * Expected column schema for the ESPMI catalog .xlsx import.
 * Columns are matched case-insensitively after trimming whitespace.
 */
const REQUIRED_COLUMNS = ['brand', 'model', 'sub_model', 'unit_condition', 'letterhead'] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_ROW_COUNT = 5000

/**
 * Composable for importing machine catalog data from .xlsx files.
 *
 * Validates file size (≤ 10 MB), row count (≤ 5,000), and column schema.
 * Batch inserts validated records using Supabase upsert with ON CONFLICT
 * on (brand, model, sub_model).
 *
 * Requirements: 4.8, 4.9, 4.10
 */
export function useCatalogImport() {
  const importing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Import machines from an uploaded .xlsx file.
   * @returns ImportResult with counts of added, updated, skipped records and error messages.
   */
  async function importFile(file: File): Promise<ImportResult> {
    importing.value = true
    error.value = null

    const result: ImportResult = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    }

    try {
      // ─── File Size Validation ───────────────────────────────────────────
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        error.value = `File size (${sizeMB} MB) exceeds the maximum allowed size of 10 MB.`
        result.errors.push(error.value)
        return result
      }

      // ─── Parse the .xlsx file ───────────────────────────────────────────
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // Use the first sheet
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        error.value = 'The uploaded file contains no sheets.'
        result.errors.push(error.value)
        return result
      }

      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) {
        error.value = 'Could not read the first sheet from the uploaded file.'
        result.errors.push(error.value)
        return result
      }
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
      })

      // ─── Row Count Validation ───────────────────────────────────────────
      if (rows.length > MAX_ROW_COUNT) {
        error.value = `File contains ${rows.length} rows, which exceeds the maximum of ${MAX_ROW_COUNT} rows.`
        result.errors.push(error.value)
        return result
      }

      if (rows.length === 0) {
        error.value = 'The uploaded file contains no data rows.'
        result.errors.push(error.value)
        return result
      }

      // ─── Column Schema Validation ──────────────────────────────────────
      const firstRow = rows[0]!
      const headerKeys = Object.keys(firstRow).map((k) => k.trim().toLowerCase())
      const missingColumns = REQUIRED_COLUMNS.filter(
        (col) => !headerKeys.includes(col)
      )

      if (missingColumns.length > 0) {
        error.value = `Missing required columns: ${missingColumns.join(', ')}. Expected columns: ${REQUIRED_COLUMNS.join(', ')}.`
        result.errors.push(error.value)
        return result
      }

      // ─── Normalize and Validate Rows ────────────────────────────────────
      const validRecords: Array<{
        brand: string
        model: string
        sub_model: string | null
        unit_condition: string
        letterhead: string
      }> = []

      const validUnitConditions = ['Brand New', 'Re-certified', 'Demo Unit']
      const validLetterheads = ['ES Print Media Inc.', 'ACS / Alternative']

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!
        const rowNum = i + 2 // 1-indexed + header row

        // Normalize column access (case-insensitive)
        const getCol = (name: string): string => {
          const key = Object.keys(row).find(
            (k) => k.trim().toLowerCase() === name
          )
          return key ? String(row[key]).trim() : ''
        }

        const brand = getCol('brand')
        const model = getCol('model')
        const subModel = getCol('sub_model')
        const unitCondition = getCol('unit_condition')
        const letterhead = getCol('letterhead')

        // Validate required fields
        if (!brand) {
          result.skipped++
          result.errors.push(`Row ${rowNum}: Missing required field "brand".`)
          continue
        }

        if (brand.length > 100) {
          result.skipped++
          result.errors.push(`Row ${rowNum}: Brand exceeds 100 characters.`)
          continue
        }

        if (!model) {
          result.skipped++
          result.errors.push(`Row ${rowNum}: Missing required field "model".`)
          continue
        }

        if (model.length > 100) {
          result.skipped++
          result.errors.push(`Row ${rowNum}: Model exceeds 100 characters.`)
          continue
        }

        if (subModel && subModel.length > 100) {
          result.skipped++
          result.errors.push(`Row ${rowNum}: Sub-model exceeds 100 characters.`)
          continue
        }

        if (!unitCondition || !validUnitConditions.includes(unitCondition)) {
          result.skipped++
          result.errors.push(
            `Row ${rowNum}: Invalid unit_condition "${unitCondition}". Must be one of: ${validUnitConditions.join(', ')}.`
          )
          continue
        }

        if (!letterhead || !validLetterheads.includes(letterhead)) {
          result.skipped++
          result.errors.push(
            `Row ${rowNum}: Invalid letterhead "${letterhead}". Must be one of: ${validLetterheads.join(', ')}.`
          )
          continue
        }

        validRecords.push({
          brand,
          model,
          sub_model: subModel || null,
          unit_condition: unitCondition,
          letterhead,
        })
      }

      if (validRecords.length === 0) {
        error.value = 'No valid records found in the file after validation.'
        return result
      }

      // ─── Batch Upsert with ON CONFLICT ──────────────────────────────────
      // Process in batches of 100 to avoid payload limits
      const BATCH_SIZE = 100

      for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
        const batch = validRecords.slice(i, i + BATCH_SIZE)

        // Query existing records to determine added vs updated counts
        const existingBrands = [...new Set(batch.map((r) => r.brand))]
        const { data: existingData } = await supabase
          .from('machines')
          .select('brand, model, sub_model')
          .in('brand', existingBrands)

        const existingSet = new Set(
          (existingData ?? []).map(
            (r) => `${r.brand}|${r.model}|${r.sub_model ?? ''}`
          )
        )

        // Count new vs existing for this batch
        let batchAdded = 0
        let batchUpdated = 0

        for (const record of batch) {
          const key = `${record.brand}|${record.model}|${record.sub_model ?? ''}`
          if (existingSet.has(key)) {
            batchUpdated++
          } else {
            batchAdded++
          }
        }

        // Perform the upsert
        const { error: upsertError } = await supabase
          .from('machines')
          .upsert(
            batch.map((r) => ({
              brand: r.brand,
              model: r.model,
              sub_model: r.sub_model,
              unit_condition: r.unit_condition as 'Brand New' | 'Re-certified' | 'Demo Unit',
              letterhead: r.letterhead as 'ES Print Media Inc.' | 'ACS / Alternative',
              is_active: true as const,
              updated_at: new Date().toISOString(),
            })),
            {
              onConflict: 'brand,model,sub_model',
              ignoreDuplicates: false,
            }
          )

        if (upsertError) {
          // If batch fails, count all as skipped
          result.skipped += batch.length
          result.errors.push(
            `Batch starting at row ${i + 2}: Database error — ${upsertError.message}`
          )
          // Revert the counts we pre-calculated
          continue
        }

        result.added += batchAdded
        result.updated += batchUpdated
      }

      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during import.'
      error.value = message
      result.errors.push(message)
      return result
    } finally {
      importing.value = false
    }
  }

  return {
    importFile,
    importing,
    error,
  }
}
