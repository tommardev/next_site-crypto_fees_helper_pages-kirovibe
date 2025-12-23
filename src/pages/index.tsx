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
import { DevCacheManager } from '@/components/common/DevCacheManager';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  const prevBackgroundLoadingRef = useRef<boolean>(false);
  
  const { 
    exchanges, 
    isLoading, 
    isError, 
    backgroundLoading,
    cachedAt, 
    isCached,
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

  // Show toast notification when AI processing completes
  useEffect(() => {
    if (prevBackgroundLoadingRef.current && !backgroundLoading) {
      toast({
        title: 'Fee Data Updated!',
        description: 'AI has successfully enhanced exchange fee data with real values.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    }
    prevBackgroundLoadingRef.current = backgroundLoading;
  }, [backgroundLoading, toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
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
        {/* Development Cache Manager */}
        <DevCacheManager onCacheCleared={refresh} />

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
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={2}>
            💡 Tip: Lower fees mean more profit on your trades. {backgroundLoading ? 'AI is enhancing fee data in the background.' : 'Data loads immediately with AI-powered fee enhancement.'}
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

        {/* Exchange Grid with 10-item incremental loading */}
        <ExchangeGrid
          exchanges={displayedExchanges}
          isLoading={isLoading}
          backgroundLoading={backgroundLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </VStack>
    </Layout>
  );
}
