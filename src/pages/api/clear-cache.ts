import { NextApiRequest, NextApiResponse } from 'next';
import { initializeGlobalCache, setProcessingState } from '@/lib/utils/cache-optimizer';

/**
 * Cache Invalidation API
 * 
 * Manually clears all cached data
 * Useful for debugging cache issues in production
 */

declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var dexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
  var dexAIProcessing: boolean;
  var lastAIError: string | null;
  var lastDEXAIError: string | null;
  var geminiCircuitBreaker: { blocked: boolean; until: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize global cache safely
    initializeGlobalCache();
    
    const { type = 'all' } = req.body;

    if (type === 'cex' || type === 'all') {
      global.cexCompleteCache = null;
      setProcessingState('cex', false);
      global.lastAIError = null;
      console.log('🗑️ CEX cache cleared');
    }

    if (type === 'dex' || type === 'all') {
      global.dexCompleteCache = null;
      setProcessingState('dex', false);
      global.lastDEXAIError = null;
      console.log('🗑️ DEX cache cleared');
    }

    if (type === 'circuit-breaker' || type === 'all') {
      global.geminiCircuitBreaker = null;
      console.log('🗑️ Circuit breaker cleared');
    }

    return res.status(200).json({
      success: true,
      message: `Cache cleared for: ${type}`,
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}