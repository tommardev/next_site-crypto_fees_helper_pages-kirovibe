import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, VStack, Text, Link } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

interface FeeDataStatusProps {
  exchanges: any[];
  isLoading: boolean;
}

interface AIStatus {
  geminiConfigured: boolean;
  cmcConfigured: boolean;
  enhancementRate: string;
  totalExchanges: number;
  enhancedExchanges: number;
  lastError?: string;
}

export function FeeDataStatus({ exchanges, isLoading }: FeeDataStatusProps) {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check AI status after exchanges load
    if (exchanges.length > 0 && !isLoading) {
      fetch('/api/ai-status')
        .then(res => res.json())
        .then(setAIStatus)
        .catch(console.error);
    }
  }, [exchanges.length, isLoading]);

  // Don't show anything while loading
  if (isLoading || !aiStatus) return null;

  // Calculate fee data availability
  const exchangesWithFees = exchanges.filter(ex => ex.makerFee !== null || ex.takerFee !== null);
  const feeDataRate = exchanges.length > 0 ? (exchangesWithFees.length / exchanges.length * 100) : 0;

  // Show warning if fee data is missing
  if (feeDataRate < 10) {
    return (
      <Box mb={6}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Fee Data Currently Unavailable</AlertTitle>
            <AlertDescription>
              We're working to collect real-time trading fees from exchanges. 
              {!aiStatus.geminiConfigured && " AI enhancement is not configured."}
              {aiStatus.geminiConfigured && !aiStatus.lastError && " Fee collection is in progress."}
              {aiStatus.lastError && ` Current issue: ${aiStatus.lastError}`}
            </AlertDescription>
            <VStack align="start" mt={2} spacing={1}>
              <Button size="sm" variant="link" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              {showDetails && (
                <Box fontSize="sm" color="gray.600">
                  <Text>• Exchanges loaded: {aiStatus.totalExchanges}</Text>
                  <Text>• Exchanges with fees: {aiStatus.enhancedExchanges} ({aiStatus.enhancementRate})</Text>
                  <Text>• Gemini AI: {aiStatus.geminiConfigured ? '✓ Configured' : '✗ Not configured'}</Text>
                  <Text>• CoinMarketCap: {aiStatus.cmcConfigured ? '✓ Configured' : '✗ Not configured'}</Text>
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
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Real-time fee data available for {exchangesWithFees.length} exchanges ({feeDataRate.toFixed(0)}%)
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  // Show info for partial data
  return (
    <Box mb={4}>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          Fee data available for {exchangesWithFees.length} of {exchanges.length} exchanges. 
          More data is being collected in the background.
        </AlertDescription>
      </Alert>
    </Box>
  );
}