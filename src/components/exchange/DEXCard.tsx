import {
  Box,
  Flex,
  Image,
  Text,
  Badge,
  HStack,
  VStack,
  useColorModeValue,
  Tooltip,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { DEXFees } from '@/lib/types/exchange';
import { formatFee, formatUSD } from '@/lib/utils/formatters';

const MotionBox = motion(Box);

interface DEXCardProps {
  dex: DEXFees;
  rank?: number;
}

export function DEXCard({ dex, rank }: DEXCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'AMM': return 'green';
      case 'Aggregator': return 'purple';
      case 'Order Book': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <MotionBox
      as="a"
      href={dex.url}
      target="_blank"
      rel="noopener noreferrer"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      cursor="pointer"
      transition="all 0.2s"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      _hover={{ bg: hoverBg, shadow: 'md' }}
    >
      <Flex gap={4}>
        {/* Logo & Rank */}
        <VStack spacing={1}>
          {rank && (
            <Badge colorScheme="blue" fontSize="xs">
              #{rank}
            </Badge>
          )}
          <Image
            src={dex.logo}
            alt={dex.dexName}
            boxSize="48px"
            objectFit="contain"
            fallbackSrc="/logos/default.png"
          />
        </VStack>

        {/* DEX Info */}
        <VStack align="start" flex={1} spacing={2}>
          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
            {dex.dexName}
          </Text>
          
          <HStack spacing={4} fontSize="sm" flexWrap="wrap">
            <Tooltip label="Swap Fee" hasArrow>
              <Text>
                Fee: <Text 
                  as="span" 
                  fontWeight="semibold" 
                  color={dex.swapFee !== null ? "green.500" : "gray.500"}
                  fontStyle={dex.swapFee === null ? "italic" : "normal"}
                >
                  {formatFee(dex.swapFee)}
                </Text>
              </Text>
            </Tooltip>
            
            {dex.liquidityUSD > 0 && (
              <Tooltip label="Total Value Locked" hasArrow>
                <Text fontSize="xs">
                  TVL: <Text as="span" fontWeight="semibold" color="blue.500">
                    {formatUSD(dex.liquidityUSD)}
                  </Text>
                </Text>
              </Tooltip>
            )}
          </HStack>

          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={getProtocolColor(dex.protocol)}>
              {dex.protocol}
            </Badge>
            {dex.volume24h > 0 && (
              <Tooltip label="24h Volume" hasArrow>
                <Badge colorScheme="cyan" fontSize="xs">
                  Vol: {formatUSD(dex.volume24h)}
                </Badge>
              </Tooltip>
            )}
          </HStack>

          {/* Blockchains */}
          <Wrap spacing={1}>
            {dex.blockchain.slice(0, 3).map((chain) => (
              <WrapItem key={chain}>
                <Badge size="sm" fontSize="xs" colorScheme="gray">
                  {chain}
                </Badge>
              </WrapItem>
            ))}
            {dex.blockchain.length > 3 && (
              <WrapItem>
                <Badge size="sm" fontSize="xs" colorScheme="gray">
                  +{dex.blockchain.length - 3}
                </Badge>
              </WrapItem>
            )}
          </Wrap>
        </VStack>
      </Flex>
    </MotionBox>
  );
}
