import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
  HStack,
  Divider,
} from '@chakra-ui/react';
import NextLink from 'next/link';

export function Footer() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="footer"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      mt="auto"
    >
      <Container maxW="container.xl" py={8}>
        <Stack spacing={4}>
          <HStack spacing={8} justify="center" flexWrap="wrap">
            <Link as={NextLink} href="/" fontSize="sm">
              CEX Fees
            </Link>
            <Link as={NextLink} href="/dex" fontSize="sm">
              DEX Fees
            </Link>
            <Link as={NextLink} href="/about" fontSize="sm">
              About
            </Link>
            <Link as={NextLink} href="/contact" fontSize="sm">
              Contact
            </Link>
          </HStack>

          <Divider />

          <Stack spacing={2} align="center">
            <Text fontSize="sm" color="gray.600">
              Compare cryptocurrency exchange fees across CEX and DEX platforms
            </Text>
            <Text fontSize="xs" color="gray.500">
              Data provided by CoinGecko API • Updated every 24 hours
            </Text>
            <Text fontSize="xs" color="gray.500">
              © {new Date().getFullYear()} CryptoFees. All rights reserved.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
