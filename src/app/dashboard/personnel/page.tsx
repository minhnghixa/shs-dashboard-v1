'use client'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRANCH_COLORS, BRANCH_ORDER, initials, cn } from '@/lib/utils'
import type { Broker } from '@/lib/types'
import { Search, ChevronRight, ChevronDown, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function useBrokers() {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      const { data, error } = await createClient().from('brokers').select('*')
      if (error) throw error
      return data as Broker[]
    },
  })
}

const AVATAR_PALETTE = ['#fde68a','#a7f3d0','#bfdbfe','#fecdd3','#ddd6fe','#fed7aa']
function avatarBg(ma: string) {
  let h = 0
  for (let i = 0; i < ma.length; i++) h = (h * 31 + ma.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function BrokerCard({ broker, idx }: { broker: Broker; idx: number }) {
  const bg = avatarBg(broker.ma_mg)
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.025 }}
      className="flex items-center gap-3 py-2.5 px-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
        style={{ background: bg, color: '#4b3b00' }}
      >
        {initials(broker.ho_ten)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-700 truncate">{broker.ho_ten}</div>
      </div>
      <div className="text-[10px] font-mono text-slate-400 flex-shrink-0">{broker.ma_mg}</div>
    </motion.div>
  )
}

function TeamBlock({ teamName, brokers, branchColor, expanded, onToggle }: {
  teamName: string; brokers: Broker[]; branchColor: string;
  expanded: boolean; onToggle: () => void
}) {
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${branchColor}15` }}>
          {expanded
            ? <ChevronDown size={11} style={{ color: branchColor }} />
            : <ChevronRight size={11} style={{ color: branchColor }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-700 truncate">{teamName}</div>
        </div>
        <span className="text-[10px] text-slate-400 flex-shrink-0">{brokers.length} MG</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-slate-100"
          >
            {brokers.map((b, i) => <BrokerCard key={b.ma_mg} broker={b} idx={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PersonnelPage() {
  const { data: brokers, isLoading, error } = useBrokers()
  const [search, setSearch]             = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(BRANCH_ORDER))
  const [expandedTeams, setExpandedTeams]       = useState<Set<string>>(new Set())

  const toggleBranch = (name: string) => {
    setExpandedBranches(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n })
  }
  const toggleTeam = (key: string) => {
    setExpandedTeams(p => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n })
  }
  const expandAll = () => {
    setExpandedBranches(new Set(BRANCH_ORDER))
    if (brokers) {
      const keys = new Set<string>()
      brokers.forEach(b => keys.add(`${b.chi_nhanh}||${b.team}`))
      setExpandedTeams(keys)
    }
  }
  const collapseAll = () => { setExpandedBranches(new Set()); setExpandedTeams(new Set()) }

  const filtered = useMemo(() => {
    if (!brokers) return []
    return brokers.filter(b => {
      if (filterBranch && b.chi_nhanh !== filterBranch) return false
      if (!search) return true
      const q = search.toLowerCase()
      return b.ho_ten.toLowerCase().includes(q) || b.ma_mg.toLowerCase().includes(q) || b.team.toLowerCase().includes(q)
    })
  }, [brokers, filterBranch, search])

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Broker[]>> = {}
    filtered.forEach(b => {
      if (!map[b.chi_nhanh]) map[b.chi_nhanh] = {}
      if (!map[b.chi_nhanh][b.team]) map[b.chi_nhanh][b.team] = []
      map[b.chi_nhanh][b.team].push(b)
    })
    return map
  }, [filtered])

  const totalTeams = brokers ? new Set(brokers.map(b => b.team)).size : 0

  if (error) return <div className="page-container py-8 text-red-600 text-sm">Lỗi: {error.message}</div>

  return (
    <div className="page-container py-6 space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="stat-card col-span-2 sm:col-span-1 lg:col-span-2 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Tổng</p>
          <p className="text-3xl font-semibold text-slate-800">{brokers?.length ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-1">{totalTeams} teams · {BRANCH_ORDER.length} chi nhánh</p>
        </div>
        {BRANCH_ORDER.map((bn, i) => {
          const cnt   = brokers?.filter(b => b.chi_nhanh === bn).length ?? 0
          const total = brokers?.length ?? 1
          const pct   = Math.round(cnt / total * 100)
          const color = BRANCH_COLORS[bn]
          const label = bn.replace('Chi nhánh ','').replace('Phòng Giao dịch ','PGD ').replace('Hội Sở chính','Hội Sở')
          return (
            <div
              key={bn}
              className={cn('stat-card cursor-pointer transition-all animate-fade-up opacity-0', filterBranch === bn ? 'ring-2' : 'hover:border-slate-200')}
              style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'forwards', ...(filterBranch === bn ? { ringColor: color } : {}) }}
              onClick={() => setFilterBranch(prev => prev === bn ? '' : bn)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-slate-400">{pct}%</span>
              </div>
              <p className="text-xl font-semibold text-slate-800">{cnt}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{label}</p>
              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, mã MG, team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-400 text-slate-700"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors">Mở tất cả</button>
          <button onClick={collapseAll} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors">Thu tất cả</button>
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} môi giới</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      )}

      {/* Tree */}
      <div className="space-y-4">
        {!isLoading && BRANCH_ORDER.map(branchName => {
          const teams = grouped[branchName]
          if (!teams) return null
          const color  = BRANCH_COLORS[branchName] ?? '#6366f1'
          const count  = Object.values(teams).flat().length
          const isOpen = expandedBranches.has(branchName) || !!search

          return (
            <div key={branchName} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
              {/* Branch header */}
              <button
                onClick={() => toggleBranch(branchName)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-semibold text-slate-800 flex-1">{branchName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>
                    {Object.keys(teams).length} teams
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium">
                    {count} MG
                  </span>
                  {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                </div>
              </button>

              {/* Teams grid */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {Object.entries(teams).map(([teamName, teamBrokers]) => {
                        const key = `${branchName}||${teamName}`
                        return (
                          <TeamBlock
                            key={key}
                            teamName={teamName}
                            brokers={teamBrokers}
                            branchColor={color}
                            expanded={expandedTeams.has(key) || !!search}
                            onToggle={() => toggleTeam(key)}
                          />
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
