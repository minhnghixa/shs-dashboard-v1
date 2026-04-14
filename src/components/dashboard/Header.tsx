'use client'
import { usePathname } from 'next/navigation'

const TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard':           { title: 'Tổng quan',        sub: 'Báo cáo tổng hợp toàn hệ thống' },
  '/dashboard/sales':     { title: 'Doanh số',          sub: 'Phí giao dịch & dư nợ Margin theo môi giới' },
  '/dashboard/personnel': { title: 'Nhân sự',           sub: 'Cơ cấu tổ chức Chi nhánh → Team → Môi giới' },
  '/dashboard/data':      { title: 'Quản lý dữ liệu',  sub: 'Import và cập nhật dữ liệu từ file Excel' },
}

export default function Header() {
  const pathname = usePathname()
  const info = TITLES[pathname] ?? { title: 'Dashboard', sub: '' }
  const now = new Date()
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-[15px] font-semibold text-slate-800 leading-none">{info.title}</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">{info.sub}</p>
      </div>
      <div className="text-[12px] text-slate-400">{dateStr}</div>
    </header>
  )
}
