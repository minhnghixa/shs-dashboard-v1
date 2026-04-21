'use client'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import type { UnifiedBroker, PeriodOption } from '@/lib/types'
import { fmtVND, fmtPct, pctColor, BRANCH_COLORS, BRANCH_ORDER, cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvailableMonths, useBrokerMoM, useBrokerQuarterly } from '@/hooks/useBrokerData'
import PeriodSelector from '@/components/ui/PeriodSelector'

type MetricKey = 'fee' | 'margin' | 'active'
const METRIC_OPTS: { key: MetricKey; label: string }[] = [
  { key: 'fee',    label: 'Phí GD' },
  { key: 'margin', label: 'Dư nợ Margin' },
  { key: 'active', label: 'TK Active' },
]

function getBrokerMetrics(b: UnifiedBroker, metric: MetricKey) {
  if (metric === 'fee')    return { truoc: b.fee_truoc,    nay: b.fee_nay,    td: b.fee_tuyet_doi,    pct: b.fee_pct }
  if (metric === 'margin') return { truoc: b.mar_truoc, nay: b.mar_nay, td: b.mar_tuyet_doi, pct: b.mar_pct }
  return { truoc: b.active_truoc, nay: b.active_nay, td: b.active_tuyet_doi, pct: b.active_pct }
}

