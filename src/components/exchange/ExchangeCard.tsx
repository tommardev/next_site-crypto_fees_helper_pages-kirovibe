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
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { CEXFees } from '@/lib/types/exchange';
import { formatFee, formatVolume } from '@/lib/utils/formatters';

const MotionBox = motion(Box);

interface ExchangeCardProps {
  exchange: CEXFees;
  rank?: number;
}

export function ExchangeCard({ exchange, rank }: ExchangeCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <MotionBox
      as="a"
      href={exchange.url}
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
            src={exchange.logo}
            alt={exchange.exchangeName}
            boxSize="48px"
            objectFit="contain"
            fallbackSrc="/logos/default.svg"
          />
        </VStack>

        {/* Exchange Info */}
        <VStack align="start" flex={1} spacing={2}>
          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
            {exchange.exchangeName}
          </Text>
          
          <HStack spacing={4} fontSize="sm" flexWrap="wrap">
            <Tooltip label="Maker Fee" hasArrow>
              <Text>
                Maker: <Text 
                  as="span" 
                  fontWeight="semibold" 
                  color={exchange.makerFee !== null ? "green.500" : "gray.500"}
                  fontStyle={exchange.makerFee === null ? "italic" : "normal"}
                >
                  {formatFee(exchange.makerFee)}
                </Text>
              </Text>
            </Tooltip>
            
            <Tooltip label="Taker Fee" hasArrow>
              <Text>
                Taker: <Text 
                  as="span" 
                  fontWeight="semibold" 
                  color={exchange.takerFee !== null ? "blue.500" : "gray.500"}
                  fontStyle={exchange.takerFee === null ? "italic" : "normal"}
                >
                  {formatFee(exchange.takerFee)}
                </Text>
              </Text>
            </Tooltip>
          </HStack>

          <HStack spacing={2} flexWrap="wrap">
            <Tooltip label={`Trust Score: ${exchange.trustScore}/10`} hasArrow>
              <Badge colorScheme="purple">
                Trust: {exchange.trustScore}/10
              </Badge>
            </Tooltip>
            {exchange.country && exchange.country !== 'Unknown' && (
              <Badge colorScheme="gray">{exchange.country}</Badge>
            )}
            {exchange.volume24h > 0 && (
              <Tooltip label="24h Volume" hasArrow>
                <Badge colorScheme="cyan" fontSize="xs">
                  {formatVolume(exchange.volume24h)}
                </Badge>
              </Tooltip>
            )}
          </HStack>
        </VStack>
      </Flex>
    </MotionBox>
  );
}
