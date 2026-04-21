import * as XLSX from 'xlsx'
import type { BrokerMonthly } from './types'

const REQUIRED_COLUMNS = [
  'ma_mg', 'ho_ten', 'team', 'chi_nhanh',
  'fee', 'mar_margin', 'mar_3ben', 'mar_ungtruoc', 'mar_tong'
  // 'active' checks both 'CUR_MON_ACTIVE' and 'CUR_MON_OWN_ACTIVE' dynamically, we can check basic
]

export interface ParseResult {
  data: BrokerMonthly[]
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
        
        let targetSheets = wb.SheetNames.filter(name => /^\d{4}-\d{2}$/.test(name))
        
        if (targetSheets.length === 0) {
          if (wb.SheetNames.includes('data')) {
             result.errors.push('Sheet có tên là "data" đang bị lỗi thời. Đổi tên sheet sang chuẩn "YYYY-MM" (VD: 2026-04)')
             return resolve(result)
          } else {
             result.errors.push('Không tìm thấy sheet nào có định dạng tên YYYY-MM (Ví dụ: 2026-04)')
             return resolve(result)
          }
        }

        for (const sheetName of targetSheets) {
          const ws = wb.Sheets[sheetName]
          const month_date = `${sheetName}-01` // e.g., 2026-04-01

          // Start reading from row 4 (row 1=group header, 2=sub-header, 3=field names)
          const raw = (XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: null,
          }) as unknown) as unknown[][]

          const headerRow = raw[2] as string[]
          if (!headerRow) {
            result.errors.push(`Sheet [${sheetName}]: Không tìm thấy dòng tên field (row 3).`)
            continue
          }

          const missing = REQUIRED_COLUMNS.filter(c => !headerRow.includes(c))
          if (missing.length > 0) {
            result.errors.push(`Sheet [${sheetName}]: Thiếu cột: ${missing.join(', ')}`)
            continue
          }

          const hasActive = headerRow.includes('active') || headerRow.includes('CUR_MON_ACTIVE') || headerRow.includes('CUR_MON_OWN_ACTIVE') || headerRow.includes('active_nay')
          if (!hasActive) {
            result.errors.push(`Sheet [${sheetName}]: Thiếu cột active (CUR_MON_ACTIVE / CUR_MON_OWN_ACTIVE)`)
            continue
          }

          const colIdx = Object.fromEntries(headerRow.map((h, i) => [h, i]))

          const dataRows = raw.slice(3)
          result.total += dataRows.length

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
              result.warnings.push(`Sheet [${sheetName}] Dòng ${rowNum}: thiếu mã MG hoặc lấy rỗng, bỏ qua`)
              return
            }

            // Xử lí fallback 'active'
            let rawActive = get('active')
            if (rawActive === null) rawActive = get('CUR_MON_OWN_ACTIVE')
            if (rawActive === null) rawActive = get('CUR_MON_ACTIVE') 
            if (rawActive === null) rawActive = get('active_nay')
            const activeVal = typeof rawActive === 'number' ? rawActive : parseFloat(String(rawActive ?? '0')) || 0

            const broker: BrokerMonthly = {
              month_date,
              ma_mg: ma,
              ho_ten: ten,
              team: String(get('team') ?? get('SALE_GRP_NM') ?? '').trim(), // Fetch real team if field exists
              chi_nhanh: String(get('chi_nhanh') ?? '').trim(),
              fee: Math.round(getNum('fee')),
              mar_margin: Math.round(getNum('mar_margin')),
              mar_3ben: Math.round(getNum('mar_3ben')),
              mar_ungtruoc: Math.round(getNum('mar_ungtruoc')),
              mar_tong: Math.round(getNum('mar_tong')),
              active: Math.round(activeVal),
            }

            result.data.push(broker)
            result.valid++
          })
        }
      } catch (err) {
        result.errors.push(`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`)
      }

      resolve(result)
    }
    reader.readAsBinaryString(file)
  })
}
