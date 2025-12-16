import { useState, useEffect } from 'react';
import { 
  Box, 
  Text, 
  Badge, 
  VStack, 
  HStack, 
  Button, 
  Collapse,
  useDisclosure,
  Divider
} from '@chakra-ui/react';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface CacheStatus {
  timestamp: string;
  cex: {
    exists: boolean;
    dataLength: number;
    cachedAt: string | null;
    ageMs: number;
    isValid: boolean;
    expiresAt: string | null;
  };
  dex: {
    exists: boolean;
    dataLength: number;
    cachedAt: string | null;
    ageMs: number;
    isValid: boolean;
    expiresAt: string | null;
  };
  cacheDurations: {
    cexHours: number;
    dexHours: number;
  };
}

export function CacheMonitor() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onToggle } = useDisclosure();

  const fetchCacheStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cache-status');
      const data = await response.json();
      setCacheStatus(data);
    } catch (error) {
      console.error('Failed to fetch cache status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCacheStatus();
    }
  }, [isOpen]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onToggle}
        colorScheme="gray"
      >
        Cache Monitor {isOpen ? '▼' : '▶'}
      </Button>
      
      <Collapse in={isOpen} animateOpacity>
        <Box 
          mt={4} 
          p={4} 
          border="1px" 
          borderColor="gray.200" 
          borderRadius="md"
          bg="gray.50"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold" fontSize="sm">Cache Status</Text>
            <Button 
              size="xs" 
              onClick={fetchCacheStatus} 
              isLoading={isLoading}
              colorScheme="blue"
            >
              Refresh
            </Button>
          </HStack>

          {cacheStatus && (
            <VStack spacing={3} align="stretch">
              {/* CEX Cache Status */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="semibold" fontSize="sm">CEX Cache</Text>
                  <Badge 
                    colorScheme={cacheStatus.cex.isValid ? 'green' : 'red'}
                    fontSize="xs"
                  >
                    {cacheStatus.cex.isValid ? 'Valid' : 'Expired'}
                  </Badge>
                </HStack>
                <VStack spacing={1} align="stretch" fontSize="xs">
                  <HStack justify="space-between">
                    <Text>Exchanges:</Text>
                    <Text>{cacheStatus.cex.dataLength}</Text>
                  </HStack>
                  {cacheStatus.cex.cachedAt && (
                    <>
                      <HStack justify="space-between">
                        <Text>Cached:</Text>
                        <Text>{formatRelativeTime(cacheStatus.cex.cachedAt)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Age:</Text>
                        <Text>{Math.round(cacheStatus.cex.ageMs / (1000 * 60 * 60))}h</Text>
                      </HStack>
                    </>
                  )}
                  <HStack justify="space-between">
                    <Text>Duration:</Text>
                    <Text>{cacheStatus.cacheDurations.cexHours}h</Text>
                  </HStack>
                </VStack>
              </Box>

              <Divider />

              {/* DEX Cache Status */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="semibold" fontSize="sm">DEX Cache</Text>
                  <Badge 
                    colorScheme={cacheStatus.dex.isValid ? 'green' : 'red'}
                    fontSize="xs"
                  >
                    {cacheStatus.dex.isValid ? 'Valid' : 'Expired'}
                  </Badge>
                </HStack>
                <VStack spacing={1} align="stretch" fontSize="xs">
                  <HStack justify="space-between">
                    <Text>DEXes:</Text>
                    <Text>{cacheStatus.dex.dataLength}</Text>
                  </HStack>
                  {cacheStatus.dex.cachedAt && (
                    <>
                      <HStack justify="space-between">
                        <Text>Cached:</Text>
                        <Text>{formatRelativeTime(cacheStatus.dex.cachedAt)}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Age:</Text>
                        <Text>{Math.round(cacheStatus.dex.ageMs / (1000 * 60 * 60))}h</Text>
                      </HStack>
                    </>
                  )}
                  <HStack justify="space-between">
                    <Text>Duration:</Text>
                    <Text>{cacheStatus.cacheDurations.dexHours}h</Text>
                  </HStack>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.600" mt={2}>
                Last updated: {formatRelativeTime(cacheStatus.timestamp)}
              </Text>
            </VStack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}