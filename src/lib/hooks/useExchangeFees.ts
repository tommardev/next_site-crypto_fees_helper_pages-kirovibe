import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';
import { CEXFees } from '@/lib/types/exchange';
import { CEX_CACHE_DURATION, DEX_CACHE_DURATION } from '@/config/constants';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch CEX exchange fees with progressive loading
 * Loads first batch immediately, then loads additional batches in background
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);

  // Load first batch
  const { data: firstBatch, error, isLoading } = useSWR('/api/cex-fees?batch=1&batchSize=10', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable automatic refresh - rely on server cache
    dedupingInterval: CEX_CACHE_DURATION, // Use cache duration for deduping
    revalidateIfStale: false, // Don't revalidate stale data automatically
  });

  // Background loading of remaining batches
  const loadRemainingBatches = useCallback(async (totalBatches: number) => {
    if (totalBatches <= 1) return;

    setBackgroundLoading(true);
    
    for (let batch = 2; batch <= totalBatches; batch++) {
      try {
        const response = await fetch(`/api/cex-fees-batch?batch=${batch}&batchSize=10`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setAllExchanges(prev => {
            // Ensure correct ordering by inserting at the right position
            const newExchanges = [...prev];
            const startIndex = (batch - 1) * 10;
            
            // Replace or insert the batch data at the correct position
            data.data.forEach((exchange: CEXFees, index: number) => {
              newExchanges[startIndex + index] = exchange;
            });
            
            return newExchanges;
          });
          setLoadedBatches(batch);
        }
      } catch (error) {
        console.error(`Error loading CEX batch ${batch}:`, error);
      }
    }
    
    setBackgroundLoading(false);
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data) {
      setAllExchanges(firstBatch.data);
      setTotalBatches(firstBatch.totalBatches || 1);
      setLoadedBatches(1);
      
      // Start background loading after a short delay
      if (firstBatch.totalBatches > 1) {
        setTimeout(() => {
          loadRemainingBatches(firstBatch.totalBatches);
        }, 500);
      }
    }
  }, [firstBatch, loadRemainingBatches]);

  return {
    exchanges: allExchanges,
    isLoading,
    isError: error,
    backgroundLoading,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches,
    loadedBatches,
    progress: totalBatches > 0 ? (loadedBatches / totalBatches) * 100 : 0,
  };
}

/**
 * Hook to fetch DEX fees with progressive loading
 * Loads first batch immediately, then loads additional batches in background
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);

  // Load first batch
  const { data: firstBatch, error, isLoading } = useSWR('/api/dex-fees?batch=1&batchSize=10', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable automatic refresh - rely on server cache
    dedupingInterval: DEX_CACHE_DURATION, // Use cache duration for deduping
    revalidateIfStale: false, // Don't revalidate stale data automatically
  });

  // Background loading of remaining batches
  const loadRemainingBatches = useCallback(async (totalBatches: number) => {
    if (totalBatches <= 1) return;

    setBackgroundLoading(true);
    
    for (let batch = 2; batch <= totalBatches; batch++) {
      try {
        const response = await fetch(`/api/dex-fees-batch?batch=${batch}&batchSize=10`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setAllDEXes(prev => {
            // Ensure correct ordering by inserting at the right position
            const newExchanges = [...prev];
            const startIndex = (batch - 1) * 10;
            
            // Replace or insert the batch data at the correct position
            data.data.forEach((dex: any, index: number) => {
              newExchanges[startIndex + index] = dex;
            });
            
            return newExchanges;
          });
          setLoadedBatches(batch);
        }
      } catch (error) {
        console.error(`Error loading DEX batch ${batch}:`, error);
      }
    }
    
    setBackgroundLoading(false);
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data) {
      setAllDEXes(firstBatch.data);
      setTotalBatches(firstBatch.totalBatches || 1);
      setLoadedBatches(1);
      
      // Start background loading after a short delay
      if (firstBatch.totalBatches > 1) {
        setTimeout(() => {
          loadRemainingBatches(firstBatch.totalBatches);
        }, 500);
      }
    }
  }, [firstBatch, loadRemainingBatches]);

  return {
    dexes: allDEXes,
    isLoading,
    isError: error,
    backgroundLoading,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches,
    loadedBatches,
    progress: totalBatches > 0 ? (loadedBatches / totalBatches) * 100 : 0,
  };
}

// /**
//  * Hook to fetch exchange fees with custom configuration
//  */
// export function useExchangeFeesWithConfig(config?: {
//   refreshInterval?: number;
//   revalidateOnFocus?: boolean;
// }) {
//   const { data, error, isLoading, mutate } = useSWR('/api/cex-fees', fetcher, {
//     revalidateOnFocus: config?.revalidateOnFocus ?? false,
//     revalidateOnReconnect: false,
//     refreshInterval: config?.refreshInterval ?? 0, // Disable by default
//     dedupingInterval: CEX_CACHE_DURATION, // Use cache duration for deduping
//     revalidateIfStale: false,
//     errorRetryCount: 3,
//     errorRetryInterval: 5000,
//   });

//   return {
//     exchanges: data?.data as CEXFees[] | undefined,
//     isLoading,
//     isError: error,
//     cachedAt: data?.cachedAt,
//     isCached: data?.cached,
//     refresh: mutate,
//   };
// }