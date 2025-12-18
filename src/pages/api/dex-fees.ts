import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { DEX_CACHE_DURATION, DEX_CACHE_DURATION_SECONDS } from '@/config/constants';
import { 
  generateCacheHeaders, 
  isCacheValid, 
  logCacheOperation,
  initializeGlobalCache,
  getCacheState,
  setCacheState,
  setProcessingState
} from '@/lib/utils/cache-optimizer';
import { fetchCombinedDEXData } from '@/lib/api/coinmarketcap';
import { fetchDEXFeesFromAI, mergeDEXFeeData } from '@/lib/api/gemini';

// Get cache hours for logging
const DEX_CACHE_HOURS = parseInt(process.env.DEX_CACHE_HOURS || '72', 10);

/**
 * DEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinGecko: DEX listings, volumes, basic metadata
 * - Gemini AI: Real swap fees and gas estimates using AI-powered analysis
 * - Real API data only - no hardcoded lists
 * - Graceful degradation if APIs fail (empty array)
 * 
 * FLOW:
 * 1. Fetch DEX metadata from CoinGecko/DeFiLlama
 * 2. Use Gemini AI to collect real fee data for those DEXes
 * 3. Merge AI fee data with DEX metadata
 * 4. Cache for 24 hours to respect API limits
 */

// Global cache declarations
declare global {
  var dexCompleteCache: { data: any; timestamp: number } | null;
  var dexAIProcessing: boolean;
  var lastDEXAIError: string | null;
  var geminiCircuitBreaker: { blocked: boolean; until: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize global cache safely
  initializeGlobalCache();

  const { batch = '1', batchSize = '20' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Get cache state safely
    const cacheState = getCacheState('dex');
    
    // Check cache for complete AI-enhanced DEX data
    if (cacheState && isCacheValid(cacheState.timestamp, DEX_CACHE_DURATION)) {
      logCacheOperation('hit', 'dex', { batch: batchNum, totalDEXes: cacheState.data.length });
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = cacheState.data.slice(startIndex, endIndex);
      
      // Set optimized cache headers
      const headers = generateCacheHeaders('dex', false);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return res.status(200).json({
        data: batchData,
        cached: true,
        cachedAt: new Date(cacheState.timestamp).toISOString(),
        batch: batchNum,
        totalBatches: Math.ceil(cacheState.data.length / size),
        hasMore: endIndex < cacheState.data.length,
        backgroundProcessing: cacheState.isProcessing,
      });
    }

    // Cache expired or doesn't exist - rebuild complete DEX dataset
    logCacheOperation('miss', 'dex', { reason: 'Cache expired or missing' });

    // Fetch real DEX data from APIs
    const rawDEXData = await fetchCombinedDEXData();
    
    // Normalize DEX data (will be empty array if APIs fail)
    const normalizedData = rawDEXData.map(normalizeDEXData);

    // Cache the normalized data immediately
    setCacheState('dex', normalizedData);

    // Calculate batch response
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchData = normalizedData.slice(startIndex, endIndex);
    const totalBatches = Math.ceil(normalizedData.length / size);
    const hasMore = endIndex < normalizedData.length;

    // Check circuit breaker before starting AI enhancement
    const isCircuitBreakerActive = global.geminiCircuitBreaker && 
      global.geminiCircuitBreaker.blocked && 
      Date.now() < global.geminiCircuitBreaker.until;

    // Start AI enhancement in background (non-blocking) - only if not already processing
    if (process.env.GEMINI_API_KEY && normalizedData.length > 0 && !global.dexAIProcessing && !isCircuitBreakerActive) {
      setProcessingState('dex', true);
      console.log(`🚀 Starting background DEX AI enhancement for ${normalizedData.length} DEXes...`);
      
      // Background AI processing (async, no await)
      (async () => {
        try {
          let completeDataWithAI = [...normalizedData];
          const aiBatchSize = 10; // Smaller batches to reduce API load
          const totalAIBatches = Math.ceil(normalizedData.length / aiBatchSize);
          const delayBetweenBatches = 18000; // 18 seconds between DEX batches (longer than CEX)
          
          console.log(`📊 Processing ${totalAIBatches} DEX AI batches sequentially with ${delayBetweenBatches/1000}s delays...`);
          
          for (let i = 0; i < totalAIBatches; i++) {
            const batchStart = i * aiBatchSize;
            const batchEnd = batchStart + aiBatchSize;
            const batchDEXes = normalizedData.slice(batchStart, batchEnd);
            
            console.log(`🤖 Processing DEX AI batch ${i + 1}/${totalAIBatches} (${batchDEXes.length} DEXes)...`);
            
            try {
              const aiFeesData = await fetchDEXFeesFromAI(batchDEXes);
              
              if (aiFeesData.length > 0) {
                const enhancedBatch = mergeDEXFeeData(batchDEXes, aiFeesData);
                completeDataWithAI.splice(batchStart, batchDEXes.length, ...enhancedBatch);
                
                // Update cache incrementally after each successful batch
                setCacheState('dex', completeDataWithAI);
                
                console.log(`✓ Enhanced DEX batch ${i + 1}/${totalAIBatches} with AI fee data`);
              } else {
                console.log(`⚠️ DEX batch ${i + 1}/${totalAIBatches} returned no AI data`);
              }
            } catch (batchError) {
              const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
              console.error(`❌ DEX batch ${i + 1}/${totalAIBatches} failed:`, errorMessage);
              
              // Activate circuit breaker if API is overloaded
              if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
                global.geminiCircuitBreaker = {
                  blocked: true,
                  until: Date.now() + (30 * 60 * 1000) // Block for 30 minutes
                };
                console.log('🚫 Circuit breaker activated - stopping DEX AI enhancement for 30 minutes');
                break; // Stop processing more batches
              }
            }
            
            // Wait between batches to avoid overloading Gemini API
            if (i < totalAIBatches - 1) {
              console.log(`⏳ Waiting ${delayBetweenBatches/1000}s before next DEX batch...`);
              await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
          }
          
          // Final cache update with AI-enhanced data
          setCacheState('dex', completeDataWithAI);
          
          console.log(`🎉 Background DEX AI enhancement complete - cached for ${DEX_CACHE_HOURS} hours`);
          global.lastDEXAIError = null; // Clear error on success
        } catch (aiError) {
          const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown DEX AI error';
          console.error('Background DEX AI enhancement failed:', errorMessage);
          global.lastDEXAIError = errorMessage;
        } finally {
          setProcessingState('dex', false);
        }
      })();
    }

    // Set optimized cache headers for fresh data
    const headers = generateCacheHeaders('dex', false);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({
      data: batchData,
      cached: false,
      cachedAt: new Date().toISOString(),
      batch: batchNum,
      totalBatches,
      hasMore,
      totalDEXes: normalizedData.length,
      backgroundProcessing: !!process.env.GEMINI_API_KEY && !isCircuitBreakerActive,
    });
  } catch (error) {
    console.error('DEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
