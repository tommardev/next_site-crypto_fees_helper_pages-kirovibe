import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';
import { CEXFees } from '@/lib/types/exchange';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch CEX exchange fees with progressive loading
 * Loads first batch immediately, then loads additional batches in background
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(1);

  // Load first batch (smaller for faster initial load)
  const { data: firstBatch, error, isLoading } = useSWR('/api/cex-fees?batch=1&batchSize=8', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    dedupingInterval: 60000,
  });

  // Load additional batches
  const loadNextBatch = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextBatch = currentBatch + 1;
      const response = await fetch(`/api/cex-fees-batch?batch=${nextBatch}&batchSize=8`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setAllExchanges(prev => [...prev, ...data.data]);
        setCurrentBatch(nextBatch);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading next batch:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentBatch, hasMore, isLoadingMore]);

  // Initialize with first batch
  useEffect(() => {
    if (firstBatch?.data) {
      setAllExchanges(firstBatch.data);
      setHasMore(firstBatch.hasMore ?? true);
      setCurrentBatch(1);
    }
  }, [firstBatch]);

  // Auto-load next batch after first batch loads
  useEffect(() => {
    if (firstBatch?.data && hasMore && currentBatch === 1) {
      // Load second batch automatically after a short delay
      const timer = setTimeout(() => {
        loadNextBatch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [firstBatch, hasMore, currentBatch, loadNextBatch]);

  return {
    exchanges: allExchanges,
    isLoading,
    isError: error,
    isLoadingMore,
    hasMore,
    loadMore: loadNextBatch,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches: firstBatch?.totalBatches,
    currentBatch,
  };
}

/**
 * Hook to fetch DEX fees with progressive loading
 * Loads first batch immediately, then loads additional batches in background
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(1);

  // Load first batch
  const { data: firstBatch, error, isLoading } = useSWR('/api/dex-fees?batch=1&batchSize=8', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    dedupingInterval: 60000,
  });

  // Load additional batches
  const loadNextBatch = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextBatch = currentBatch + 1;
      const response = await fetch(`/api/dex-fees-batch?batch=${nextBatch}&batchSize=8`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setAllDEXes(prev => [...prev, ...data.data]);
        setCurrentBatch(nextBatch);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading next DEX batch:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentBatch, hasMore, isLoadingMore]);

  // Initialize with first batch
  useEffect(() => {
    if (firstBatch?.data) {
      setAllDEXes(firstBatch.data);
      setHasMore(firstBatch.hasMore ?? true);
      setCurrentBatch(1);
    }
  }, [firstBatch]);

  // Auto-load next batch after first batch loads
  useEffect(() => {
    if (firstBatch?.data && hasMore && currentBatch === 1) {
      // Load second batch automatically after a short delay
      const timer = setTimeout(() => {
        loadNextBatch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [firstBatch, hasMore, currentBatch, loadNextBatch]);

  return {
    dexes: allDEXes,
    isLoading,
    isError: error,
    isLoadingMore,
    hasMore,
    loadMore: loadNextBatch,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches: firstBatch?.totalBatches,
    currentBatch,
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