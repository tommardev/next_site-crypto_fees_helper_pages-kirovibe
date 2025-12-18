import { Box, Heading, Text, VStack, Badge, HStack, Button, useToast, Flex } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { Layout } from '@/components/layout/Layout';
import { ExchangeGrid } from '@/components/exchange/ExchangeGrid';
import { ExchangeFilters } from '@/components/exchange/ExchangeFilters';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FeeDataStatus } from '@/components/common/FeeDataStatus';
import { useExchangeFees } from '@/lib/hooks/useExchangeFees';
import { useCEXFilters } from '@/lib/hooks/useFilters';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { CacheMonitor } from '@/components/common/CacheMonitor';
import { useState } from 'react';

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  
  const { 
    exchanges, 
    isLoading, 
    isError, 
    backgroundLoading,
    cachedAt, 
    isCached,
    totalBatches,
    loadedBatches,
    progress,
    refresh
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Use the hook's refresh function for better UX
      await refresh();
      
      toast({
        title: 'Data Refreshed',
        description: 'Exchange data has been updated with the latest information.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Flex justify="space-between" align="start" mb={2}>
            <Heading size="xl">
              Centralized Exchange (CEX) Fees
            </Heading>
            <Button
              leftIcon={<RepeatIcon />}
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
            >
              Refresh Data
            </Button>
          </Flex>
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
            💡 Tip: Lower fees mean more profit on your trades. {backgroundLoading ? 'AI is enhancing fee data in the background.' : 'Exchanges load progressively with AI-powered fee data.'}
          </Text>
          
          {/* Cache Monitor - Development Only */}
          <CacheMonitor />
        </Box>

        {/* Error handling */}
        {isError && (
          <ErrorAlert
            title="Failed to load exchanges"
            message="Unable to fetch exchange data. Please try again later."
          />
        )}

        {/* Fee Data Status */}
        {!isError && exchanges && (
          <FeeDataStatus exchanges={exchanges} isLoading={isLoading} />
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
