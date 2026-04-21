export interface BrokerMonthly {
  month_date: string          // 'YYYY-MM-DD'
  ma_mg: string
  ho_ten: string
  team: string
  chi_nhanh: string
  fee: number
  mar_margin: number
  mar_3ben: number
  mar_ungtruoc: number
  mar_tong: number
  active: number
}

export interface BrokerMoM {
  month_date: string
  ma_mg: string
  ho_ten: string
  team: string
  chi_nhanh: string
  fee_nay: number
  fee_truoc: number
  fee_tuyet_doi: number
  fee_pct: number | null
  mar_nay: number
  mar_truoc: number
  mar_tuyet_doi: number
  mar_pct: number | null
  mar_margin: number
  mar_3ben: number
  mar_ungtruoc: number
  active_nay: number
  active_truoc: number
  active_tuyet_doi: number
  active_pct: number | null
}

export interface BrokerQuarterly {
  quarter_date: string
  quarter_num: number
  year_num: number
  ma_mg: string
  ho_ten: string
  team: string
  chi_nhanh: string
  fee_qtd: number
  months_count: number
  mar_tong_avg: number
  mar_margin_avg: number
  mar_3ben_avg: number
  mar_ungtruoc_avg: number
  active_max: number
  active_avg: number
}

export interface PeriodOption {
  label: string               // VD: 'Tháng 3/2026', 'Q1/2026'
  type: 'month' | 'quarter' | 'year'
  value: string               // VD: '2026-03-01', '2026-01-01' (quarter = ngày đầu quý)
}

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
  mar_margin: number;
  mar_3ben: number;
  mar_ungtruoc: number;
  active_nay: number;
  active_truoc: number;
  active_tuyet_doi: number;
  active_pct: number | null;
}
