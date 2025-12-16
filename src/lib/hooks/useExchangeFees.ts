import useSWR, { mutate } from 'swr';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CEXFees } from '@/lib/types/exchange';
import { CEX_CACHE_DURATION, DEX_CACHE_DURATION } from '@/config/constants';
import { useRealtimeUpdates } from './useRealtimeUpdates';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch CEX exchange fees with progressive loading and real-time updates
 * Loads first batch immediately, then loads additional batches in background
 * Automatically refreshes UI when AI processing completes using Server-Sent Events
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const isLoadingBatchesRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Use real-time updates hook for instant UI updates
  const { 
    aiStatus, 
    isConnected, 
    lastUpdate, 
    isCEXProcessing, 
    cexProgress 
  } = useRealtimeUpdates();

  // Load first batch
  const { data: firstBatch, error, isLoading } = useSWR('/api/cex-fees?batch=1&batchSize=10', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable automatic refresh - rely on server cache and SSE
    dedupingInterval: CEX_CACHE_DURATION, // Use cache duration for deduping
    revalidateIfStale: false, // Don't revalidate stale data automatically
  });

  // Background loading of remaining batches
  const loadRemainingBatches = useCallback(async (totalBatches: number) => {
    if (totalBatches <= 1 || isLoadingBatchesRef.current) return;
    
    isLoadingBatchesRef.current = true;
    
    for (let batch = 2; batch <= totalBatches; batch++) {
      try {
        const response = await fetch(`/api/cex-fees-batch?batch=${batch}&batchSize=10`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setAllExchanges(prev => {
            // Create a new array with proper size
            const newExchanges = new Array(totalBatches * 10);
            
            // Copy existing valid exchanges
            prev.forEach((exchange, index) => {
              if (exchange && exchange.exchangeName) {
                newExchanges[index] = exchange;
              }
            });
            
            // Insert new batch data at correct positions
            const startIndex = (batch - 1) * 10;
            data.data.forEach((exchange: CEXFees, index: number) => {
              if (exchange && exchange.exchangeName) {
                newExchanges[startIndex + index] = exchange;
              }
            });
            
            // Return only valid exchanges (filter out undefined)
            return newExchanges.filter(exchange => exchange && exchange.exchangeName);
          });
          setLoadedBatches(batch);
        }
      } catch (error) {
        console.error(`Error loading CEX batch ${batch}:`, error);
      }
    }
    
    isLoadingBatchesRef.current = false;
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Filter out any undefined/invalid exchanges from initial data
      const validExchanges = firstBatch.data.filter((exchange: CEXFees) => 
        exchange && exchange.exchangeName
      );
      setAllExchanges(validExchanges);
      setTotalBatches(firstBatch.totalBatches || 1);
      setLoadedBatches(1);
      
      // Start background loading after a short delay
      if (firstBatch.totalBatches > 1) {
        setTimeout(() => {
          loadRemainingBatches(firstBatch.totalBatches);
        }, 500);
      }
    }
  }, [firstBatch?.data, loadRemainingBatches]);

  return {
    exchanges: allExchanges,
    isLoading,
    isError: error,
    backgroundLoading: isCEXProcessing,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches,
    loadedBatches,
    progress: totalBatches > 0 ? (loadedBatches / totalBatches) * 100 : 0,
    aiProcessingComplete: !isCEXProcessing && cexProgress > 0,
    refreshData: () => mutate('/api/cex-fees?batch=1&batchSize=10'),
    // Real-time status from SSE
    isConnected,
    lastUpdate,
    aiProgress: cexProgress,
  };
}

/**
 * Hook to fetch DEX fees with progressive loading and real-time updates
 * Loads first batch immediately, then loads additional batches in background
 * Automatically refreshes UI when AI processing completes using Server-Sent Events
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const isLoadingBatchesRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Use real-time updates hook for instant UI updates
  const { 
    aiStatus, 
    isConnected, 
    lastUpdate, 
    isDEXProcessing, 
    dexProgress 
  } = useRealtimeUpdates();

  // Load first batch
  const { data: firstBatch, error, isLoading } = useSWR('/api/dex-fees?batch=1&batchSize=10', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable automatic refresh - rely on server cache and SSE
    dedupingInterval: DEX_CACHE_DURATION, // Use cache duration for deduping
    revalidateIfStale: false, // Don't revalidate stale data automatically
  });

  // Background loading of remaining batches
  const loadRemainingDEXBatches = useCallback(async (totalBatches: number) => {
    if (totalBatches <= 1 || isLoadingBatchesRef.current) return;
    
    isLoadingBatchesRef.current = true;
    
    for (let batch = 2; batch <= totalBatches; batch++) {
      try {
        const response = await fetch(`/api/dex-fees-batch?batch=${batch}&batchSize=10`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setAllDEXes(prev => {
            // Create a new array with proper size
            const newDEXes = new Array(totalBatches * 10);
            
            // Copy existing valid DEXes
            prev.forEach((dex, index) => {
              if (dex && dex.dexName) {
                newDEXes[index] = dex;
              }
            });
            
            // Insert new batch data at correct positions
            const startIndex = (batch - 1) * 10;
            data.data.forEach((dex: any, index: number) => {
              if (dex && dex.dexName) {
                newDEXes[startIndex + index] = dex;
              }
            });
            
            // Return only valid DEXes (filter out undefined)
            return newDEXes.filter(dex => dex && dex.dexName);
          });
          setLoadedBatches(batch);
        }
      } catch (error) {
        console.error(`Error loading DEX batch ${batch}:`, error);
      }
    }
    
    isLoadingBatchesRef.current = false;
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Filter out any undefined/invalid DEXes from initial data
      const validDEXes = firstBatch.data.filter((dex: any) => 
        dex && dex.dexName
      );
      setAllDEXes(validDEXes);
      setTotalBatches(firstBatch.totalBatches || 1);
      setLoadedBatches(1);
      
      // Start background loading after a short delay
      if (firstBatch.totalBatches > 1) {
        setTimeout(() => {
          loadRemainingDEXBatches(firstBatch.totalBatches);
        }, 500);
      }
    }
  }, [firstBatch?.data, loadRemainingDEXBatches]);

  return {
    dexes: allDEXes,
    isLoading,
    isError: error,
    backgroundLoading: isDEXProcessing,
    cachedAt: firstBatch?.cachedAt,
    isCached: firstBatch?.cached,
    totalBatches,
    loadedBatches,
    progress: totalBatches > 0 ? (loadedBatches / totalBatches) * 100 : 0,
    aiProcessingComplete: !isDEXProcessing && dexProgress > 0,
    refreshData: () => mutate('/api/dex-fees?batch=1&batchSize=10'),
    // Real-time status from SSE
    isConnected,
    lastUpdate,
    aiProgress: dexProgress,
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