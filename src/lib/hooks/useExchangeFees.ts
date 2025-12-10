import useSWR from 'swr';
import { CEXFees } from '@/lib/types/exchange';

/**
 * Hook to fetch CEX exchange fees using real API data
 * Implements 24-hour caching as per real-data-only policy
 */
export function useExchangeFees() {
  const { data, error, isLoading } = useSWR('/api/cex-fees', {
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours - matches API cache
    dedupingInterval: 60000, // 1 minute
  });

  return {
    exchanges: data?.data as CEXFees[] | undefined,
    isLoading,
    isError: error,
    cachedAt: data?.cachedAt,
    isCached: data?.cached,
  };
}

/**
 * Hook to fetch exchange fees with custom configuration
 */
export function useExchangeFeesWithConfig(config?: {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR('/api/cex-fees', fetcher, {
    revalidateOnFocus: config?.revalidateOnFocus ?? false,
    revalidateOnReconnect: false,
    refreshInterval: config?.refreshInterval ?? 24 * 60 * 60 * 1000,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  return {
    exchanges: data?.data as CEXFees[] | undefined,
    isLoading,
    isError: error,
    cachedAt: data?.cachedAt,
    isCached: data?.cached,
    refresh: mutate,
  };
}