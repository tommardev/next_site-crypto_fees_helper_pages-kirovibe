import { Box, Heading, Text, VStack, Badge, HStack, useToast } from '@chakra-ui/react';
import { Layout } from '@/components/layout/Layout';
import { DEXGrid } from '@/components/exchange/DEXGrid';
import { DEXFilters } from '@/components/exchange/DEXFilters';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FeeDataStatus } from '@/components/common/FeeDataStatus';
import { useDEXFees } from '@/lib/hooks/useExchangeFees';
import { useDEXFilters } from '@/lib/hooks/useFilters';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { CacheMonitor } from '@/components/common/CacheMonitor';
import { DevCacheManager } from '@/components/common/DevCacheManager';
import { useEffect, useRef } from 'react';

export default function DEXPage() {
  const toast = useToast();
  const prevBackgroundLoadingRef = useRef<boolean>(false);

  const { 
    dexes, 
    isLoading, 
    isError, 
    backgroundLoading,
    cachedAt, 
    isCached,
    refresh
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

  // Show toast notification when AI processing completes
  useEffect(() => {
    if (prevBackgroundLoadingRef.current && !backgroundLoading) {
      toast({
        title: 'DEX Fee Data Updated!',
        description: 'AI has successfully enhanced DEX fee data with real values.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    }
    prevBackgroundLoadingRef.current = backgroundLoading;
  }, [backgroundLoading, toast]);

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Development Cache Manager */}
        <DevCacheManager onCacheCleared={refresh} />

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
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={2}>
            💡 Tip: DEX fees include swap fees + gas fees. {backgroundLoading ? 'AI is enhancing fee data in the background.' : 'Data loads immediately with AI-powered fee enhancement.'}
          </Text>
          
          {/* Cache Monitor - Development Only */}
          <CacheMonitor />
        </Box>

        {/* Error handling */}
        {isError && (
          <ErrorAlert
            title="Failed to load DEX data"
            message="Unable to fetch DEX information. Please try again later."
          />
        )}

        {/* Fee Data Status */}
        {!isError && dexes && (
          <FeeDataStatus exchanges={dexes} isLoading={isLoading} type="dex" />
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

        {/* DEX Grid with 10-item incremental loading */}
        <DEXGrid
          dexes={displayedDEXes}
          isLoading={isLoading}
          backgroundLoading={backgroundLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </VStack>
    </Layout>
  );
}
