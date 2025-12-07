import useSWR from 'swr';
import { CEXFees } from '@/lib/types/exchange';
import { APIResponse } from '@/lib/types/api';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useExchangeFees() {
  const { data, error, isLoading, mutate } = useSWR<APIResponse<CEXFees[]>>(
    '/api/cex-fees',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    fees: data?.data,
    isLoading,
    isError: error,
    cachedAt: data?.cachedAt,
    isCached: data?.cached,
    refetch: mutate,
  };
}
