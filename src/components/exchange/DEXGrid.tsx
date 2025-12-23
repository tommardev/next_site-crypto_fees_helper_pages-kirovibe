import { SimpleGrid, Box, Text, Button, VStack, Spinner, HStack, Progress, Alert, AlertIcon } from '@chakra-ui/react';
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
  // Show skeleton loader only on initial load
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

      {/* Background AI processing indicator */}
      {backgroundLoading && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="sm" fontWeight="medium">
              AI is enhancing DEX fee data in the background...
            </Text>
            <Text fontSize="xs" color="gray.600">
              Fee data will update automatically when processing completes (usually 2-5 minutes)
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Load more button - shows 10 more items */}
      {hasMore && onLoadMore && !isLoading && (
        <Box textAlign="center" pt={4}>
          <Button
            onClick={onLoadMore}
            colorScheme="purple"
            variant="outline"
            size="lg"
          >
            Show 10 More DEXes
          </Button>
        </Box>
      )}

      {/* All loaded message */}
      {!hasMore && dexes.length > 10 && (
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Showing all {dexes.length} DEXes
          </Text>
        </Box>
      )}
    </VStack>
  );
}
