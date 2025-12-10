import { SimpleGrid, Box, Text, Button, VStack } from '@chakra-ui/react';
import { DEXCard } from './DEXCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { DEXFees } from '@/lib/types/exchange';

interface DEXGridProps {
  dexes: DEXFees[];
  isLoading?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function DEXGrid({
  dexes,
  isLoading,
  emptyMessage = 'No DEX exchanges found',
  hasMore,
  onLoadMore,
}: DEXGridProps) {
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <ExchangeGridSkeleton count={6} />
      </SimpleGrid>
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
      </SimpleGrid>

      {hasMore && onLoadMore && (
        <Box textAlign="center" pt={4}>
          <Button
            onClick={onLoadMore}
            colorScheme="blue"
            variant="outline"
            size="lg"
          >
            Load More
          </Button>
        </Box>
      )}
    </VStack>
  );
}
