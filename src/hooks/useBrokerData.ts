import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BrokerMoM, BrokerQuarterly } from '@/lib/types'

// Hook 1: Lấy danh sách tháng có trong DB
export function useAvailableMonths() {
  return useQuery({
    queryKey: ['available-months'],
    queryFn: async () => {
      const { data } = await createClient()
        .from('broker_monthly')
        .select('month_date')
        .order('month_date', { ascending: false })
      // Deduplicate và return string[]
      return [...new Set(data?.map(d => d.month_date))] as string[]
    },
    staleTime: 10 * 60 * 1000  // 10 phút
  })
}

// Hook 2: Lấy dữ liệu MoM của 1 tháng cụ thể (dùng view v_broker_mom)
export function useBrokerMoM(monthDate: string) {
  return useQuery({
    queryKey: ['broker-mom', monthDate],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('v_broker_mom')
        .select('*')
        .eq('month_date', monthDate)
        .limit(5000)
      if (error) throw error
      return data as BrokerMoM[]
    },
    enabled: !!monthDate,
    staleTime: 5 * 60 * 1000
  })
}

// Hook 3: Lấy dữ liệu Quý (dùng view v_broker_quarterly)
export function useBrokerQuarterly(quarterDate: string) {
  return useQuery({
    queryKey: ['broker-quarterly', quarterDate],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('v_broker_quarterly')
        .select('*')
        .eq('quarter_date', quarterDate)
        .limit(5000)
      if (error) throw error
      return data as BrokerQuarterly[]
    },
    enabled: !!quarterDate,
    staleTime: 5 * 60 * 1000
  })
}
