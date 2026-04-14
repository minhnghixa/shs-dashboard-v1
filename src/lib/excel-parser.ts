import * as XLSX from 'xlsx'
import type { Broker } from './types'

const REQUIRED_COLUMNS = [
  'ma_mg', 'ho_ten', 'team', 'chi_nhanh',
  'fee_truoc', 'fee_nay', 'fee_tuyet_doi', 'fee_pct',
  'mar_margin_truoc', 'mar_3ben_truoc', 'mar_ungtruoc_truoc', 'mar_tong_truoc',
  'mar_margin_nay', 'mar_3ben_nay', 'mar_ungtruoc_nay', 'mar_tong_nay',
  'mar_tuyet_doi', 'mar_pct',
  'active_truoc', 'active_nay', 'active_tuyet_doi', 'active_pct',
]

export interface ParseResult {
  data: Broker[]
  errors: string[]
  warnings: string[]
  total: number
  valid: number
}

export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result: ParseResult = { data: [], errors: [], warnings: [], total: 0, valid: 0 }

      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' })

        // Find sheet named 'data' (our normalized export)
        const sheetName = wb.SheetNames.includes('data') ? 'data' : wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]

        // Start reading from row 4 (row 1=group header, 2=sub-header, 3=field names)
        // Use row 3 (field names) as header
        const raw = (XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
        }) as unknown) as unknown[][]

        // Find the field-name row (row index 2 = row 3 in Excel)
        const headerRow = raw[2] as string[]
        if (!headerRow) {
          result.errors.push('Không tìm thấy dòng tên field (row 3). File có đúng định dạng không?')
          resolve(result)
          return
        }

        // Check required columns
        const missing = REQUIRED_COLUMNS.filter(c => !headerRow.includes(c))
        if (missing.length > 0) {
          result.errors.push(`Thiếu các cột: ${missing.join(', ')}`)
          resolve(result)
          return
        }

        const colIdx = Object.fromEntries(headerRow.map((h, i) => [h, i]))

        // Data starts from row index 3 (row 4 in Excel)
        const dataRows = raw.slice(3)
        result.total = dataRows.length

        dataRows.forEach((row, i) => {
          const rowNum = i + 4
          if (!row || row.every(v => v === null || v === '')) return

          const get = (col: string) => row[colIdx[col]] ?? null
          const getNum = (col: string): number => {
            const v = get(col)
            return typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0
          }

          const ma = String(get('ma_mg') ?? '').trim().toUpperCase()
          const ten = String(get('ho_ten') ?? '').trim()

          if (!ma || !ten) {
            result.warnings.push(`Dòng ${rowNum}: thiếu mã MG hoặc họ tên, bỏ qua`)
            return
          }

          const broker: Broker = {
            ma_mg: ma,
            ho_ten: ten,
            team: String(get('team') ?? '').trim(),
            chi_nhanh: String(get('chi_nhanh') ?? '').trim(),
            fee_truoc: Math.round(getNum('fee_truoc')),
            fee_nay: Math.round(getNum('fee_nay')),
            fee_tuyet_doi: Math.round(getNum('fee_tuyet_doi')),
            fee_pct: get('fee_pct') !== null ? Math.round(getNum('fee_pct') * 100) / 100 : null,
            mar_margin_truoc: Math.round(getNum('mar_margin_truoc')),
            mar_3ben_truoc: Math.round(getNum('mar_3ben_truoc')),
            mar_ungtruoc_truoc: Math.round(getNum('mar_ungtruoc_truoc')),
            mar_tong_truoc: Math.round(getNum('mar_tong_truoc')),
            mar_margin_nay: Math.round(getNum('mar_margin_nay')),
            mar_3ben_nay: Math.round(getNum('mar_3ben_nay')),
            mar_ungtruoc_nay: Math.round(getNum('mar_ungtruoc_nay')),
            mar_tong_nay: Math.round(getNum('mar_tong_nay')),
            mar_tuyet_doi: Math.round(getNum('mar_tuyet_doi')),
            mar_pct: get('mar_pct') !== null ? Math.round(getNum('mar_pct') * 100) / 100 : null,
            active_truoc: Math.round(getNum('active_truoc')),
            active_nay: Math.round(getNum('active_nay')),
            active_tuyet_doi: Math.round(getNum('active_tuyet_doi')),
            active_pct: get('active_pct') !== null ? Math.round(getNum('active_pct') * 100) / 100 : null,
          }

          result.data.push(broker)
          result.valid++
        })
      } catch (err) {
        result.errors.push(`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`)
      }

      resolve(result)
    }
    reader.readAsBinaryString(file)
  })
}
