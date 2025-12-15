import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack, Progress } from '@chakra-ui/react';
import { DEXCard } from './DEXCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { DEXFees } from '@/lib/types/exchange';

interface DEXGridProps {
  dexes: DEXFees[];
  isLoading?: boolean;
  backgroundLoading?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  progress?: number;
}

export function DEXGrid({
  dexes,
  isLoading,
  backgroundLoading,
  emptyMessage = 'No DEX exchanges found',
  hasMore,
  onLoadMore,
  progress = 0,
}: DEXGridProps) {
  if (isLoading && dexes.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <ExchangeGridSkeleton count={6} />
        </SimpleGrid>
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Loading DEXes with AI-powered fee data...
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
      </SimpleGrid>

      {/* Background loading indicator */}
      {backgroundLoading && (
        <Box py={4}>
          <VStack spacing={3}>
            <HStack justify="center" spacing={3}>
              <Spinner size="sm" color="purple.500" />
              <Text fontSize="sm" color="gray.600">
                Loading more DEXes with AI fee data in background...
              </Text>
            </HStack>
            <Progress 
              value={progress} 
              size="sm" 
              colorScheme="purple" 
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
            colorScheme="purple"
            variant="outline"
            size="lg"
          >
            Show More Results
          </Button>
        </Box>
      )}

      {/* All loaded message */}
      {!backgroundLoading && !hasMore && dexes.length > 10 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Showing all {dexes.length} DEXes
          </Text>
        </Box>
      )}
    </VStack>
  );
}
