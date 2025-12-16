import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Cache Invalidation API
 * 
 * Manually clears all cached data
 * Useful for debugging cache issues in production
 */

declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var dexCompleteCache: { data: any; timestamp: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear all caches
    global.cexCompleteCache = null;
    global.dexCompleteCache = null;

    console.log('🗑️ All caches cleared manually');

    return res.status(200).json({
      success: true,
      message: 'All caches cleared successfully',
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