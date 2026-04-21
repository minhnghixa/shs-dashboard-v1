import { useState, useMemo, useEffect } from 'react'
import { PeriodOption } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PeriodSelectorProps {
  availableMonths: string[]
  value: PeriodOption | null
  onChange: (p: PeriodOption) => void
}

export default function PeriodSelector({ availableMonths, value, onChange }: PeriodSelectorProps) {
  const monthOptions = useMemo(() => {
    if (!availableMonths || availableMonths.length === 0) return []
    return availableMonths.map(m => {
      const d = new Date(m)
      return { label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`, type: 'month' as const, value: m }
    })
  }, [availableMonths])

  const quarterOptions = useMemo(() => {
    if (!availableMonths || availableMonths.length === 0) return []
    const qMap: Record<string, number> = {}
    availableMonths.forEach(m => {
      const d = new Date(m)
      const q = Math.ceil((d.getMonth() + 1) / 3)
      const yr = d.getFullYear()
      const key = `${yr}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`
      qMap[key] = (qMap[key] || 0) + 1
    })
    const sortedKeys = Object.keys(qMap).sort((a,b) => b.localeCompare(a))
    return sortedKeys.map(k => {
      const d = new Date(k)
      const q = Math.ceil((d.getMonth() + 1) / 3)
      const yr = d.getFullYear()
      const count = qMap[k]
      return { label: `Q${q}/${yr} (${count === 3 ? '3 tháng' : `${count}/3 tháng`})`, type: 'quarter' as const, value: k }
    })
  }, [availableMonths])

  const currentType = value?.type || 'month'
  const options = currentType === 'month' ? monthOptions : quarterOptions

  // Auto-select first option when options array changes and current value is no longer valid
  useEffect(() => {
    if (options.length > 0) {
      const isCurrentValueValid = options.some(o => o.value === value?.value && o.type === value?.type)
      if (!isCurrentValueValid) {
        onChange(options[0])
      }
    }
  }, [currentType, options, value?.value, value?.type, onChange])

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm w-fit">
      {/* Segmented Control */}
      <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
        <button
          onClick={() => { if (monthOptions.length > 0) onChange(monthOptions[0]) }}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
            currentType === 'month' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Tháng
        </button>
        <button
          onClick={() => { if (quarterOptions.length > 0) onChange(quarterOptions[0]) }}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
            currentType === 'quarter' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Quý
        </button>
      </div>

      {/* Select Dropdown */}
      <div className="relative">
        <select
          value={value?.value || ''}
          onChange={e => {
            const opt = options.find(o => o.value === e.target.value)
            if (opt) onChange(opt)
          }}
          className="pl-3 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-400 text-slate-700 appearance-none cursor-pointer min-w-[140px]"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
