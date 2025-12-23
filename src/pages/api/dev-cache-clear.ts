import { NextApiRequest, NextApiResponse } from 'next';
import { initializeGlobalCache } from '@/lib/utils/cache-optimizer';

/**
 * Development Cache Clear API Route
 * 
 * DEVELOPMENT ONLY: Clear all cached data for debugging purposes
 * Provides granular cache clearing options for development workflow
 * 
 * Usage:
 * - POST /api/dev-cache-clear?type=cex - Clear CEX cache only
 * - POST /api/dev-cache-clear?type=dex - Clear DEX cache only  
 * - POST /api/dev-cache-clear?type=all - Clear all caches (default)
 * - POST /api/dev-cache-clear?type=ai - Clear AI processing state only
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'all' } = req.query;

  try {
    // Initialize global cache safely
    initializeGlobalCache();

    const clearedItems: string[] = [];

    // Clear CEX cache
    if (type === 'all' || type === 'cex') {
      if (global.cexCompleteCache) {
        global.cexCompleteCache = null;
        clearedItems.push('CEX cache');
      }
      if (global.cexAIProcessing) {
        global.cexAIProcessing = false;
        clearedItems.push('CEX AI processing state');
      }
      if (global.lastAIError) {
        global.lastAIError = null;
        clearedItems.push('CEX AI error state');
      }
    }

    // Clear DEX cache
    if (type === 'all' || type === 'dex') {
      if (global.dexCompleteCache) {
        global.dexCompleteCache = null;
        clearedItems.push('DEX cache');
      }
      if (global.dexAIProcessing) {
        global.dexAIProcessing = false;
        clearedItems.push('DEX AI processing state');
      }
      if (global.lastDEXAIError) {
        global.lastDEXAIError = null;
        clearedItems.push('DEX AI error state');
      }
    }

    // Clear AI state only
    if (type === 'ai') {
      if (global.cexAIProcessing) {
        global.cexAIProcessing = false;
        clearedItems.push('CEX AI processing state');
      }
      if (global.dexAIProcessing) {
        global.dexAIProcessing = false;
        clearedItems.push('DEX AI processing state');
      }
      if (global.geminiCircuitBreaker) {
        global.geminiCircuitBreaker = null;
        clearedItems.push('Gemini circuit breaker');
      }
      if (global.lastAIError) {
        global.lastAIError = null;
        clearedItems.push('CEX AI error state');
      }
      if (global.lastDEXAIError) {
        global.lastDEXAIError = null;
        clearedItems.push('DEX AI error state');
      }
    }

    // Clear circuit breaker for all types except 'ai' only
    if (type === 'all' || type === 'cex' || type === 'dex') {
      if (global.geminiCircuitBreaker) {
        global.geminiCircuitBreaker = null;
        clearedItems.push('Gemini circuit breaker');
      }
    }

    const message = clearedItems.length > 0 
      ? `Cleared: ${clearedItems.join(', ')}`
      : 'No cache data found to clear';

    console.log(`🧹 Development cache clear (${type}): ${message}`);

    return res.status(200).json({
      success: true,
      message,
      clearedItems,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}