import { Box, Heading, Text, VStack, Badge, HStack } from '@chakra-ui/react';
import { Layout } from '@/components/layout/Layout';
import { DEXGrid } from '@/components/exchange/DEXGrid';
import { DEXFilters } from '@/components/exchange/DEXFilters';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { useDEXFees } from '@/lib/hooks/useExchangeFees';
import { useDEXFilters } from '@/lib/hooks/useFilters';
import { formatRelativeTime } from '@/lib/utils/formatters';

export default function DEXPage() {
  const { 
    dexes, 
    isLoading, 
    isError, 
    isLoadingMore,
    hasMore: hasMoreBatches,
    loadMore: loadMoreBatches,
    cachedAt, 
    isCached,
    currentBatch,
    totalBatches
  } = useDEXFees();
  
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    displayedDEXes,
    totalCount,
    hasMore: hasMoreFiltered,
    loadMore: loadMoreFiltered,
    reset,
  } = useDEXFilters(dexes);

  // Determine which load more function to use
  const shouldShowLoadMore = hasMoreFiltered || hasMoreBatches;
  const handleLoadMore = hasMoreFiltered ? loadMoreFiltered : loadMoreBatches;

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            Decentralized Exchange (DEX) Fees
          </Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Text color="gray.600">
              Compare swap fees and gas costs across DeFi protocols
            </Text>
            {cachedAt && (
              <Badge colorScheme={isCached ? 'yellow' : 'green'} fontSize="xs">
                {isCached ? 'Cached' : 'Fresh'} • Updated {formatRelativeTime(cachedAt)}
              </Badge>
            )}
            {currentBatch && totalBatches && (
              <Badge colorScheme="purple" fontSize="xs">
                Batch {currentBatch}/{totalBatches}
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={2}>
            💡 Tip: DEX fees include swap fees + gas fees. DEXes load progressively with AI-powered fee data.
          </Text>
        </Box>

        {/* Error handling */}
        {isError && (
          <ErrorAlert
            title="Failed to load DEX data"
            message="Unable to fetch DEX information. Please try again later."
          />
        )}

        {/* Filters */}
        {!isError && dexes && dexes.length > 0 && (
          <DEXFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReset={reset}
            totalCount={totalCount}
            displayedCount={displayedDEXes.length}
          />
        )}

        {/* DEX Grid */}
        <DEXGrid
          dexes={displayedDEXes}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={shouldShowLoadMore}
          onLoadMore={handleLoadMore}
          currentBatch={currentBatch}
          totalBatches={totalBatches}
        />
      </VStack>
    </Layout>
  );
}
