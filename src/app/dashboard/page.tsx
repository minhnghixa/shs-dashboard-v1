'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fmtVND, fmtPct, pctColor, BRANCH_COLORS, BRANCH_ORDER } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import DrillDownModal from '@/components/ui/DrillDownModal'
import PeriodSelector from '@/components/ui/PeriodSelector'
import { DollarSign, TrendingUp, Users, BarChart2, Building2 } from 'lucide-react'
import { useAvailableMonths, useBrokerMoM, useBrokerQuarterly } from '@/hooks/useBrokerData'
import type { PeriodOption } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
  PieChart, Pie
} from 'recharts'
export interface UnifiedBroker {
  ma_mg: string;
  ho_ten: string;
  team: string;
  chi_nhanh: string;
  fee_nay: number;
  fee_truoc: number;
  fee_tuyet_doi: number;
  fee_pct: number | null;
  mar_nay: number;
  mar_truoc: number;
  mar_tuyet_doi: number;
  mar_pct: number | null;
  active_nay: number;
  active_truoc: number;
  active_tuyet_doi: number;
  active_pct: number | null;
}

function calcStats(brokers: UnifiedBroker[]) {
  const total_fee_nay = brokers.reduce((s, b) => s + b.fee_nay, 0)
  const total_fee_truoc = brokers.reduce((s, b) => s + b.fee_truoc, 0)
  const total_mar_nay = brokers.reduce((s, b) => s + b.mar_nay, 0)
  const total_mar_truoc = brokers.reduce((s, b) => s + b.mar_truoc, 0)
  const total_active_nay = brokers.reduce((s, b) => s + b.active_nay, 0)
  const total_active_truoc = brokers.reduce((s, b) => s + b.active_truoc, 0)
  const fee_pct = total_fee_truoc > 0 ? (total_fee_nay - total_fee_truoc) / total_fee_truoc * 100 : null
  const mar_pct = total_mar_truoc > 0 ? (total_mar_nay - total_mar_truoc) / total_mar_truoc * 100 : null
  const act_pct = total_active_truoc > 0 ? (total_active_nay - total_active_truoc) / total_active_truoc * 100 : null
  return { total_fee_nay, total_fee_truoc, fee_pct, total_mar_nay, mar_pct, total_active_nay, act_pct }
}

function calcBranchData(brokers: UnifiedBroker[]) {
  return BRANCH_ORDER.map(cn => {
    const b = brokers.filter(x => x.chi_nhanh === cn)
    const fee_nay = b.reduce((s, x) => s + x.fee_nay, 0)
    const fee_truoc = b.reduce((s, x) => s + x.fee_truoc, 0)

    const mar_nay = b.reduce((s, x) => s + x.mar_nay, 0)
    const mar_truoc = b.reduce((s, x) => s + x.mar_truoc, 0)

    const active_nay = b.reduce((s, x) => s + x.active_nay, 0)
    const active_truoc = b.reduce((s, x) => s + x.active_truoc, 0)

    const pct = fee_truoc > 0 ? ((fee_nay - fee_truoc) / fee_truoc * 100) : 0

    const fee_tuyetdoi = fee_nay - fee_truoc
    const fee_pct = fee_truoc === 0 ? null : (fee_nay - fee_truoc) / fee_truoc * 100

    const mar_tuyetdoi = mar_nay - mar_truoc
    const mar_pct = mar_truoc === 0 ? null : (mar_nay - mar_truoc) / mar_truoc * 100

    const active_tuyetdoi = active_nay - active_truoc
    const active_pct = active_truoc === 0 ? null : (active_nay - active_truoc) / active_truoc * 100

    const label = cn.replace('Chi nhánh ', '').replace('Phòng Giao dịch ', 'PGD ').replace('Hội Sở chính', 'Hội Sở')
    return {
      name: label, count: b.length, color: BRANCH_COLORS[cn],
      fee_nay, fee_truoc, fee_tuyetdoi, fee_pct, pct,
      mar_nay, mar_truoc, mar_tuyetdoi, mar_pct,
      active_nay, active_truoc, active_tuyetdoi, active_pct
    }
  })
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  const fmt = formatter || fmtVND
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
}

