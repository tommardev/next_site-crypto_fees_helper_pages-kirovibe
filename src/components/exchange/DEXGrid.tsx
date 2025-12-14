import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack } from '@chakra-ui/react';
import { DEXCard } from './DEXCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { DEXFees } from '@/lib/types/exchange';

interface DEXGridProps {
  dexes: DEXFees[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  currentBatch?: number;
  totalBatches?: number;
}

export function DEXGrid({
  dexes,
  isLoading,
  isLoadingMore,
  emptyMessage = 'No DEX exchanges found',
  hasMore,
  onLoadMore,
  currentBatch,
  totalBatches,
}: DEXGridProps) {
  if (isLoading && dexes.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <ExchangeGridSkeleton count={6} />
        </SimpleGrid>
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Loading first batch of DEXes...
          </Text>
        </Box>
      </VStack>
    );
  }

  if (!dexes || dexes.length === 0) {
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
        {dexes.map((dex, index) => (
          <DEXCard
            key={dex.dexId}
            dex={dex}
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
              Loading more DEXes with AI fee data...
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
              colorScheme="purple"
              variant="outline"
              size="lg"
              isDisabled={isLoadingMore}
            >
              Load More DEXes
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
      {!hasMore && dexes.length > 8 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            All DEXes loaded ({dexes.length} total)
          </Text>
        </Box>
      )}
    </VStack>
  );
}
