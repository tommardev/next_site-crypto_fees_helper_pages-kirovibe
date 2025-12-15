import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack, Progress } from '@chakra-ui/react';
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

      {/* Background loading indicator */}
      {backgroundLoading && (
        <Box py={4}>
          <VStack spacing={3}>
            <HStack justify="center" spacing={3}>
              <Spinner size="sm" color="blue.500" />
              <Text fontSize="sm" color="gray.600">
                Loading more exchanges with AI fee data in background...
              </Text>
            </HStack>
            <Progress 
              value={progress} 
              size="sm" 
              colorScheme="blue" 
              width="200px" 
              borderRadius="md"
            />
          </VStack>
        </Box>
      )}

      {/* Load more button for filtered results */}
      {hasMore && onLoadMore && !backgroundLoading && (
        <Box textAlign="center" pt={4}>
          <Button
            onClick={onLoadMore}
            colorScheme="blue"
            variant="outline"
            size="lg"
          >
            Show More Results
          </Button>
        </Box>
      )}

      {/* All loaded message */}
      {!backgroundLoading && !hasMore && exchanges.length > 10 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Showing all {exchanges.length} exchanges
          </Text>
        </Box>
      )}
    </VStack>
  );
}
