import useSWR from 'swr';
import { DEXFees } from '@/lib/types/exchange';
import { APIResponse } from '@/lib/types/api';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useDEXFees() {
  const { data, error, isLoading, mutate } = useSWR<APIResponse<DEXFees[]>>(
    '/api/dex-fees',
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
