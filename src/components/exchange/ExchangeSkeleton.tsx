import { Box, Flex, Skeleton, SkeletonCircle, VStack, HStack } from '@chakra-ui/react';

export function ExchangeSkeleton() {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Flex gap={4}>
        <VStack spacing={1}>
          <Skeleton height="16px" width="30px" borderRadius="md" />
          <SkeletonCircle size="48px" />
        </VStack>
        <VStack align="start" flex={1} spacing={2}>
          <Skeleton height="20px" width="150px" />
          <HStack spacing={4}>
            <Skeleton height="16px" width="80px" />
            <Skeleton height="16px" width="80px" />
          </HStack>
          <HStack spacing={2}>
            <Skeleton height="20px" width="60px" borderRadius="md" />
            <Skeleton height="20px" width="50px" borderRadius="md" />
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}

export function ExchangeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ExchangeSkeleton key={i} />
      ))}
    </>
  );
}
