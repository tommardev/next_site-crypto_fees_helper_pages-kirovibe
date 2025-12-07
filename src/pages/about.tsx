import {
  Box,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
  ListIcon,
  Divider,
  Link,
} from '@chakra-ui/react';
import { CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';
import { Layout } from '@/components/layout/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
        <Box>
          <Heading size="xl" mb={4}>
            About CryptoFees
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Your comprehensive guide to cryptocurrency exchange fees
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>
            What We Do
          </Heading>
          <Text mb={4}>
            CryptoFees helps you compare trading fees across centralized (CEX) and 
            decentralized (DEX) cryptocurrency exchanges. We aggregate real-time data 
            from multiple sources to provide you with accurate, up-to-date fee information.
          </Text>
          <Text>
            Whether you're a day trader looking to minimize costs or a long-term investor 
            comparing platforms, our tool makes it easy to find the most cost-effective 
            exchange for your needs.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            Features
          </Heading>
          <List spacing={3}>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Real-time fee data from 100+ exchanges
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Compare maker and taker fees for CEX platforms
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              DEX swap fees and gas cost estimates
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Trust scores and volume metrics
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Filter and sort by multiple criteria
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Dark mode support for comfortable viewing
            </ListItem>
          </List>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            Data Sources
          </Heading>
          <Text mb={3}>
            We use reliable, free-tier APIs to ensure accurate and up-to-date information:
          </Text>
          <List spacing={2}>
            <ListItem>
              <ListIcon as={InfoIcon} color="blue.500" />
              <Link href="https://www.coingecko.com" isExternal color="blue.500">
                CoinGecko API
              </Link>
              {' '}for CEX exchange data
            </ListItem>
            <ListItem>
              <ListIcon as={InfoIcon} color="blue.500" />
              Public APIs from major exchanges (Binance, Kraken, Coinbase)
            </ListItem>
            <ListItem>
              <ListIcon as={InfoIcon} color="blue.500" />
              The Graph Protocol for DEX data (Uniswap, PancakeSwap, etc.)
            </ListItem>
          </List>
          <Text mt={3} fontSize="sm" color="gray.500">
            Data is cached for 24 hours to ensure optimal performance and respect API rate limits.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            Understanding Fees
          </Heading>
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontWeight="semibold">Maker Fee</Text>
              <Text fontSize="sm" color="gray.600">
                Fee charged when you add liquidity to the order book (limit orders)
              </Text>
            </Box>
            <Box>
              <Text fontWeight="semibold">Taker Fee</Text>
              <Text fontSize="sm" color="gray.600">
                Fee charged when you remove liquidity from the order book (market orders)
              </Text>
            </Box>
            <Box>
              <Text fontWeight="semibold">Swap Fee (DEX)</Text>
              <Text fontSize="sm" color="gray.600">
                Percentage fee charged by the protocol for token swaps
              </Text>
            </Box>
            <Box>
              <Text fontWeight="semibold">Gas Fee (DEX)</Text>
              <Text fontSize="sm" color="gray.600">
                Network transaction fee required to execute trades on blockchain
              </Text>
            </Box>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={3}>
            Disclaimer
          </Heading>
          <Text fontSize="sm" color="gray.600">
            The information provided on this website is for informational purposes only 
            and should not be considered financial advice. Fees may vary based on trading 
            volume, account type, and other factors. Always verify current fees on the 
            exchange's official website before trading. We are not affiliated with any 
            of the exchanges listed.
          </Text>
        </Box>
      </VStack>
    </Layout>
  );
}
