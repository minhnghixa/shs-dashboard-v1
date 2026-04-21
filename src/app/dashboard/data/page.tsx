'use client'
import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { parseExcel, type ParseResult } from '@/lib/excel-parser'
import type { BrokerMonthly } from '@/lib/types'
import { fmtVND, fmtPct, pctColor, cn } from '@/lib/utils'
import { Upload, CheckCircle2, AlertCircle, Info, FileSpreadsheet, RefreshCw, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'idle' | 'parsing' | 'preview' | 'uploading' | 'done' | 'error'

function StatusBadge({ type, children }: { type: 'success' | 'error' | 'warning' | 'info'; children: React.ReactNode }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error:   'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info:    'bg-blue-50 text-blue-700 border-blue-200',
  }
  const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertCircle, info: Info }
  const Icon = icons[type]
  return (
    <div className={cn('flex items-start gap-2 p-3 rounded-lg border text-xs', styles[type])}>
      <Icon size={14} className="flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

function PreviewTable({ data }: { data: BrokerMonthly[] }) {
  const preview = data.slice(0, 10)
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['Tháng','Mã MG','Họ và tên','Team','Chi nhánh','Phí net','Tổng DN','TK Active'].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {preview.map((b, i) => (
            <tr key={`${b.month_date}-${b.ma_mg}`} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-slate-400 font-medium">{b.month_date}</td>
              <td className="px-3 py-2 font-mono text-slate-600">{b.ma_mg}</td>
              <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">{b.ho_ten}</td>
              <td className="px-3 py-2 text-slate-500 max-w-[180px] truncate">{b.team}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{b.chi_nhanh}</td>
              <td className="px-3 py-2 text-right font-medium text-slate-700">{fmtVND(b.fee)}</td>
              <td className="px-3 py-2 text-right text-slate-600">{fmtVND(b.mar_tong)}</td>
              <td className="px-3 py-2 text-right text-slate-600">{b.active}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-200 text-center">
          Hiển thị 10/{data.length} dòng — tất cả {data.length} sẽ được import
        </div>
      )}
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { key: 'idle',      label: 'Chọn file' },
    { key: 'preview',   label: 'Xem trước' },
    { key: 'done',      label: 'Hoàn thành' },
  ]
  const idx = current === 'done' ? 2 : current === 'preview' || current === 'uploading' ? 1 : 0
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300',
            i < idx ? 'bg-brand-600 text-white' :
            i === idx ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300' :
            'bg-slate-100 text-slate-400'
          )}>
            {i < idx ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <span className={cn('ml-2 text-xs font-medium', i === idx ? 'text-slate-700' : 'text-slate-400')}>{s.label}</span>
          {i < steps.length - 1 && <div className={cn('w-12 h-px mx-3', i < idx ? 'bg-brand-300' : 'bg-slate-200')} />}
        </div>
      ))}
    </div>
  )
}

