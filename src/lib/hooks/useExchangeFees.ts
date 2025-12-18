import useSWR from 'swr';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CEXFees } from '@/lib/types/exchange';

// SWR fetcher function with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Stable SWR configuration with cache-busting for AI updates
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 5000, // Reduced to 5 seconds to allow faster updates
  revalidateIfStale: false,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
};

/**
 * Hook to fetch CEX exchange fees with stable progressive loading
 * Loads first batch immediately, then loads additional batches in background
 * Polls for AI updates when background processing is active
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load first batch with stable configuration
  const { data: firstBatch, error, isLoading, mutate } = useSWR(
    '/api/cex-fees?batch=1&batchSize=20', 
    fetcher, 
    swrConfig
  );

  // Stable background loading function
  const loadRemainingBatches = useCallback(async (totalBatches: number, initialData: CEXFees[]) => {
    if (totalBatches <= 1 || loadingRef.current) return;
    
    loadingRef.current = true;
    setBackgroundLoading(true);
    
    try {
      // Pre-allocate array with correct size
      const completeExchanges = new Array(totalBatches * 20);
      
      // Set initial batch data
      initialData.forEach((exchange, index) => {
        completeExchanges[index] = exchange;
      });
      
      // Load remaining batches sequentially
      for (let batch = 2; batch <= totalBatches; batch++) {
        try {
          const response = await fetch(`/api/cex-fees?batch=${batch}&batchSize=20`);
          
          if (!response.ok) {
            console.warn(`Batch ${batch} failed with status ${response.status}`);
            continue;
          }
          
          const data = await response.json();

          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const startIndex = (batch - 1) * 20;
            
            // Insert batch data at correct position
            data.data.forEach((exchange: CEXFees, index: number) => {
              completeExchanges[startIndex + index] = exchange;
            });
            
            // Update state with current progress
            setAllExchanges([...completeExchanges.filter(Boolean)]);
            setLoadedBatches(batch);
          }
          
          // Small delay between batches to prevent overwhelming
          if (batch < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (batchError) {
          console.error(`Error loading CEX batch ${batch}:`, batchError);
        }
      }
    } catch (error) {
      console.error('Background loading failed:', error);
    } finally {
      setBackgroundLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data) {
      const exchanges = Array.isArray(firstBatch.data) ? firstBatch.data : [];
      const batches = firstBatch.totalBatches || 1;
      
      // Always update the first batch data (this handles both initial load and refresh)
      setAllExchanges(exchanges);
      setTotalBatches(batches);
      setLoadedBatches(1);
      
      // Only start background loading if not already initialized or if this is a refresh
      if ((batches > 1 && exchanges.length > 0) && (!initializedRef.current || !firstBatch.cached)) {
        initializedRef.current = true;
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          loadRemainingBatches(batches, exchanges);
        }, 200);
      } else if (batches === 1) {
        // Single batch case
        initializedRef.current = true;
      }
    }
  }, [firstBatch, loadRemainingBatches]);

  // Reload all batches with fresh data (complete reset)
  const reloadAllBatches = useCallback(async () => {
    try {
      console.log('🔄 Reloading all batches with fresh AI-enhanced data...');
      
      // Reset state completely
      setAllExchanges([]);
      setLoadedBatches(0);
      initializedRef.current = false;
      loadingRef.current = false;
      
      // Force refresh first batch
      await mutate();
      
      // The useEffect will handle reloading all batches when firstBatch updates
    } catch (error) {
      console.error('Error reloading batches:', error);
    }
  }, [mutate]);

  // Poll for AI updates when background processing is active
  useEffect(() => {
    if (firstBatch?.backgroundProcessing) {
      // Start polling every 15 seconds when AI is processing
      pollIntervalRef.current = setInterval(async () => {
        try {
          // Check if AI processing is still active
          const statusResponse = await fetch('/api/cache-status');
          const status = await statusResponse.json();
          
          if (!status.cex?.aiProcessing) {
            // AI processing completed, reload ALL data
            console.log('🔄 AI processing completed, reloading all batches...');
            await reloadAllBatches();
            
            // Clear polling interval
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error checking AI status:', error);
        }
      }, 15000); // Poll every 15 seconds for faster updates
    }

    // Cleanup polling on unmount or when processing stops
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [firstBatch?.backgroundProcessing, reloadAllBatches]);

  // Reset when data changes (cache refresh)
  useEffect(() => {
    if (firstBatch?.cached === false && initializedRef.current) {
      initializedRef.current = false;
      loadingRef.current = false;
    }
  }, [firstBatch?.cached]);

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
    refresh: reloadAllBatches, // Expose refresh function
  };
}

/**
 * Hook to fetch DEX fees with stable progressive loading
 * Loads first batch immediately, then loads additional batches in background
 * Polls for AI updates when background processing is active
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load first batch with stable configuration
  const { data: firstBatch, error, isLoading, mutate } = useSWR(
    '/api/dex-fees?batch=1&batchSize=20', 
    fetcher, 
    swrConfig
  );

  // Stable background loading function
  const loadRemainingBatches = useCallback(async (totalBatches: number, initialData: any[]) => {
    if (totalBatches <= 1 || loadingRef.current) return;
    
    loadingRef.current = true;
    setBackgroundLoading(true);
    
    try {
      // Pre-allocate array with correct size
      const completeDEXes = new Array(totalBatches * 20);
      
      // Set initial batch data
      initialData.forEach((dex, index) => {
        completeDEXes[index] = dex;
      });
      
      // Load remaining batches sequentially
      for (let batch = 2; batch <= totalBatches; batch++) {
        try {
          const response = await fetch(`/api/dex-fees?batch=${batch}&batchSize=20`);
          
          if (!response.ok) {
            console.warn(`DEX Batch ${batch} failed with status ${response.status}`);
            continue;
          }
          
          const data = await response.json();

          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const startIndex = (batch - 1) * 20;
            
            // Insert batch data at correct position
            data.data.forEach((dex: any, index: number) => {
              completeDEXes[startIndex + index] = dex;
            });
            
            // Update state with current progress
            setAllDEXes([...completeDEXes.filter(Boolean)]);
            setLoadedBatches(batch);
          }
          
          // Small delay between batches to prevent overwhelming
          if (batch < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (batchError) {
          console.error(`Error loading DEX batch ${batch}:`, batchError);
        }
      }
    } catch (error) {
      console.error('DEX background loading failed:', error);
    } finally {
      setBackgroundLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initialize with first batch and start background loading
  useEffect(() => {
    if (firstBatch?.data) {
      const dexes = Array.isArray(firstBatch.data) ? firstBatch.data : [];
      const batches = firstBatch.totalBatches || 1;
      
      // Always update the first batch data (this handles both initial load and refresh)
      setAllDEXes(dexes);
      setTotalBatches(batches);
      setLoadedBatches(1);
      
      // Only start background loading if not already initialized or if this is a refresh
      if ((batches > 1 && dexes.length > 0) && (!initializedRef.current || !firstBatch.cached)) {
        initializedRef.current = true;
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          loadRemainingBatches(batches, dexes);
        }, 200);
      } else if (batches === 1) {
        // Single batch case
        initializedRef.current = true;
      }
    }
  }, [firstBatch, loadRemainingBatches]);

  // Reload all DEX batches with fresh data (complete reset)
  const reloadAllDEXBatches = useCallback(async () => {
    try {
      console.log('🔄 Reloading all DEX batches with fresh AI-enhanced data...');
      
      // Reset state completely
      setAllDEXes([]);
      setLoadedBatches(0);
      initializedRef.current = false;
      loadingRef.current = false;
      
      // Force refresh first batch
      await mutate();
      
      // The useEffect will handle reloading all batches when firstBatch updates
    } catch (error) {
      console.error('Error reloading DEX batches:', error);
    }
  }, [mutate]);

  // Poll for AI updates when background processing is active
  useEffect(() => {
    if (firstBatch?.backgroundProcessing) {
      // Start polling every 15 seconds when AI is processing
      pollIntervalRef.current = setInterval(async () => {
        try {
          // Check if AI processing is still active
          const statusResponse = await fetch('/api/cache-status');
          const status = await statusResponse.json();
          
          if (!status.dex?.aiProcessing) {
            // AI processing completed, reload ALL data
            console.log('🔄 DEX AI processing completed, reloading all batches...');
            await reloadAllDEXBatches();
            
            // Clear polling interval
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error checking DEX AI status:', error);
        }
      }, 15000); // Poll every 15 seconds for faster updates
    }

    // Cleanup polling on unmount or when processing stops
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [firstBatch?.backgroundProcessing, reloadAllDEXBatches]);

  // Reset when data changes (cache refresh)
  useEffect(() => {
    if (firstBatch?.cached === false && initializedRef.current) {
      initializedRef.current = false;
      loadingRef.current = false;
    }
  }, [firstBatch?.cached]);

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
    refresh: reloadAllDEXBatches, // Expose refresh function
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