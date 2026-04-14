import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtVND(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Tỷ`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr`
  return value.toLocaleString('vi-VN')
}

export function fmtPct(value: number | null, fallback = '—'): string {
  if (value === null || value === undefined) return fallback
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function pctColor(value: number | null): string {
  if (value === null) return 'text-slate-400'
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-red-500'
  return 'text-slate-400'
}

export function initials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
  return name[0]?.toUpperCase() ?? '?'
}

export const BRANCH_COLORS: Record<string, string> = {
  'Hội Sở chính':            '#6366f1',
  'Chi nhánh Hồ Chí Minh':   '#10b981',
  'Chi nhánh Hà Nội':        '#f59e0b',
  'Chi nhánh Đà Nẵng':       '#ec4899',
  'Phòng Giao dịch Cần Thơ': '#3b82f6',
}

export const BRANCH_ORDER = [
  'Hội Sở chính',
  'Chi nhánh Hồ Chí Minh',
  'Chi nhánh Hà Nội',
  'Chi nhánh Đà Nẵng',
  'Phòng Giao dịch Cần Thơ',
]