export default function DataPage() {
  const queryClient = useQueryClient()
  const [step, setStep]           = useState<Step>('idle')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName]   = useState('')
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadErr, setUploadErr] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setUploadErr('Chỉ chấp nhận file .xlsx hoặc .xls')
      return
    }
    setFileName(file.name)
    setStep('parsing')
    setUploadErr('')
    setUploadMsg('')
    try {
      const result = await parseExcel(file)
      setParseResult(result)
      setStep(result.errors.length > 0 ? 'error' : 'preview')
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : 'Lỗi không xác định')
      setStep('error')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (!parseResult?.data.length) return
    setStep('uploading')
    setUploadErr('')
    try {
      const sb = createClient()
      // Upsert in batches of 50
      const batches: BrokerMonthly[][] = []
      for (let i = 0; i < parseResult.data.length; i += 50) batches.push(parseResult.data.slice(i, i + 50))
      for (const batch of batches) {
        const { error } = await sb.from('broker_monthly').upsert(batch, { onConflict: 'month_date,ma_mg' })
        if (error) throw error
      }
      await queryClient.invalidateQueries({ queryKey: ['available-months'] })
      setUploadMsg(`Import thành công ${parseResult.valid} môi giới. Cache đã được làm mới.`)
      setStep('done')
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : 'Lỗi khi import vào Supabase')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('idle')
    setParseResult(null)
    setFileName('')
    setUploadMsg('')
    setUploadErr('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="page-container py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <StepIndicator current={step} />

        {/* Drop zone */}
        <AnimatePresence mode="wait">
          {(step === 'idle' || step === 'parsing') && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200',
                  isDragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                )}
              >
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors', isDragging ? 'bg-brand-100' : 'bg-slate-100')}>
                  {step === 'parsing'
                    ? <RefreshCw size={24} className="text-brand-500 animate-spin" />
                    : <Upload size={24} className={isDragging ? 'text-brand-600' : 'text-slate-400'} />
                  }
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {step === 'parsing' ? 'Đang phân tích file...' : 'Kéo thả file Excel vào đây'}
                  </p>
                  {step !== 'parsing' && (
                    <p className="text-xs text-slate-400">hoặc click để chọn file · Chấp nhận .xlsx / .xls</p>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {/* Format guide */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={13} className="text-blue-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-blue-700">Định dạng file yêu cầu</p>
                </div>
                <ul className="text-xs text-blue-600 space-y-1 ml-5">
                  <li>File phải là <strong>broker_monthly_vX.xlsx</strong></li>
                  <li>Mỗi tháng = 1 sheet tên <strong>YYYY-MM</strong> (VD: 2026-04)</li>
                  <li>Row 3 chứa field names (snake_case), data từ row 4</li>
                  <li>Cột có cặp primary key <code className="bg-blue-100 px-1 rounded">(month_date, ma_mg)</code> sẽ tự upsert ghi đè.</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Preview */}
          {(step === 'preview' || step === 'uploading') && parseResult && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                <FileSpreadsheet size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
                  <p className="text-xs text-slate-400">{parseResult.total} dòng tổng · {parseResult.valid} hợp lệ</p>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              {parseResult.warnings.length > 0 && (
                <StatusBadge type="warning">
                  <p className="font-semibold mb-1">{parseResult.warnings.length} cảnh báo:</p>
                  <ul className="space-y-0.5">{parseResult.warnings.slice(0, 5).map((w, i) => <li key={i}>• {w}</li>)}</ul>
                  {parseResult.warnings.length > 5 && <p className="mt-1 opacity-70">...và {parseResult.warnings.length - 5} cảnh báo khác</p>}
                </StatusBadge>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tổng dòng', value: parseResult.total, color: 'text-slate-700' },
                  { label: 'Hợp lệ', value: parseResult.valid, color: 'text-emerald-600' },
                  { label: 'Bỏ qua', value: parseResult.total - parseResult.valid, color: parseResult.total - parseResult.valid > 0 ? 'text-amber-600' : 'text-slate-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <p className={cn('text-2xl font-semibold', s.color)}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <PreviewTable data={parseResult.data} />

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <button onClick={reset} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <Trash2 size={13} />
                  Chọn lại
                </button>
                <button
                  onClick={handleImport}
                  disabled={step === 'uploading'}
                  className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {step === 'uploading' ? <><RefreshCw size={13} className="animate-spin" /> Đang import...</> : <><Upload size={13} /> Import {parseResult.valid} môi giới</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* Done */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">Import thành công</h3>
                <p className="text-sm text-slate-500">{uploadMsg}</p>
              </div>
              <button onClick={reset} className="px-5 py-2 text-sm font-medium text-brand-700 border border-brand-200 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors">
                Import file khác
              </button>
            </motion.div>
          )}

          {/* Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <StatusBadge type="error">
                <p className="font-semibold mb-1">Lỗi khi xử lý file:</p>
                <p>{uploadErr || parseResult?.errors.join(' · ')}</p>
              </StatusBadge>
              <button onClick={reset} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                Thử lại
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
