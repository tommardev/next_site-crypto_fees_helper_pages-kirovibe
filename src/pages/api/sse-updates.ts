import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Server-Sent Events endpoint for real-time fee data updates
 * Works on Netlify and provides instant UI updates when AI processing completes
 */

// Global state for SSE connections
declare global {
  var sseConnections: Set<NextApiResponse> | undefined;
  var lastSSEBroadcast: { cex?: number; dex?: number } | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Initialize global connections set
  if (!global.sseConnections) {
    global.sseConnections = new Set();
  }
  if (!global.lastSSEBroadcast) {
    global.lastSSEBroadcast = {};
  }

  // Add this connection to the global set
  global.sseConnections.add(res);

  // Send initial connection event
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ timestamp: Date.now(), message: 'SSE connected' })}\n\n`);

  // Send current AI processing status
  const sendCurrentStatus = () => {
    const cexProcessing = (global as any).cexAIProcessing || false;
    const dexProcessing = (global as any).dexAIProcessing || false;
    const cexCache = (global as any).cexCompleteCache;
    const dexCache = (global as any).dexCompleteCache;

    let cexEnhanced = 0;
    let cexTotal = 0;
    let dexEnhanced = 0;
    let dexTotal = 0;

    if (cexCache?.data) {
      cexTotal = cexCache.data.length;
      cexEnhanced = cexCache.data.filter((ex: any) => 
        ex.makerFee !== null || ex.takerFee !== null
      ).length;
    }

    if (dexCache?.data) {
      dexTotal = dexCache.data.length;
      dexEnhanced = dexCache.data.filter((dex: any) => 
        dex.swapFee !== null
      ).length;
    }

    const statusData = {
      timestamp: Date.now(),
      cex: {
        processing: cexProcessing,
        enhanced: cexEnhanced,
        total: cexTotal,
        progress: cexTotal > 0 ? Math.round((cexEnhanced / cexTotal) * 100) : 0,
      },
      dex: {
        processing: dexProcessing,
        enhanced: dexEnhanced,
        total: dexTotal,
        progress: dexTotal > 0 ? Math.round((dexEnhanced / dexTotal) * 100) : 0,
      }
    };

    res.write(`event: ai-status\n`);
    res.write(`data: ${JSON.stringify(statusData)}\n\n`);
  };

  // Send initial status
  sendCurrentStatus();

  // Set up periodic status updates (every 10 seconds)
  const statusInterval = setInterval(() => {
    if (res.destroyed) {
      clearInterval(statusInterval);
      return;
    }
    sendCurrentStatus();
  }, 10000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(statusInterval);
    if (global.sseConnections) {
      global.sseConnections.delete(res);
    }
  });

  req.on('end', () => {
    clearInterval(statusInterval);
    if (global.sseConnections) {
      global.sseConnections.delete(res);
    }
  });
}

/**
 * Broadcast fee data updates to all connected SSE clients
 * Called from API routes when AI processing completes
 */
export function broadcastFeeUpdate(type: 'cex' | 'dex', data: any) {
  if (!global.sseConnections || global.sseConnections.size === 0) {
    return;
  }

  const updateData = {
    timestamp: Date.now(),
    type,
    data,
    enhanced: type === 'cex' 
      ? data.filter((ex: any) => ex.makerFee !== null || ex.takerFee !== null).length
      : data.filter((dex: any) => dex.swapFee !== null).length,
    total: data.length,
  };

  // Update last broadcast timestamp
  if (!global.lastSSEBroadcast) {
    global.lastSSEBroadcast = {};
  }
  global.lastSSEBroadcast[type] = Date.now();

  // Broadcast to all connected clients
  const deadConnections = new Set<NextApiResponse>();
  
  global.sseConnections.forEach((connection) => {
    try {
      if (connection.destroyed) {
        deadConnections.add(connection);
        return;
      }

      connection.write(`event: fee-update\n`);
      connection.write(`data: ${JSON.stringify(updateData)}\n\n`);
    } catch (error) {
      console.error('SSE broadcast error:', error);
      deadConnections.add(connection);
    }
  });

  // Clean up dead connections
  deadConnections.forEach(connection => {
    global.sseConnections?.delete(connection);
  });

  console.log(`📡 Broadcasted ${type.toUpperCase()} fee update to ${global.sseConnections.size} clients`);
}

/**
 * Broadcast AI processing status changes
 */
export function broadcastAIStatusChange(type: 'cex' | 'dex', processing: boolean) {
  if (!global.sseConnections || global.sseConnections.size === 0) {
    return;
  }

  const statusData = {
    timestamp: Date.now(),
    type,
    processing,
    message: processing ? `${type.toUpperCase()} AI processing started` : `${type.toUpperCase()} AI processing completed`,
  };

  const deadConnections = new Set<NextApiResponse>();
  
  global.sseConnections.forEach((connection) => {
    try {
      if (connection.destroyed) {
        deadConnections.add(connection);
        return;
      }

      connection.write(`event: ai-processing\n`);
      connection.write(`data: ${JSON.stringify(statusData)}\n\n`);
    } catch (error) {
      console.error('SSE broadcast error:', error);
      deadConnections.add(connection);
    }
  });

  // Clean up dead connections
  deadConnections.forEach(connection => {
    global.sseConnections?.delete(connection);
  });

  console.log(`📡 Broadcasted ${type.toUpperCase()} AI status change to ${global.sseConnections.size} clients`);
}