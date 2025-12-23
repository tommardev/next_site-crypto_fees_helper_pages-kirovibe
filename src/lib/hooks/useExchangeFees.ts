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
  dedupingInterval: 2000,
  revalidateIfStale: false,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
};

/**
 * Enhanced CEX hook with automatic AI completion refresh
 * Loads complete dataset from cache or API, then automatically refreshes when AI processing completes
 */
export function useExchangeFees() {
  const [allExchanges, setAllExchanges] = useState<CEXFees[]>([]);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAIStatusRef = useRef<boolean>(false);

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

  // Enhanced polling for AI updates with automatic refresh
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only start polling if background processing is active
    if (!backgroundProcessing) {
      lastAIStatusRef.current = false;
      return;
    }

    console.log('🔄 Starting AI completion polling for CEX data...');
    lastAIStatusRef.current = true;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/cache-status');
        const status = await statusResponse.json();
        
        const isAIProcessing = status.cex?.aiProcessing || false;
        
        // Check if AI processing just completed (was true, now false)
        if (lastAIStatusRef.current && !isAIProcessing) {
          console.log('🎉 CEX AI processing completed! Auto-refreshing data...');
          
          // Force refresh with cache-busting
          setRefreshKey(prev => prev + 1);
          setBackgroundProcessing(false);
          
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
    }, 8000); // Poll every 8 seconds for faster updates

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
  };
}

/**
 * Enhanced DEX hook with automatic AI completion refresh
 * Loads complete dataset from cache or API, then automatically refreshes when AI processing completes
 */
export function useDEXFees() {
  const [allDEXes, setAllDEXes] = useState<any[]>([]);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAIStatusRef = useRef<boolean>(false);

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

  // Enhanced polling for AI updates with automatic refresh
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only start polling if background processing is active
    if (!backgroundProcessing) {
      lastAIStatusRef.current = false;
      return;
    }

    console.log('🔄 Starting AI completion polling for DEX data...');
    lastAIStatusRef.current = true;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/cache-status');
        const status = await statusResponse.json();
        
        const isAIProcessing = status.dex?.aiProcessing || false;
        
        // Check if AI processing just completed (was true, now false)
        if (lastAIStatusRef.current && !isAIProcessing) {
          console.log('🎉 DEX AI processing completed! Auto-refreshing data...');
          
          // Force refresh with cache-busting
          setRefreshKey(prev => prev + 1);
          setBackgroundProcessing(false);
          
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
    }, 8000); // Poll every 8 seconds for faster updates

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
  };
}