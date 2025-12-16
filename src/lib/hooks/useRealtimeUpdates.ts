import { useEffect, useRef, useState, useCallback } from 'react';
import { mutate } from 'swr';

interface AIStatus {
  cex: {
    processing: boolean;
    enhanced: number;
    total: number;
    progress: number;
  };
  dex: {
    processing: boolean;
    enhanced: number;
    total: number;
    progress: number;
  };
}

interface FeeUpdateData {
  timestamp: number;
  type: 'cex' | 'dex';
  data: any[];
  enhanced: number;
  total: number;
}

interface AIProcessingData {
  timestamp: number;
  type: 'cex' | 'dex';
  processing: boolean;
  message: string;
}

/**
 * Modern real-time updates hook using Server-Sent Events
 * Provides instant UI updates when AI processing completes
 * Works perfectly on Netlify and other serverless platforms
 */
export function useRealtimeUpdates() {
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    cex: { processing: false, enhanced: 0, total: 0, progress: 0 },
    dex: { processing: false, enhanced: 0, total: 0, progress: 0 },
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Callback for when fee data is updated
  const onFeeUpdate = useCallback((data: FeeUpdateData) => {
    console.log(`🔄 Real-time ${data.type.toUpperCase()} fee update received:`, {
      enhanced: data.enhanced,
      total: data.total,
      progress: Math.round((data.enhanced / data.total) * 100),
    });

    // Update AI status
    setAiStatus(prev => ({
      ...prev,
      [data.type]: {
        processing: false,
        enhanced: data.enhanced,
        total: data.total,
        progress: Math.round((data.enhanced / data.total) * 100),
      },
    }));

    // Force refresh SWR cache to get updated data
    if (data.type === 'cex') {
      mutate('/api/cex-fees?batch=1&batchSize=10');
      // Also refresh batch endpoints
      for (let batch = 2; batch <= 5; batch++) {
        mutate(`/api/cex-fees-batch?batch=${batch}&batchSize=10`);
      }
    } else {
      mutate('/api/dex-fees?batch=1&batchSize=10');
      // Also refresh batch endpoints
      for (let batch = 2; batch <= 5; batch++) {
        mutate(`/api/dex-fees-batch?batch=${batch}&batchSize=10`);
      }
    }

    setLastUpdate(new Date());
  }, []);

  // Callback for AI processing status changes
  const onAIProcessingChange = useCallback((data: AIProcessingData) => {
    console.log(`🤖 AI processing ${data.type.toUpperCase()}: ${data.processing ? 'started' : 'completed'}`);
    
    setAiStatus(prev => ({
      ...prev,
      [data.type]: {
        ...prev[data.type],
        processing: data.processing,
      },
    }));
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      console.log('🔌 Connecting to real-time updates...');
      const eventSource = new EventSource('/api/sse-updates');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Real-time updates connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('📡 SSE connection established:', data.message);
      });

      eventSource.addEventListener('ai-status', (event) => {
        const data = JSON.parse(event.data);
        setAiStatus(data);
      });

      eventSource.addEventListener('fee-update', (event) => {
        const data: FeeUpdateData = JSON.parse(event.data);
        onFeeUpdate(data);
      });

      eventSource.addEventListener('ai-processing', (event) => {
        const data: AIProcessingData = JSON.parse(event.data);
        onAIProcessingChange(data);
      });

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setIsConnected(false);
        
        // Close current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.log('❌ Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
    }
  }, [onFeeUpdate, onAIProcessingChange]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from real-time updates');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle page visibility changes (reconnect when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current) {
        console.log('📱 Page visible - reconnecting to real-time updates');
        connect();
      } else if (document.visibilityState === 'hidden') {
        console.log('📱 Page hidden - maintaining connection');
        // Keep connection alive but don't actively reconnect
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect]);

  return {
    aiStatus,
    isConnected,
    lastUpdate,
    connect,
    disconnect,
    // Helper functions
    isCEXProcessing: aiStatus.cex.processing,
    isDEXProcessing: aiStatus.dex.processing,
    cexProgress: aiStatus.cex.progress,
    dexProgress: aiStatus.dex.progress,
    hasAnyProcessing: aiStatus.cex.processing || aiStatus.dex.processing,
  };
}