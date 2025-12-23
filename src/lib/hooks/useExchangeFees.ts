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

// Optimized SWR configuration for immediate data loading
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 1000, // Reduced for faster incremental updates
  revalidateIfStale: false,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
};

/**
 * Enhanced CEX hook with incremental AI batch refresh
 * Refreshes UI after each AI batch completion, with final notification only
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAIStatusRef = useRef<boolean>(false);
  const lastCacheTimestampRef = useRef<number>(0);
  const [showFinalNotification, setShowFinalNotification] = useState(false);

  // Load complete dataset immediately (from cache or fresh API call)
  // Use refreshKey to force cache-busting when AI completes
  const { data, error, isLoading, mutate } = useSWR(
    `/api/cex-fees?batch=all&_refresh=${refreshKey}`, // Cache-busting parameter
    fetcher, 
    swrConfig
  );

  // Update state when data changes
  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      setAllExchanges(data.data);
      setBackgroundProcessing(data.backgroundProcessing || false);
    }
  }, [data]);

  // Enhanced polling for incremental AI updates
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only start polling if background processing is active
    if (!backgroundProcessing) {
      lastAIStatusRef.current = false;
      setShowFinalNotification(false);
      return;
    }

    console.log('🔄 Starting incremental AI polling for CEX data...');
    lastAIStatusRef.current = true;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/cache-status');
        const status = await statusResponse.json();
        
        const isAIProcessing = status.cex?.aiProcessing || false;
        const currentCacheTimestamp = status.cex?.cacheTimestamp || 0;
        
        // Check for incremental cache updates (new AI batch completed)
        if (isAIProcessing && currentCacheTimestamp > lastCacheTimestampRef.current) {
          console.log('📈 CEX AI batch completed, refreshing incrementally...');
          
          // Silent refresh for incremental updates (no notification)
          setRefreshKey(prev => prev + 1);
          lastCacheTimestampRef.current = currentCacheTimestamp;
        }
        
        // Check if AI processing just completed entirely (was true, now false)
        if (lastAIStatusRef.current && !isAIProcessing) {
          console.log('🎉 CEX AI processing fully completed! Final refresh...');
          
          // Final refresh with notification flag
          setRefreshKey(prev => prev + 1);
          setBackgroundProcessing(false);
          setShowFinalNotification(true);
          
          // Clear polling interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        
        lastAIStatusRef.current = isAIProcessing;
      } catch (error) {
        console.error('Error checking CEX AI status:', error);
      }
    }, 5000); // Poll every 5 seconds for faster incremental updates

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [backgroundProcessing]);

  const refresh = useCallback(async () => {
    try {
      // Force refresh with cache-busting
      setRefreshKey(prev => prev + 1);
      await mutate();
    } catch (error) {
      console.error('Error refreshing CEX data:', error);
      throw error;
    }
  }, [mutate]);

  return {
    exchanges: allExchanges,
    isLoading,
    isError: error,
    backgroundLoading: backgroundProcessing,
    cachedAt: data?.cachedAt,
    isCached: data?.cached,
    totalBatches: 1, // Simplified - all data loaded at once
    loadedBatches: 1,
    progress: 100, // Always 100% since we load all data
    refresh,
    showFinalNotification, // Flag for final completion notification
  };
}

/**
 * Enhanced DEX hook with incremental AI batch refresh
 * Refreshes UI after each AI batch completion, with final notification only
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAIStatusRef = useRef<boolean>(false);
  const lastCacheTimestampRef = useRef<number>(0);
  const [showFinalNotification, setShowFinalNotification] = useState(false);

  // Load complete dataset immediately (from cache or fresh API call)
  // Use refreshKey to force cache-busting when AI completes
  const { data, error, isLoading, mutate } = useSWR(
    `/api/dex-fees?batch=all&_refresh=${refreshKey}`, // Cache-busting parameter
    fetcher, 
    swrConfig
  );

  // Update state when data changes
  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      setAllDEXes(data.data);
      setBackgroundProcessing(data.backgroundProcessing || false);
    }
  }, [data]);

  // Enhanced polling for incremental AI updates
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only start polling if background processing is active
    if (!backgroundProcessing) {
      lastAIStatusRef.current = false;
      setShowFinalNotification(false);
      return;
    }

    console.log('🔄 Starting incremental AI polling for DEX data...');
    lastAIStatusRef.current = true;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/cache-status');
        const status = await statusResponse.json();
        
        const isAIProcessing = status.dex?.aiProcessing || false;
        const currentCacheTimestamp = status.dex?.cacheTimestamp || 0;
        
        // Check for incremental cache updates (new AI batch completed)
        if (isAIProcessing && currentCacheTimestamp > lastCacheTimestampRef.current) {
          console.log('📈 DEX AI batch completed, refreshing incrementally...');
          
          // Silent refresh for incremental updates (no notification)
          setRefreshKey(prev => prev + 1);
          lastCacheTimestampRef.current = currentCacheTimestamp;
        }
        
        // Check if AI processing just completed entirely (was true, now false)
        if (lastAIStatusRef.current && !isAIProcessing) {
          console.log('🎉 DEX AI processing fully completed! Final refresh...');
          
          // Final refresh with notification flag
          setRefreshKey(prev => prev + 1);
          setBackgroundProcessing(false);
          setShowFinalNotification(true);
          
          // Clear polling interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        
        lastAIStatusRef.current = isAIProcessing;
      } catch (error) {
        console.error('Error checking DEX AI status:', error);
      }
    }, 5000); // Poll every 5 seconds for faster incremental updates

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [backgroundProcessing]);

  const refresh = useCallback(async () => {
    try {
      // Force refresh with cache-busting
      setRefreshKey(prev => prev + 1);
      await mutate();
    } catch (error) {
      console.error('Error refreshing DEX data:', error);
      throw error;
    }
  }, [mutate]);

  return {
    dexes: allDEXes,
    isLoading,
    isError: error,
    backgroundLoading: backgroundProcessing,
    cachedAt: data?.cachedAt,
    isCached: data?.cached,
    totalBatches: 1, // Simplified - all data loaded at once
    loadedBatches: 1,
    progress: 100, // Always 100% since we load all data
    refresh,
    showFinalNotification, // Flag for final completion notification
  };
}