import { SimpleGrid, Box, Text, Button, VStack } from '@chakra-ui/react';
import { ExchangeCard } from './ExchangeCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { CEXFees } from '@/lib/types/exchange';

interface ExchangeGridProps {
  exchanges: CEXFees[];
  isLoading?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ExchangeGrid({
  exchanges,
  isLoading,
  emptyMessage = 'No exchanges found',
  hasMore,
  onLoadMore,
}: ExchangeGridProps) {
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <ExchangeGridSkeleton count={9} />
      </SimpleGrid>
    );
  }

  if (exchanges.length === 0) {
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
