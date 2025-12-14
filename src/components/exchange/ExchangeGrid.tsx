import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack } from '@chakra-ui/react';
import { ExchangeCard } from './ExchangeCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { CEXFees } from '@/lib/types/exchange';

interface ExchangeGridProps {
  exchanges: CEXFees[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  currentBatch?: number;
  totalBatches?: number;
}

export function ExchangeGrid({
  exchanges,
  isLoading,
  isLoadingMore,
  emptyMessage = 'No exchanges found',
  hasMore,
  onLoadMore,
  currentBatch,
  totalBatches,
}: ExchangeGridProps) {
  if (isLoading && exchanges.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <ExchangeGridSkeleton count={9} />
        </SimpleGrid>
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Loading first batch of exchanges...
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
        
        {/* Show skeleton cards for loading more */}
        {isLoadingMore && (
          <ExchangeGridSkeleton count={6} />
        )}
      </SimpleGrid>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <Box textAlign="center" py={4}>
          <HStack justify="center" spacing={3}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.500">
              Loading more exchanges with AI fee data...
            </Text>
          </HStack>
        </Box>
      )}

      {/* Load more button */}
      {hasMore && !isLoadingMore && onLoadMore && (
        <Box textAlign="center" pt={4}>
          <VStack spacing={2}>
            <Button
              onClick={onLoadMore}
              colorScheme="blue"
              variant="outline"
              size="lg"
              isDisabled={isLoadingMore}
            >
              Load More Exchanges
            </Button>
            {currentBatch && totalBatches && (
              <Text fontSize="xs" color="gray.500">
                Loaded {currentBatch} of {totalBatches} batches
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* All loaded message */}
      {!hasMore && exchanges.length > 10 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            All exchanges loaded ({exchanges.length} total)
          </Text>
        </Box>
      )}
    </VStack>
  );
}
