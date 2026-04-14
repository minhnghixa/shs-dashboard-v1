'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Users, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',            label: 'Tổng quan',    icon: LayoutDashboard },
  { href: '/dashboard/sales',      label: 'Doanh số',     icon: TrendingUp },
  { href: '/dashboard/personnel',  label: 'Nhân sự',      icon: Users },
  { href: '/dashboard/data',       label: 'Dữ liệu',      icon: Database },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-white border-r border-slate-100 flex flex-col z-10">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* SHS Logo */}
          <img src="/logo-shs.png" alt="SHS Logo" className="h-8 w-auto object-contain" />
          <span className="font-semibold text-slate-800 text-[15px] tracking-tight">Quản lý kênh bán</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 space-y-0.5">
        <p className="text-[11px] text-slate-500 font-medium text-center">Lê Minh Nghĩa - CV PTSP</p>
        <p className="text-[10px] text-slate-400 text-center">Sales Dashboard v1.0</p>
      </div>
    </aside>
  )
}
