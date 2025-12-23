import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack, Progress, Alert, AlertIcon } from '@chakra-ui/react';
import { ExchangeCard } from './ExchangeCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { CEXFees } from '@/lib/types/exchange';

interface ExchangeGridProps {
  exchanges: CEXFees[];
  isLoading?: boolean;
  backgroundLoading?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  progress?: number;
}

export function ExchangeGrid({
  exchanges,
  isLoading,
  backgroundLoading,
  emptyMessage = 'No exchanges found',
  hasMore,
  onLoadMore,
  progress = 0,
}: ExchangeGridProps) {
  // Show skeleton loader only on initial load
  if (isLoading && exchanges.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <ExchangeGridSkeleton count={9} />
        </SimpleGrid>
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Loading exchanges with AI-powered fee data...
          </Text>
        </Box>
      </VStack>
    );
  }

  if (!exchanges || exchanges.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.500">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {exchanges.map((exchange, index) => (
          <ExchangeCard
            key={exchange.exchangeId}
            exchange={exchange}
            rank={index + 1}
          />
        ))}
      </SimpleGrid>

      {/* Background AI processing indicator */}
      {backgroundLoading && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="sm" fontWeight="medium">
              AI is enhancing fee data in the background...
            </Text>
            <Text fontSize="xs" color="gray.600">
              Fee fields update automatically as each batch completes (every 15-30 seconds)
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Load more button - shows 10 more items */}
      {hasMore && onLoadMore && !isLoading && (
        <Box textAlign="center" pt={4}>
          <Button
            onClick={onLoadMore}
            colorScheme="blue"
            variant="outline"
            size="lg"
          >
            Show 10 More Exchanges
          </Button>
        </Box>
      )}

      {/* All loaded message */}
      {!hasMore && exchanges.length > 10 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Showing all {exchanges.length} exchanges
          </Text>
        </Box>
      )}
    </VStack>
  );
}
