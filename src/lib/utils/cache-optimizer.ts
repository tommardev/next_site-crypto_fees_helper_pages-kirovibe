/**
 * Cache Optimization Utilities for Netlify Deployment
 * 
 * Optimizes caching strategy for static site deployment with serverless functions
 */

import { CEX_CACHE_DURATION, DEX_CACHE_DURATION } from '@/config/constants';

export interface CacheHeaders {
  'Cache-Control': string;
  'Netlify-CDN-Cache-Control'?: string;
  'Vary'?: string;
}

// Global cache state management with proper initialization
export interface CacheState {
  data: any[];
  timestamp: number;
  isProcessing: boolean;
  lastError: string | null;
}

// Initialize global cache state safely
export function initializeGlobalCache() {
  if (typeof global !== 'undefined') {
    // CEX Cache
    if (!global.cexCompleteCache) {
      global.cexCompleteCache = null;
    }
    if (global.cexAIProcessing === undefined) {
      global.cexAIProcessing = false;
    }
    if (global.lastAIError === undefined) {
      global.lastAIError = null;
    }
    
    // DEX Cache
    if (!global.dexCompleteCache) {
      global.dexCompleteCache = null;
    }
    if (global.dexAIProcessing === undefined) {
      global.dexAIProcessing = false;
    }
    if (global.lastDEXAIError === undefined) {
      global.lastDEXAIError = null;
    }
    
    // Circuit Breaker
    if (global.geminiCircuitBreaker === undefined) {
      global.geminiCircuitBreaker = null;
    }
  }
}

// Safe cache getter with fallback
export function getCacheState(type: 'cex' | 'dex'): CacheState | null {
  initializeGlobalCache();
  
  if (type === 'cex') {
    return global.cexCompleteCache ? {
      data: global.cexCompleteCache.data,
      timestamp: global.cexCompleteCache.timestamp,
      isProcessing: global.cexAIProcessing || false,
      lastError: global.lastAIError || null,
    } : null;
  } else {
    return global.dexCompleteCache ? {
      data: global.dexCompleteCache.data,
      timestamp: global.dexCompleteCache.timestamp,
      isProcessing: global.dexAIProcessing || false,
      lastError: global.lastDEXAIError || null,
    } : null;
  }
}

// Safe cache setter
export function setCacheState(type: 'cex' | 'dex', data: any[], timestamp?: number): void {
  initializeGlobalCache();
  
  const cacheData = {
    data,
    timestamp: timestamp || Date.now(),
  };
  
  if (type === 'cex') {
    global.cexCompleteCache = cacheData;
  } else {
    global.dexCompleteCache = cacheData;
  }
}

// Safe processing state management
export function setProcessingState(type: 'cex' | 'dex', isProcessing: boolean): void {
  initializeGlobalCache();
  
  if (type === 'cex') {
    global.cexAIProcessing = isProcessing;
  } else {
    global.dexAIProcessing = isProcessing;
  }
}

/**
 * Generate optimized cache headers for Netlify CDN
 */
export function generateCacheHeaders(
  type: 'cex' | 'dex' | 'static',
  isStale: boolean = false
): CacheHeaders {
  const cacheDuration = type === 'cex' ? CEX_CACHE_DURATION : DEX_CACHE_DURATION;
  const cacheSeconds = Math.floor(cacheDuration / 1000);
  const staleWhileRevalidate = cacheSeconds * 2;

  if (type === 'static') {
    return {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Vary': 'Accept-Encoding',
    };
  }

  // For API responses
  const cacheControl = isStale
    ? `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
    : `public, max-age=300, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleWhileRevalidate}`;

  return {
    'Cache-Control': cacheControl,
    'Netlify-CDN-Cache-Control': `public, max-age=${cacheSeconds}, stale-while-revalidate=${staleWhileRevalidate}`,
    'Vary': 'Accept-Encoding',
  };
}

/**
 * Check if cache is valid and not stale
 */
export function isCacheValid(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp < duration;
}

/**
 * Check if cache is stale but still usable
 */
export function isCacheStale(timestamp: number, duration: number): boolean {
  const age = Date.now() - timestamp;
  return age >= duration && age < (duration * 2);
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(timestamp: number, duration: number): {
  status: 'fresh' | 'stale' | 'expired';
  ageMs: number;
  ageHours: number;
} {
  const ageMs = Date.now() - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);

  let status: 'fresh' | 'stale' | 'expired';
  if (ageMs < duration) {
    status = 'fresh';
  } else if (ageMs < duration * 2) {
    status = 'stale';
  } else {
    status = 'expired';
  }

  return { status, ageMs, ageHours };
}

/**
 * Generate cache key for consistent caching
 */
export function generateCacheKey(type: 'cex' | 'dex', batch?: number): string {
  const baseKey = `${type}-fees`;
  return batch ? `${baseKey}-batch-${batch}` : baseKey;
}

/**
 * Log cache operations for debugging
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'stale' | 'rebuild',
  type: 'cex' | 'dex',
  details?: any
): void {
  const emoji = {
    hit: '✓',
    miss: '⚡',
    stale: '⚠️',
    rebuild: '🔄',
  };

  const message = `${emoji[operation]} Cache ${operation} - ${type.toUpperCase()}`;
  
  if (details) {
    console.log(message, details);
  } else {
    console.log(message);
  }
}