import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  useToast,
  Badge,
  Divider,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';

interface DevCacheManagerProps {
  onCacheCleared?: () => void;
}

export function DevCacheManager({ onCacheCleared }: DevCacheManagerProps) {
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const toast = useToast();
  const bgColor = useColorModeValue('yellow.50', 'yellow.900');
  const borderColor = useColorModeValue('yellow.200', 'yellow.700');

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const clearCache = async (type: 'all' | 'cex' | 'dex' | 'ai') => {
    setIsClearing(type);
    
    try {
      const response = await fetch(`/api/dev-cache-clear?type=${type}`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Cache Cleared',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Trigger callback to refresh data
        if (onCacheCleared) {
          onCacheCleared();
        }
      } else {
        throw new Error(result.message || 'Failed to clear cache');
      }
    } catch (error) {
      toast({
        title: 'Cache Clear Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsClearing(null);
    }
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      mb={4}
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="sm" color="yellow.800">
            🛠️ Development Cache Manager
          </Heading>
          <Badge colorScheme="yellow" fontSize="xs">
            DEV ONLY
          </Badge>
        </HStack>
        
        <Text fontSize="sm" color="yellow.700">
          Clear cached data for debugging and testing purposes
        </Text>
        
        <Divider borderColor={borderColor} />
        
        <HStack spacing={2} flexWrap="wrap">
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={() => clearCache('all')}
            isLoading={isClearing === 'all'}
            loadingText="Clearing..."
          >
            Clear All Cache
          </Button>
          
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => clearCache('cex')}
            isLoading={isClearing === 'cex'}
            loadingText="Clearing..."
          >
            Clear CEX Cache
          </Button>
          
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            onClick={() => clearCache('dex')}
            isLoading={isClearing === 'dex'}
            loadingText="Clearing..."
          >
            Clear DEX Cache
          </Button>
          
          <Button
            size="sm"
            colorScheme="orange"
            variant="outline"
            onClick={() => clearCache('ai')}
            isLoading={isClearing === 'ai'}
            loadingText="Clearing..."
          >
            Reset AI State
          </Button>
        </HStack>
        
        <Text fontSize="xs" color="yellow.600">
          💡 Use "Clear All Cache" to force fresh API calls and restart AI processing
        </Text>
      </VStack>
    </Box>
  );
}