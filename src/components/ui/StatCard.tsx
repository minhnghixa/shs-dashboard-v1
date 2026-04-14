import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  pct?: number | null
  icon?: LucideIcon
  iconColor?: string
  delay?: number
}

export default function StatCard({ label, value, sub, pct, icon: Icon, iconColor = 'text-brand-500', delay = 0 }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={cn('p-1.5 rounded-lg bg-slate-50', iconColor)}>
            <Icon size={14} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-slate-800 leading-none mb-1.5">{value}</p>
      <div className="flex items-center gap-1.5">
        {pct !== undefined && pct !== null && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            pct >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}
