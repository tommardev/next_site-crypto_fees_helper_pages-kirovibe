import { Box, Badge, HStack, VStack, Text, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface RealtimeIndicatorProps {
  type?: 'cex' | 'dex' | 'both';
  showDetails?: boolean;
}

/**
 * Real-time connection indicator showing SSE status and AI processing progress
 * Works perfectly on Netlify and other serverless platforms
 */
export function RealtimeIndicator({ type = 'both', showDetails = false }: RealtimeIndicatorProps) {
  const { 
    aiStatus, 
    isConnected, 
    lastUpdate, 
    isCEXProcessing, 
    isDEXProcessing, 
    cexProgress, 
    dexProgress,
    hasAnyProcessing
  } = useRealtimeUpdates();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Connection status badge
  const connectionBadge = (
    <Tooltip label={isConnected ? 'Real-time updates active' : 'Real-time updates offline'}>
      <Badge 
        colorScheme={isConnected ? 'green' : 'red'} 
        variant="subtle"
        fontSize="xs"
      >
        {isConnected ? '🔴 Live' : '⚪ Offline'}
      </Badge>
    </Tooltip>
  );

  // Processing status badges
  const processingBadges = [];
  
  if ((type === 'cex' || type === 'both') && isCEXProcessing) {
    processingBadges.push(
      <Tooltip key="cex" label={`CEX AI processing: ${cexProgress}% complete`}>
        <Badge colorScheme="blue" variant="subtle" fontSize="xs">
          CEX {cexProgress}%
        </Badge>
      </Tooltip>
    );
  }
  
  if ((type === 'dex' || type === 'both') && isDEXProcessing) {
    processingBadges.push(
      <Tooltip key="dex" label={`DEX AI processing: ${dexProgress}% complete`}>
        <Badge colorScheme="purple" variant="subtle" fontSize="xs">
          DEX {dexProgress}%
        </Badge>
      </Tooltip>
    );
  }

  // Compact view (just badges)
  if (!showDetails) {
    return (
      <HStack spacing={2}>
        {connectionBadge}
        {processingBadges}
      </HStack>
    );
  }

  // Detailed view
  return (
    <Box 
      p={3} 
      bg={bgColor} 
      borderWidth="1px" 
      borderColor={borderColor} 
      borderRadius="md"
      fontSize="sm"
    >
      <HStack justify="space-between" align="center" mb={2}>
        <Text fontWeight="medium">Real-time Status</Text>
        <HStack spacing={2}>
          {connectionBadge}
          {processingBadges}
        </HStack>
      </HStack>
      
      <VStack align="start" spacing={1} fontSize="xs" color="gray.600">
        <Text>
          Connection: {isConnected ? '✅ Connected to live updates' : '❌ Disconnected'}
        </Text>
        
        {type !== 'dex' && (
          <Text>
            CEX Processing: {isCEXProcessing ? `🤖 Active (${cexProgress}%)` : '✅ Complete'}
          </Text>
        )}
        
        {type !== 'cex' && (
          <Text>
            DEX Processing: {isDEXProcessing ? `🤖 Active (${dexProgress}%)` : '✅ Complete'}
          </Text>
        )}
        
        {lastUpdate && (
          <Text>
            Last Update: {formatRelativeTime(lastUpdate.toISOString())}
          </Text>
        )}
        
        {!hasAnyProcessing && !lastUpdate && (
          <Text color="gray.500">
            No recent AI processing activity
          </Text>
        )}
      </VStack>
    </Box>
  );
}