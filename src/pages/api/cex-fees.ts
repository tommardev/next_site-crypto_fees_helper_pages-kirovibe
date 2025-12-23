import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCombinedExchangeData } from '@/lib/api/coinmarketcap';
import { normalizeCombinedExchangeData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CEX_CACHE_DURATION, CEX_CACHE_DURATION_SECONDS } from '@/config/constants';
import { 
  generateCacheHeaders, 
  isCacheValid, 
  logCacheOperation,
  initializeGlobalCache,
  getCacheState,
  setCacheState,
  setProcessingState
} from '@/lib/utils/cache-optimizer';
import { fetchCEXFeesFromAI, mergeCEXFeeData } from '@/lib/api/gemini';

// Get cache hours for logging
const CEX_CACHE_HOURS = parseInt(process.env.CEX_CACHE_HOURS || '72', 10);

/**
 * CEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinMarketCap: Exchange rankings, volumes, basic metadata (CMC fee data is unreliable)
 * - CoinGecko: Trust scores, additional metadata
 * - Gemini AI: Real fee data collection using AI-powered analysis
 * 
 * FLOW:
 * 1. Fetch exchange metadata from CMC/CoinGecko
 * 2. Use Gemini AI to collect real fee data for those exchanges
 * 3. Merge AI fee data with exchange metadata
 * 4. Cache for 24 hours to respect API limits
 */

// Global cache declarations
declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
  var lastAIError: string | null;
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

  const { batch = '1', batchSize = '20', _refresh } = req.query;
  const batchNum = batch === 'all' ? 1 : parseInt(batch as string, 10);
  const size = batch === 'all' ? 1000 : parseInt(batchSize as string, 10); // Load all data when batch=all

  try {
    // Get cache state safely
    const cacheState = getCacheState('cex');
    
    // Check cache for complete AI-enhanced data
    if (cacheState && isCacheValid(cacheState.timestamp, CEX_CACHE_DURATION)) {
      logCacheOperation('hit', 'cex', { batch: batchNum, totalExchanges: cacheState.data.length });
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = cacheState.data.slice(startIndex, endIndex);
      
      // Set optimized cache headers
      const headers = generateCacheHeaders('cex', false);
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

    // Cache expired or doesn't exist - rebuild complete dataset
    logCacheOperation('miss', 'cex', { reason: 'Cache expired or missing' });

    // Check if API key is configured
    if (!process.env.COINMARKETCAP_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'COINMARKETCAP_API_KEY environment variable is required for exchange rankings and metadata. Get your free API key at https://pro.coinmarketcap.com/signup',
      });
    }

    // Fetch combined data from CMC (volumes, rankings) + CoinGecko (trust scores)
    const rawData = await fetchCombinedExchangeData(50);
    
    // Normalize data with placeholder fee values
    const normalizedData = rawData.map(normalizeCombinedExchangeData);

    // Cache the normalized data immediately
    setCacheState('cex', normalizedData);

    // Calculate batch response - handle "all" case
    let batchData, totalBatches, hasMore;
    if (batch === 'all') {
      batchData = normalizedData; // Return all data
      totalBatches = 1;
      hasMore = false;
    } else {
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      batchData = normalizedData.slice(startIndex, endIndex);
      totalBatches = Math.ceil(normalizedData.length / size);
      hasMore = endIndex < normalizedData.length;
    }

    // Check circuit breaker before starting AI enhancement
    const isCircuitBreakerActive = global.geminiCircuitBreaker && 
      global.geminiCircuitBreaker.blocked && 
      Date.now() < global.geminiCircuitBreaker.until;

    // Start AI enhancement in background (non-blocking) - only if not already processing
    if (process.env.GEMINI_API_KEY && normalizedData.length > 0 && !global.cexAIProcessing && !isCircuitBreakerActive) {
      setProcessingState('cex', true);
      console.log(`🚀 Starting background AI enhancement for ${normalizedData.length} exchanges...`);
      
      // Background AI processing (async, no await)
      (async () => {
        try {
          let completeDataWithAI = [...normalizedData];
          const aiBatchSize = 10; // Smaller batches to reduce API load
          const totalAIBatches = Math.ceil(normalizedData.length / aiBatchSize);
          const delayBetweenBatches = 15000; // 15 seconds between batches
          
          console.log(`📊 Processing ${totalAIBatches} AI batches sequentially with ${delayBetweenBatches/1000}s delays...`);
          
          for (let i = 0; i < totalAIBatches; i++) {
            const batchStart = i * aiBatchSize;
            const batchEnd = batchStart + aiBatchSize;
            const batchExchanges = normalizedData.slice(batchStart, batchEnd);
            
            console.log(`🤖 Processing AI batch ${i + 1}/${totalAIBatches} (${batchExchanges.length} exchanges)...`);
            
            try {
              const aiFeesData = await fetchCEXFeesFromAI(batchExchanges);
              
              if (aiFeesData.length > 0) {
                const enhancedBatch = mergeCEXFeeData(batchExchanges, aiFeesData);
                completeDataWithAI.splice(batchStart, batchExchanges.length, ...enhancedBatch);
                
                // Update cache incrementally after each successful batch
                setCacheState('cex', completeDataWithAI);
                
                console.log(`✓ Enhanced batch ${i + 1}/${totalAIBatches} with AI fee data`);
              } else {
                console.log(`⚠️ Batch ${i + 1}/${totalAIBatches} returned no AI data`);
              }
            } catch (batchError) {
              const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
              console.error(`❌ Batch ${i + 1}/${totalAIBatches} failed:`, errorMessage);
              
              // Activate circuit breaker if API is overloaded
              if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
                global.geminiCircuitBreaker = {
                  blocked: true,
                  until: Date.now() + (30 * 60 * 1000) // Block for 30 minutes
                };
                console.log('🚫 Circuit breaker activated - stopping AI enhancement for 30 minutes');
                break; // Stop processing more batches
              }
            }
            
            // Wait between batches to avoid overloading Gemini API
            if (i < totalAIBatches - 1) {
              console.log(`⏳ Waiting ${delayBetweenBatches/1000}s before next batch...`);
              await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
          }
          
          // Final cache update with AI-enhanced data
          setCacheState('cex', completeDataWithAI);
          
          console.log(`🎉 Background AI enhancement complete - cached for ${CEX_CACHE_HOURS} hours`);
          global.lastAIError = null; // Clear error on success
        } catch (aiError) {
          const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error';
          console.error('Background AI enhancement failed:', errorMessage);
          global.lastAIError = errorMessage;
        } finally {
          setProcessingState('cex', false);
        }
      })();
    }

    // Set optimized cache headers for fresh data
    const headers = generateCacheHeaders('cex', false);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({
      data: batchData,
      cached: false,
      cachedAt: new Date().toISOString(),
      batch: batch === 'all' ? 'all' : batchNum,
      totalBatches,
      hasMore,
      totalExchanges: normalizedData.length,
      backgroundProcessing: !!process.env.GEMINI_API_KEY && !isCircuitBreakerActive,
    });
  } catch (error) {
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