function ProgressBar({ actual, prev }: { actual: number; prev: number }) {
  const max = Math.max(actual, prev, 1)
  const pctActual = (actual / max) * 100
  const up = actual >= prev
  return (
    <div className="relative h-5 bg-slate-100 rounded overflow-hidden border border-slate-200">
      <div className="absolute inset-y-0 left-0 bg-slate-200/70 rounded" style={{ width: `${(prev / max) * 100}%` }} />
      <div
        className={cn('absolute top-0.5 left-0 h-4 rounded transition-all duration-500', up ? 'bg-emerald-500' : 'bg-red-400')}
        style={{ width: `${pctActual}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white mix-blend-multiply">
        {actual > 0 || prev > 0 ? fmtVND(actual) : '—'}
      </div>
    </div>
  )
}

function BrokerRow({ broker, metric, idx, isQuarter }: { broker: UnifiedBroker; metric: MetricKey; idx: number; isQuarter: boolean }) {
  const m = getBrokerMetrics(broker, metric)
  return (
    <motion.tr
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.02 }}
      className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0"
    >
      <td className="py-2.5 pl-8 pr-3 text-center text-[11px] text-slate-400">{idx + 1}</td>
      <td className="py-2.5 px-3">
        <div className="text-xs text-slate-700 font-medium truncate max-w-[180px]" title={broker.ho_ten}>{broker.ho_ten}</div>
        <div className="text-[10px] text-slate-400 font-mono">{broker.ma_mg}</div>
      </td>
      <td className="py-2.5 px-3 min-w-[140px]">
        <ProgressBar actual={m.nay} prev={isQuarter ? m.nay : m.truoc} />
      </td>
      {!isQuarter && <td className="py-2.5 px-3 text-xs text-right text-slate-500">{fmtVND(m.truoc)}</td>}
      <td className="py-2.5 px-3 text-xs text-right font-medium text-slate-700">{fmtVND(m.nay)}</td>
      {!isQuarter && (
        <>
          <td className={cn('py-2.5 px-3 text-xs text-right font-medium', m.td >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {m.td >= 0 ? '+' : ''}{fmtVND(m.td)}
          </td>
          <td className={cn('py-2.5 px-3 text-xs text-right font-semibold', pctColor(m.pct))}>
            {fmtPct(m.pct)}
          </td>
        </>
      )}
    </motion.tr>
  )
}

function TeamSection({ teamName, brokers, metric, branchColor, expanded, onToggle, isQuarter }: {
  teamName: string; brokers: UnifiedBroker[]; metric: MetricKey;
  branchColor: string; expanded: boolean; onToggle: () => void; isQuarter: boolean;
}) {
  const m = brokers.reduce((s, b) => {
    const bm = getBrokerMetrics(b, metric)
    return { truoc: s.truoc + bm.truoc, nay: s.nay + bm.nay, td: s.td + bm.td }
  }, { truoc: 0, nay: 0, td: 0 })
  const pct = m.truoc > 0 ? (m.td / m.truoc) * 100 : null

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${branchColor}18` }}>
          {expanded
            ? <ChevronDown size={13} style={{ color: branchColor }} />
            : <ChevronRight size={13} style={{ color: branchColor }} />
          }
        </div>
        <span className="text-sm font-medium text-slate-700 flex-1 truncate">{teamName}</span>
        <div className="flex items-center gap-4 text-xs flex-shrink-0">
          <span className="text-slate-400">{brokers.length} MG</span>
          <span className="text-slate-600 font-medium hidden sm:block">{fmtVND(m.nay)}</span>
          {!isQuarter && <span className={cn('font-semibold w-16 text-right', pctColor(pct))}>{fmtPct(pct)}</span>}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <table className="w-full text-sm border-t border-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {['#', 'Họ và tên', 'Tiến độ', ...(isQuarter ? [] : ['T.Trước']), isQuarter ? 'T.Này (BQ/Tổng)' : 'T.Này', ...(isQuarter ? [] : ['Tăng TĐ', 'Tăng %'])].map(h => (
                    <th key={h} className="py-2 px-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide first:pl-8">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokers.map((b, i) => <BrokerRow key={b.ma_mg} broker={b} metric={metric} idx={i} isQuarter={isQuarter} />)}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SalesPage() {
  const { data: availableMonths, isLoading: loadingMonths } = useAvailableMonths()
  const [period, setPeriod] = useState<PeriodOption | null>(null)

  const isQuarter = period?.type === 'quarter'
  const val = period?.value || ''

  const { data: momData, isLoading: loadingMom, error: errMom } = useBrokerMoM(isQuarter ? '' : val)
  const { data: qData, isLoading: loadingQ, error: errQ } = useBrokerQuarterly(isQuarter ? val : '')

  const isLoading = loadingMonths || loadingMom || loadingQ
  const error = errMom || errQ

  const brokers: UnifiedBroker[] = useMemo(() => {
    if (isQuarter && qData) {
      return qData.map(q => ({
        ma_mg: q.ma_mg, ho_ten: q.ho_ten, team: q.team, chi_nhanh: q.chi_nhanh,
        fee_nay: Number(q.fee_qtd || 0), fee_truoc: 0, fee_tuyet_doi: 0, fee_pct: null,
        mar_nay: Number(q.mar_tong_sum || 0), mar_truoc: 0, mar_tuyet_doi: 0, mar_pct: null,
        mar_margin: Number(q.mar_margin_sum || 0), mar_3ben: Number(q.mar_3ben_sum || 0), mar_ungtruoc: Number(q.mar_ungtruoc_sum || 0),
        active_nay: Number(q.active_sum || 0), active_truoc: 0, active_tuyet_doi: 0, active_pct: null,
      }))
    } else if (!isQuarter && momData) {
      return momData.map(m => ({
        ma_mg: m.ma_mg, ho_ten: m.ho_ten, team: m.team, chi_nhanh: m.chi_nhanh,
        fee_nay: Number(m.fee_nay || 0), fee_truoc: Number(m.fee_truoc || 0), fee_tuyet_doi: Number(m.fee_tuyet_doi || 0), fee_pct: m.fee_pct ? Number(m.fee_pct) : null,
        mar_nay: Number(m.mar_nay || 0), mar_truoc: Number(m.mar_truoc || 0), mar_tuyet_doi: Number(m.mar_tuyet_doi || 0), mar_pct: m.mar_pct ? Number(m.mar_pct) : null,
        mar_margin: Number(m.mar_margin || 0), mar_3ben: Number(m.mar_3ben || 0), mar_ungtruoc: Number(m.mar_ungtruoc || 0),
        active_nay: Number(m.active_nay || 0), active_truoc: Number(m.active_truoc || 0), active_tuyet_doi: Number(m.active_tuyet_doi || 0), active_pct: m.active_pct ? Number(m.active_pct) : null,
      }))
    }
    return []
  }, [isQuarter, qData, momData])
  const [metric, setMetric] = useState<MetricKey>('fee')
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

  const toggleTeam = (key: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    if (!brokers) return []
    return brokers.filter(b => {
      if (filterBranch && b.chi_nhanh !== filterBranch) return false
      if (!search) return true
      const q = search.toLowerCase()
      return b.ho_ten.toLowerCase().includes(q) || b.ma_mg.toLowerCase().includes(q)
    })
  }, [brokers, filterBranch, search])

  // Group by branch → team
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, UnifiedBroker[]>> = {}
    filtered.forEach(b => {
      if (!map[b.chi_nhanh]) map[b.chi_nhanh] = {}
      if (!map[b.chi_nhanh][b.team]) map[b.chi_nhanh][b.team] = []
      map[b.chi_nhanh][b.team].push(b)
    })
    return map
  }, [filtered])

  if (error) return <div className="page-container py-8 text-red-600 text-sm">Lỗi: {error.message}</div>

  return (
    <div className="page-container py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Doanh số môi giới</h1>
        <PeriodSelector availableMonths={availableMonths || []} value={period} onChange={setPeriod} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Metric switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          {METRIC_OPTS.map(o => (
            <button
              key={o.key}
              onClick={() => setMetric(o.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                metric === o.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, mã MG..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-400 text-slate-700"
          />
        </div>

        {/* Branch filter */}
        <div className="relative">
          <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-400 text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Tất cả chi nhánh</option>
            {BRANCH_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400">{filtered.length} môi giới</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      )}

      {/* Tree: branch → team → brokers */}
      {!isLoading && BRANCH_ORDER.map(branchName => {
        const teams = grouped[branchName]
        if (!teams || Object.keys(teams).length === 0) return null
        const color = BRANCH_COLORS[branchName] ?? '#6366f1'
        const totalNay = Object.values(teams).flat().reduce((s, b) => s + getBrokerMetrics(b, metric).nay, 0)
        const totalCount = Object.values(teams).flat().length

        return (
          <div key={branchName} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {/* Branch header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100" style={{ borderLeftWidth: 3, borderLeftColor: color, borderLeftStyle: 'solid' }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-sm font-semibold text-slate-800 flex-1">{branchName}</span>
              <span className="text-xs text-slate-400">{Object.keys(teams).length} teams · {totalCount} MG</span>
              <span className="text-sm font-semibold text-slate-700">{fmtVND(totalNay)}</span>
            </div>

            {/* Teams */}
            <div className="p-3 space-y-2">
              {Object.entries(teams).sort(([, a], [, b]) => {
                const aVal = a.reduce((s, x) => s + getBrokerMetrics(x, metric).nay, 0)
                const bVal = b.reduce((s, x) => s + getBrokerMetrics(x, metric).nay, 0)
                return bVal - aVal
              }).map(([teamName, teamBrokers]) => {
                const key = `${branchName}||${teamName}`
                return (
                  <TeamSection
                    key={key}
                    teamName={teamName}
                    brokers={teamBrokers}
                    metric={metric}
                    branchColor={color}
                    expanded={expandedTeams.has(key)}
                    onToggle={() => toggleTeam(key)}
                    isQuarter={isQuarter}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
