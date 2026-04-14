export interface Broker {
  ma_mg: string
  ho_ten: string
  team: string
  chi_nhanh: string
  fee_truoc: number
  fee_nay: number
  fee_tuyet_doi: number
  fee_pct: number | null
  mar_margin_truoc: number
  mar_3ben_truoc: number
  mar_ungtruoc_truoc: number
  mar_tong_truoc: number
  mar_margin_nay: number
  mar_3ben_nay: number
  mar_ungtruoc_nay: number
  mar_tong_nay: number
  mar_tuyet_doi: number
  mar_pct: number | null
  active_truoc: number
  active_nay: number
  active_tuyet_doi: number
  active_pct: number | null
}

export interface DashboardStats {
  total_brokers: number
  total_teams: number
  total_branches: number
  total_fee_nay: number
  total_fee_truoc: number
  total_mar_nay: number
  total_mar_truoc: number
  total_active_nay: number
  total_active_truoc: number
}

export interface BranchSummary {
  chi_nhanh: string
  broker_count: number
  fee_nay: number
  fee_truoc: number
  mar_nay: number
  active_nay: number
}

export interface TeamSummary {
  team: string
  chi_nhanh: string
  broker_count: number
  fee_nay: number
  fee_truoc: number
  fee_pct: number | null
}