export default function DashboardPage() {
  const { data: availableMonths, isLoading: loadingMonths } = useAvailableMonths()
  const [period, setPeriod] = useState<PeriodOption | null>(null)
  const [drillDownMetric, setDrillDownMetric] = useState<'fee_nay' | 'mar_nay' | 'active_nay' | null>(null)
  const [branchTab, setBranchTab] = useState<'fee' | 'margin' | 'active'>('fee')
  const [podiumTab, setPodiumTab] = useState<'fee' | 'margin' | 'active'>('fee')

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
        mar_nay: Number(q.mar_tong_avg || 0), mar_truoc: 0, mar_tuyet_doi: 0, mar_pct: null,
        mar_margin: Number(q.mar_margin_avg || 0), mar_3ben: Number(q.mar_3ben_avg || 0), mar_ungtruoc: Number(q.mar_ungtruoc_avg || 0),
        active_nay: Number(q.active_max || 0), active_truoc: 0, active_tuyet_doi: 0, active_pct: null,
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

  if (error) return (
    <div className="page-container py-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        Lỗi tải dữ liệu: {error.message}. Vui lòng kiểm tra kết nối Supabase.
      </div>
    </div>
  )

  if (isLoading || !brokers) return (
    <div className="page-container py-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )

  const stats = calcStats(brokers)
  const branchData = calcBranchData(brokers)
  const totalTeams = new Set(brokers.map(b => b.team)).size

  const topBrokers = [...brokers].sort((a, b) => {
    if (podiumTab === 'fee') return b.fee_nay - a.fee_nay
    if (podiumTab === 'margin') return b.mar_nay - a.mar_nay
    if (podiumTab === 'active') return b.active_nay - a.active_nay
    return 0
  }).slice(0, 3)

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan kinh doanh</h1>
        <PeriodSelector availableMonths={availableMonths || []} value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label={isQuarter ? "Phí GD quý này" : "Phí GD tháng này"}
          value={fmtVND(stats.total_fee_nay)}
          pct={stats.fee_pct}
          sub={isQuarter ? "tổng lũy kế" : "so tháng trước"}
          icon={DollarSign}
          iconColor="text-brand-500"
          delay={0}
        />
        <StatCard
          label={isQuarter ? "Dư nợ margin quý này" : "Dư nợ margin tháng này"}
          value={fmtVND(stats.total_mar_nay)}
          pct={stats.mar_pct}
          sub="tổng dư nợ"
          icon={BarChart2}
          iconColor="text-emerald-500"
          delay={80}
        />
        <StatCard
          label={isQuarter ? "TK Active kỳ này" : "TK Active tháng này"}
          value={stats.total_active_nay.toLocaleString('vi-VN')}
          pct={stats.act_pct}
          sub={isQuarter ? "tài khoản giao dịch" : "tài khoản"}
          icon={TrendingUp}
          iconColor="text-amber-500"
          delay={160}
        />
        <StatCard
          label="Môi giới"
          value={brokers.length.toString()}
          sub={`${totalTeams} teams`}
          icon={Users}
          iconColor="text-pink-500"
          delay={240}
        />
        <StatCard
          label="Chi nhánh"
          value={BRANCH_ORDER.length.toString()}
          sub="toàn quốc"
          icon={Building2}
          iconColor="text-violet-500"
          delay={320}
        />
      </div>

      {/* 3 Pie Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: 'branch-fee', title: 'Tỉ trọng Phí GD theo Chi nhánh', dataKey: 'fee_nay', total: stats.total_fee_nay, fmt: fmtVND },
          { id: 'branch-mar', title: 'Tỉ trọng Margin theo Chi nhánh', dataKey: 'mar_nay', total: stats.total_mar_nay, fmt: fmtVND },
          { id: 'branch-act', title: 'Tỉ trọng TK Active theo Chi nhánh', dataKey: 'active_nay', total: stats.total_active_nay, fmt: (v: number) => v.toLocaleString('vi-VN') }
        ].map((chart, idx) => {
          const chartData = branchData.filter(d => (d as any)[chart.dataKey] > 0)
          return (
            <div 
              key={chart.id} 
              onClick={() => setDrillDownMetric(chart.dataKey as 'fee_nay' | 'mar_nay' | 'active_nay')}
              className="bg-white rounded-xl border border-slate-100 p-5 animate-fade-up opacity-0 cursor-pointer hover:border-brand-500 hover:shadow-md transition-all group" 
              style={{ animationDelay: `${200 + idx * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-brand-600">{chart.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Phân bổ toàn công ty trong tháng này</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey={chart.dataKey}
                    nameKey="name"
                    cx="35%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {chartData.map((d, i) => (
                      <Cell key={`cell-${i}`} fill={d.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]
                      const pct = chart.total > 0 ? ((p.value as number) / chart.total) * 100 : 0
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.payload?.fill || p.color || '#3b82f6' }} />
                            <span className="font-semibold text-slate-700">{p.name || 'Không xác định'}</span>
                          </div>
                          <div className="flex items-center justify-between ml-4 gap-4">
                            <span className="text-slate-600">{chart.fmt(p.value as number)}</span>
                            <span className="font-medium text-brand-600">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', right: 0, paddingRight: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>

      {/* 3 Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: 'fee', title: 'Phí GD theo chi nhánh', nay: 'fee_nay', truoc: 'fee_truoc', fmt: fmtVND },
          { id: 'mar', title: 'Margin theo chi nhánh', nay: 'mar_nay', truoc: 'mar_truoc', fmt: fmtVND },
          { id: 'act', title: 'TK active theo chi nhánh', nay: 'active_nay', truoc: 'active_truoc', fmt: (v: number) => v.toLocaleString('vi-VN') }
        ].map((chart, idx) => (
          <div key={chart.id} className="bg-white rounded-xl border border-slate-100 p-5 animate-fade-up opacity-0" style={{ animationDelay: `${200 + idx * 100}ms`, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">{chart.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{isQuarter ? 'Lũy kế quý' : 'So sánh tháng trước — tháng này'}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={branchData} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => chart.fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<CustomTooltip formatter={chart.fmt} />} cursor={{ fill: '#f8fafc' }} />
                {!isQuarter && <Bar dataKey={chart.truoc} name="Tháng trước" fill="#e2e8f0" radius={[3, 3, 0, 0]} barSize={12} />}
                <Bar dataKey={chart.nay} name={isQuarter ? 'Kỳ này' : 'Tháng này'} radius={[3, 3, 0, 0]} barSize={12}>
                  {branchData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Leaderboard */}
        <div className="rounded-2xl border-0 p-5 lg:p-6 pb-8 animate-fade-up opacity-0 flex flex-col items-center relative overflow-hidden lg:col-span-1 shadow-xl" style={{ 
          animationDelay: '300ms', 
          animationFillMode: 'forwards',
          background: 'linear-gradient(110deg, #efd6a1 0%, #fdfcf4 25%, #dcb87d 60%, #ba9661 100%)'
        }}>
        {/* Glow effect ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-white/40 blur-[80px] rounded-full pointer-events-none" />

        <div className="mb-8 text-center relative z-10 w-full flex flex-col items-center">
          <h3 className="text-xl font-bold text-amber-950 mb-3 tracking-tight">Tư vấn đầu tư xuất sắc nhất {isQuarter ? 'trong quý' : 'trong tháng'}</h3>
          <div className="flex items-center gap-1 bg-amber-100/50 p-1 rounded-lg border border-amber-200/50">
            {[
              { id: 'fee', label: 'Phí GD' },
              { id: 'margin', label: 'Margin' },
              { id: 'active', label: 'TK Active' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPodiumTab(t.id as any)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${podiumTab === t.id ? 'bg-white text-amber-700 shadow-sm border border-amber-200/50' : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-100/50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-center w-full gap-1.5 lg:gap-2 relative z-10">
          {[
            { idx: 1, rank: 2, badge: 'text-slate-600 bg-gradient-to-br from-white to-slate-100 border-slate-200', ring: 'border-slate-200', size: 'w-16 h-16 md:w-20 md:h-20 lg:w-16 lg:h-16 xl:w-20 xl:h-20', tz: 'text-xl md:text-2xl lg:text-xl xl:text-2xl', pb: 'pb-0' },
            { idx: 0, rank: 1, badge: 'text-amber-900 bg-gradient-to-br from-amber-300 to-amber-400 border-amber-200 shadow-amber-500/20', ring: 'border-amber-300', size: 'w-24 h-24 md:w-28 md:h-28 lg:w-24 lg:h-24 xl:w-28 xl:h-28', tz: 'text-3xl md:text-4xl lg:text-3xl xl:text-4xl', pb: 'pb-6 md:pb-8 lg:pb-6 xl:pb-8 z-10' },
            { idx: 2, rank: 3, badge: 'text-orange-950 bg-gradient-to-br from-orange-200 to-orange-300 border-orange-300 shadow-orange-500/10', ring: 'border-orange-300', size: 'w-14 h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16', tz: 'text-base md:text-lg lg:text-base xl:text-lg', pb: 'pb-0' },
          ].map(cfg => {
             const b = topBrokers[cfg.idx]
             if (!b) return null
             const color = BRANCH_COLORS[b.chi_nhanh] ?? '#6366f1'
             return (
               <div key={b.ma_mg} className={`flex flex-col items-center flex-1 min-w-[70px] md:min-w-[85px] ${cfg.pb}`}>
                 <div className={`relative ${cfg.size} rounded-full border-[3px] md:border-[4px] ${cfg.ring} flex items-center justify-center text-white ${cfg.tz} font-bold shadow-xl transition-transform hover:scale-105`} style={{ background: color }}>
                   {b.ho_ten.split(' ').filter((_, idx, arr) => idx === 0 || idx === arr.length - 1).map(n => n[0]).join('').toUpperCase()}
                   <div className={`absolute -top-3 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs border shadow-sm ${cfg.badge}`}>
                     {cfg.rank}
                   </div>
                 </div>
                 
                 <div className="mt-3 flex flex-col items-center gap-1 text-center w-full">
                   <span className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight line-clamp-2 min-h-[2.4em]">{b.ho_ten}</span>
                   <span 
                     className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold border border-black/5 truncate max-w-full"
                     style={{ backgroundColor: `${color}1A`, color: color }}
                   >
                     {b.team && b.team !== 'Không xác định' && b.team !== '' ? b.team.replace('Team ', '') : b.chi_nhanh.replace('Chi nhánh ', '').replace('Phòng Giao dịch ', 'PGD ')}
                   </span>
                   <span className="font-black text-[#5c3a0a] text-xs md:text-base mt-0.5 tracking-tight drop-shadow-sm">
                     {podiumTab === 'fee' ? fmtVND(b.fee_nay) : podiumTab === 'margin' ? fmtVND(b.mar_nay) : b.active_nay.toLocaleString('vi-VN')}
                   </span>
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Branch detail table */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 animate-fade-up opacity-0 lg:col-span-2 flex flex-col" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="text-sm font-semibold text-slate-700">Chi tiết theo chi nhánh</h3>
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 self-start sm:self-auto overflow-x-auto">
            {[
              { id: 'fee', label: 'Phí GD' },
              { id: 'margin', label: 'Dư nợ Margin' },
              { id: 'active', label: 'TK Active' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setBranchTab(t.id as any)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all whitespace-nowrap ${branchTab === t.id ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-slate-400 font-medium pl-0 whitespace-nowrap w-[140px]">Chi nhánh</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Số MG</th>
                {branchTab === 'fee' && (
                  <>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Phí T.Trước</th>}
                    <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">{isQuarter ? 'Phí Lũy Kế' : 'Phí T.Này'}</th>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng phí</th>}
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng phí %</th>}
                  </>
                )}
                {branchTab === 'margin' && (
                  <>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Dư nợ T.Trước</th>}
                    <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">{isQuarter ? 'Dư nợ BQ' : 'Dư nợ T.Này'}</th>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng dư nợ</th>}
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng dư nợ %</th>}
                  </>
                )}
                {branchTab === 'active' && (
                  <>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Active T.Trước</th>}
                    <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">{isQuarter ? 'TK Active' : 'Active T.Này'}</th>
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng TK tuyệt đối</th>}
                    {!isQuarter && <th className="text-left py-2 px-3 text-slate-400 font-medium whitespace-nowrap">Tăng TK %</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {branchData.map(d => (
                <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 pl-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="font-medium text-slate-700 whitespace-nowrap">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{d.count}</td>
                  
                  {branchTab === 'fee' && (
                    <>
                      {!isQuarter && <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{fmtVND(d.fee_truoc)}</td>}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{fmtVND(d.fee_nay)}</td>
                      {!isQuarter && <td className={`py-3 px-3 font-medium whitespace-nowrap ${pctColor(d.fee_tuyetdoi > 0 ? 1 : d.fee_tuyetdoi < 0 ? -1 : 0)}`}>{d.fee_tuyetdoi > 0 ? '+' : ''}{fmtVND(d.fee_tuyetdoi)}</td>}
                      {!isQuarter && <td className={`py-3 px-3 font-bold whitespace-nowrap ${pctColor(d.fee_pct)}`}>{fmtPct(d.fee_pct)}</td>}
                    </>
                  )}

                  {branchTab === 'margin' && (
                    <>
                      {!isQuarter && <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{fmtVND(d.mar_truoc)}</td>}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{fmtVND(d.mar_nay)}</td>
                      {!isQuarter && <td className={`py-3 px-3 font-medium whitespace-nowrap ${pctColor(d.mar_tuyetdoi > 0 ? 1 : d.mar_tuyetdoi < 0 ? -1 : 0)}`}>{d.mar_tuyetdoi > 0 ? '+' : ''}{fmtVND(d.mar_tuyetdoi)}</td>}
                      {!isQuarter && <td className={`py-3 px-3 font-bold whitespace-nowrap ${pctColor(d.mar_pct)}`}>{fmtPct(d.mar_pct)}</td>}
                    </>
                  )}

                  {branchTab === 'active' && (
                    <>
                      {!isQuarter && <td className="py-3 px-3 text-slate-500">{d.active_truoc.toLocaleString('vi-VN')}</td>}
                      <td className="py-3 px-3 font-semibold text-slate-800">{d.active_nay.toLocaleString('vi-VN')}</td>
                      {!isQuarter && <td className={`py-3 px-3 font-medium whitespace-nowrap ${pctColor(d.active_tuyetdoi > 0 ? 1 : d.active_tuyetdoi < 0 ? -1 : 0)}`}>{d.active_tuyetdoi > 0 ? '+' : ''}{d.active_tuyetdoi.toLocaleString('vi-VN')}</td>}
                      {!isQuarter && <td className={`py-3 px-3 font-bold whitespace-nowrap ${pctColor(d.active_pct)}`}>{fmtPct(d.active_pct)}</td>}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <DrillDownModal
        isOpen={!!drillDownMetric}
        onClose={() => setDrillDownMetric(null)}
        metric={drillDownMetric}
        brokers={brokers}
      />
    </div>
  )
}
