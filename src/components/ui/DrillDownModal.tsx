import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { fmtVND, BRANCH_ORDER } from '@/lib/utils'
import type { Broker } from '@/lib/types'

type Metric = 'fee_nay' | 'mar_nay' | 'active_nay'

interface Props {
  isOpen: boolean
  onClose: () => void
  metric: Metric | null
  brokers: Broker[]
}

const METRIC_LABELS = {
  fee_nay: 'Phí Giao Dịch',
  mar_nay: 'Dư Nợ Margin',
  active_nay: 'TK Active'
}

export default function DrillDownModal({ isOpen, onClose, metric, brokers }: Props) {
  const [activeTab, setActiveTab] = useState<string>('')
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({})

  // Automatically select the first available branch tab when opened
  useEffect(() => {
    if (isOpen && !activeTab && BRANCH_ORDER.length > 0) {
      setActiveTab(BRANCH_ORDER[0])
    }
  }, [isOpen, activeTab])

  // Reset tab and expanded state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('')
      setExpandedTeams({})
    }
  }, [isOpen])

  if (!isOpen || !metric) return null

  // Calculate company total for percentage
  let companyTotal = 0
  brokers.forEach(b => {
    if (metric === 'fee_nay') companyTotal += b.fee_nay
    if (metric === 'mar_nay') companyTotal += b.mar_tong_nay
    if (metric === 'active_nay') companyTotal += b.active_nay
  })

  // Process data for the active tab
  const branchBrokers = brokers.filter(b => b.chi_nhanh === activeTab)
  
  // Group by team
  const teamsMap: Record<string, { total: number, marMarginTotal: number, mar3BenTotal: number, marUngTruocTotal: number, members: Broker[] }> = {}
  let totalBranch = 0
  let totalMarMargin = 0
  let totalMar3Ben = 0
  let totalMarUngTruoc = 0

  branchBrokers.forEach(b => {
    const t = b.team || 'Không xác định'
    let val = 0

    if (!teamsMap[t]) teamsMap[t] = { total: 0, marMarginTotal: 0, mar3BenTotal: 0, marUngTruocTotal: 0, members: [] }

    if (metric === 'fee_nay') val = b.fee_nay
    if (metric === 'mar_nay') {
      val = b.mar_tong_nay 
      totalMarMargin += b.mar_margin_nay || 0
      totalMar3Ben += b.mar_3ben_nay || 0
      totalMarUngTruoc += b.mar_ungtruoc_nay || 0

      teamsMap[t].marMarginTotal += b.mar_margin_nay || 0
      teamsMap[t].mar3BenTotal += b.mar_3ben_nay || 0
      teamsMap[t].marUngTruocTotal += b.mar_ungtruoc_nay || 0
    }
    if (metric === 'active_nay') val = b.active_nay

    teamsMap[t].total += val
    teamsMap[t].members.push(b)
    totalBranch += val
  })

  const sortedTeams = Object.entries(teamsMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)

  const toggleTeam = (t: string) => {
    setExpandedTeams(prev => ({ ...prev, [t]: !prev[t] }))
  }

  const formatValue = (v: number) => {
    if (metric === 'active_nay') return v.toLocaleString('vi-VN')
    return fmtVND(v)
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} style={{ margin: 0 }}>
      <div 
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            Chi tiết {METRIC_LABELS[metric]}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - horizontal scrolling */}
        <div className="flex px-2 border-b border-slate-200 overflow-x-auto flex-shrink-0 bg-white">
          {BRANCH_ORDER.map(branch => {
            const shortName = branch.replace('Chi nhánh ', '').replace('Phòng Giao dịch ', 'PGD ').replace('Hội Sở chính', 'Hội Sở')
            const isActive = branch === activeTab
            return (
              <button
                key={branch}
                onClick={() => { setActiveTab(branch); setExpandedTeams({}); }}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-brand-500 text-brand-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {shortName}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {metric === 'mar_nay' ? (
            <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-600">
                    Tổng dư nợ margin <span className="text-brand-600 ml-1">- {activeTab}</span>
                  </h3>
                  <span className="text-xl font-bold text-slate-800">{formatValue(totalBranch)}</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center items-center text-center hover:bg-slate-100 transition-colors">
                   <p className="text-xs text-slate-500 mb-1">Dư nợ Margin</p>
                   <p className="font-bold text-brand-600 text-[15px]">{formatValue(totalMarMargin)}</p>
                 </div>
                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center items-center text-center hover:bg-slate-100 transition-colors">
                   <p className="text-xs text-slate-500 mb-1">Dư nợ 3 Bên</p>
                   <p className="font-bold text-violet-600 text-[15px]">{formatValue(totalMar3Ben)}</p>
                 </div>
                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center items-center text-center hover:bg-slate-100 transition-colors">
                   <p className="text-xs text-slate-500 mb-1">Dư nợ Ứng Trước</p>
                   <p className="font-bold text-orange-500 text-[15px]">{formatValue(totalMarUngTruoc)}</p>
                 </div>
               </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500">
                Tổng {METRIC_LABELS[metric].toLowerCase()} 
                <span className="text-brand-600 ml-1">- {activeTab}</span>
              </h3>
              <span className="text-xl font-bold text-slate-800">{formatValue(totalBranch)}</span>
            </div>
          )}

          <div className="space-y-3">
            {sortedTeams.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">Không có dữ liệu cho chi nhánh này</div>
            )}
            {sortedTeams.map(team => {
              const isExpanded = expandedTeams[team.name]
              return (
                <div key={team.name} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleTeam(team.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-slate-700">{team.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full flex-shrink-0">
                        {team.members.length} MG
                      </span>
                    </div>
                    {metric === 'mar_nay' ? (
                      <div className="flex items-center gap-4 text-right flex-shrink-0">
                        <div className="hidden lg:flex flex-col items-end">
                           <span className="text-[10px] text-slate-400 mb-0.5">Dư nợ Margin</span>
                           <span className="text-sm font-medium text-slate-600">{formatValue(team.marMarginTotal)}</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-end">
                           <span className="text-[10px] text-slate-400 mb-0.5">Dư nợ 3 Bên</span>
                           <span className="text-sm font-medium text-slate-600">{formatValue(team.mar3BenTotal)}</span>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                           <span className="text-[10px] text-slate-400 mb-0.5">Dư nợ Ứng Trước</span>
                           <span className="text-sm font-medium text-slate-600">{formatValue(team.marUngTruocTotal)}</span>
                        </div>
                        <div className="flex flex-col items-end border-l border-slate-200 pl-4">
                           <span className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Tổng Dư Nợ</span>
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-brand-600">{formatValue(team.total)}</span>
                             <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                               {companyTotal > 0 ? ((team.total / companyTotal) * 100).toFixed(1) : 0}%
                             </span>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-slate-700">{formatValue(team.total)}</span>
                         <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                           {companyTotal > 0 ? ((team.total / companyTotal) * 100).toFixed(1) : 0}%
                         </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-max">
                        <thead>
                          <tr className="text-slate-400 font-medium whitespace-nowrap">
                            <th className="py-3 px-4 font-medium w-16">STT</th>
                            <th className="py-3 px-4 font-medium">Tên Môi Giới</th>
                            <th className="py-3 px-4 font-medium">Mã MG</th>
                            {metric === 'mar_nay' ? (
                              <>
                                <th className="py-3 px-4 font-medium text-right">Dư nợ Margin</th>
                                <th className="py-3 px-4 font-medium text-right">Dư nợ 3 Bên</th>
                                <th className="py-3 px-4 font-medium text-right">Dư nợ Ứng Trước</th>
                                <th className="py-3 px-4 font-medium text-right font-bold text-slate-500">Tổng Dư Nợ</th>
                              </>
                            ) : (
                              <th className="py-3 px-4 font-medium text-right">{METRIC_LABELS[metric]}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                          {team.members
                            .sort((a, b) => {
                              const valA = metric === 'fee_nay' ? a.fee_nay : metric === 'mar_nay' ? a.mar_tong_nay : a.active_nay
                              const valB = metric === 'fee_nay' ? b.fee_nay : metric === 'mar_nay' ? b.mar_tong_nay : b.active_nay
                              return valB - valA
                            })
                            .map((b, i) => {
                               const val = metric === 'fee_nay' ? b.fee_nay : metric === 'mar_nay' ? b.mar_tong_nay : b.active_nay
                               return (
                                <tr key={b.ma_mg} className="hover:bg-white transition-colors whitespace-nowrap">
                                  <td className="py-2.5 px-4 text-slate-400">{i + 1}</td>
                                  <td className="py-2.5 px-4 font-medium text-slate-700">{b.ho_ten}</td>
                                  <td className="py-2.5 px-4 text-slate-500">{b.ma_mg}</td>
                                  {metric === 'mar_nay' ? (
                                    <>
                                      <td className="py-2.5 px-4 text-slate-600 text-right">{formatValue(b.mar_margin_nay || 0)}</td>
                                      <td className="py-2.5 px-4 text-slate-600 text-right">{formatValue(b.mar_3ben_nay || 0)}</td>
                                      <td className="py-2.5 px-4 text-slate-600 text-right">{formatValue(b.mar_ungtruoc_nay || 0)}</td>
                                      <td className="py-2.5 px-4 text-slate-800 font-bold text-right">{formatValue(val)}</td>
                                    </>
                                  ) : (
                                    <td className="py-2.5 px-4 text-slate-700 font-semibold text-right">{formatValue(val)}</td>
                                  )}
                                </tr>
                               )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
