import { Box, Heading, Text, VStack, Badge, HStack } from '@chakra-ui/react';
import { Layout } from '@/components/layout/Layout';
import { ExchangeGrid } from '@/components/exchange/ExchangeGrid';
import { ExchangeFilters } from '@/components/exchange/ExchangeFilters';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { useExchangeFees } from '@/lib/hooks/useExchangeFees';
import { useCEXFilters } from '@/lib/hooks/useFilters';
import { formatRelativeTime } from '@/lib/utils/formatters';

export default function HomePage() {
  const { 
    exchanges, 
    isLoading, 
    isError, 
    backgroundLoading,
    cachedAt, 
    isCached,
    totalBatches,
    loadedBatches,
    progress
  } = useExchangeFees();
  
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    displayedExchanges,
    totalCount,
    hasMore,
    loadMore,
    reset,
  } = useCEXFilters(exchanges);

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            Centralized Exchange (CEX) Fees
          </Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Text color="gray.600">
              Compare trading fees across top cryptocurrency exchanges
            </Text>
            {cachedAt && (
              <Badge colorScheme={isCached ? 'yellow' : 'green'} fontSize="xs">
                {isCached ? 'Cached' : 'Fresh'} • Updated {formatRelativeTime(cachedAt)}
              </Badge>
            )}
            {/* Show batch info only in development */}
            {process.env.NODE_ENV === 'development' && totalBatches > 0 && (
              <Badge colorScheme="blue" fontSize="xs">
                Batch {loadedBatches}/{totalBatches} ({Math.round(progress)}%)
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={2}>
            💡 Tip: Lower fees mean more profit on your trades. Exchanges load progressively with AI-powered fee data.
          </Text>
        </Box>

        {/* Error handling */}
        {isError && (
          <ErrorAlert
            title="Failed to load exchanges"
            message="Unable to fetch exchange data. Please try again later."
          />
        )}

        {/* Filters */}
        {!isError && exchanges && exchanges.length > 0 && (
          <ExchangeFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReset={reset}
            totalCount={totalCount}
            displayedCount={displayedExchanges.length}
          />
        )}

        {/* Exchange Grid */}
        <ExchangeGrid
          exchanges={displayedExchanges}
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
