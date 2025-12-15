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
    backgroundLoading,
    cachedAt, 
    isCached,
    totalBatches,
    loadedBatches,
    progress
  } = useDEXFees();
  
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    displayedDEXes,
    totalCount,
    hasMore,
    loadMore,
    reset,
  } = useDEXFilters(dexes);

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
            {/* Show batch info only in development */}
            {process.env.NODE_ENV === 'development' && totalBatches > 0 && (
              <Badge colorScheme="purple" fontSize="xs">
                Batch {loadedBatches}/{totalBatches} ({Math.round(progress)}%)
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
          backgroundLoading={backgroundLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          progress={progress}
        />
      </VStack>
    </Layout>
  );
}
