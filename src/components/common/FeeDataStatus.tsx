import { 
  Box, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription, 
  Button, 
  VStack, 
  Text, 
  Link, 
  Badge, 
  HStack,
  Progress,
  useColorModeValue 
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface FeeDataStatusProps {
  exchanges: any[];
  isLoading: boolean;
  type?: 'cex' | 'dex';
  backgroundLoading?: boolean;
}

export function FeeDataStatus({ exchanges, isLoading, type = 'cex', backgroundLoading = false }: FeeDataStatusProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Use real-time updates for instant status
  const { 
    aiStatus, 
    isConnected, 
    lastUpdate, 
    isCEXProcessing, 
    isDEXProcessing, 
    cexProgress, 
    dexProgress 
  } = useRealtimeUpdates();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Don't show anything while initial loading
  if (isLoading) return null;

  // Calculate fee data availability based on type
  const exchangesWithFees = type === 'dex' 
    ? exchanges.filter(ex => ex.swapFee !== null)
    : exchanges.filter(ex => ex.makerFee !== null || ex.takerFee !== null);
  const feeDataRate = exchanges.length > 0 ? (exchangesWithFees.length / exchanges.length * 100) : 0;
  
  const entityName = type === 'dex' ? 'DEX' : 'exchange';
  const entityPlural = type === 'dex' ? 'DEXes' : 'exchanges';
  const feeType = type === 'dex' ? 'swap fees' : 'trading fees';

  // Get real-time processing status
  const isProcessing = type === 'dex' ? isDEXProcessing : isCEXProcessing;
  const aiProgress = type === 'dex' ? dexProgress : cexProgress;
  const currentStatus = type === 'dex' ? aiStatus.dex : aiStatus.cex;

  // Show real-time AI processing status
  if (isProcessing) {
    return (
      <Box mb={6}>
        <Alert status="info" borderRadius="md" bg={bgColor} borderColor={borderColor}>
          <AlertIcon />
          <Box flex="1">
            <HStack justify="space-between" align="center" mb={2}>
              <AlertTitle>🤖 AI Collecting Real Fee Data</AlertTitle>
              <HStack spacing={2}>
                <Badge colorScheme="blue" variant="subtle">
                  {isConnected ? '🔴 Live' : '⚪ Offline'}
                </Badge>
                <Badge colorScheme="yellow">
                  {aiProgress}% Complete
                </Badge>
              </HStack>
            </HStack>
            <AlertDescription>
              Our AI is actively collecting real-time {feeType} from official {entityName} sources. 
              The UI will update automatically when new data arrives.
            </AlertDescription>
            <Progress 
              value={aiProgress} 
              size="sm" 
              colorScheme="blue" 
              mt={3} 
              borderRadius="md"
              bg={useColorModeValue('gray.100', 'gray.700')}
            />
            <Text fontSize="xs" color="gray.500" mt={2}>
              Enhanced: {currentStatus.enhanced}/{currentStatus.total} {entityPlural}
              {lastUpdate && ` • Last update: ${formatRelativeTime(lastUpdate.toISOString())}`}
            </Text>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Show warning if fee data is missing and not processing
  if (feeDataRate < 10 && !isProcessing) {
    return (
      <Box mb={6}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Fee Data Currently Unavailable</AlertTitle>
            <AlertDescription>
              Real-time {feeType} collection is not active. 
              {!isConnected && " Connection to real-time updates is offline."}
            </AlertDescription>
            <VStack align="start" mt={2} spacing={1}>
              <Button size="sm" variant="link" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              {showDetails && (
                <Box fontSize="sm" color="gray.600">
                  <Text>• {entityPlural} loaded: {exchanges.length}</Text>
                  <Text>• {entityPlural} with fees: {exchangesWithFees.length} ({feeDataRate.toFixed(1)}%)</Text>
                  <Text>• Real-time connection: {isConnected ? '✓ Connected' : '✗ Disconnected'}</Text>
                  <Text>• AI Progress: {aiProgress}%</Text>
                  <Text mt={2}>
                    Having issues? Contact us at{' '}
                    <Link href="/contact" color="blue.500" textDecoration="underline">
                      support page
                    </Link>
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Show success message if fee data is available
  if (feeDataRate > 50) {
    return (
      <Box mb={4}>
        <Alert status="success" borderRadius="md" bg={bgColor} borderColor={borderColor}>
          <AlertIcon />
          <Box flex="1">
            <HStack justify="space-between" align="center">
              <AlertDescription>
                ✅ Real-time fee data available for {exchangesWithFees.length} {entityPlural} ({feeDataRate.toFixed(0)}%)
              </AlertDescription>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle">
                  {isConnected ? '🔴 Live' : '⚪ Offline'}
                </Badge>
                {lastUpdate && (
                  <Text fontSize="xs" color="gray.500">
                    Updated {formatRelativeTime(lastUpdate.toISOString())}
                  </Text>
                )}
              </HStack>
            </HStack>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Show info for partial data
  return (
    <Box mb={4}>
      <Alert status="info" borderRadius="md" bg={bgColor} borderColor={borderColor}>
        <AlertIcon />
        <Box flex="1">
          <HStack justify="space-between" align="center">
            <AlertDescription>
              Fee data available for {exchangesWithFees.length} of {exchanges.length} {entityPlural}. 
              {isProcessing ? 'AI is collecting more data...' : 'Collection completed.'}
            </AlertDescription>
            <HStack spacing={2}>
              <Badge colorScheme={isProcessing ? 'yellow' : 'blue'} variant="subtle">
                {isConnected ? '🔴 Live' : '⚪ Offline'}
              </Badge>
              {aiProgress > 0 && (
                <Badge colorScheme="blue">
                  {aiProgress}%
                </Badge>
              )}
            </HStack>
          </HStack>
        </Box>
      </Alert>
    </Box>
  );
}