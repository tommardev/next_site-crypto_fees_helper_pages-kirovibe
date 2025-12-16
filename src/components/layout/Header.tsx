import {
  Box,
  Flex,
  HStack,
  Link,
  useColorMode,
  IconButton,
  Container,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { RealtimeIndicator } from '../common/RealtimeIndicator';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8}>
            <Link
              as={NextLink}
              href="/"
              fontSize="xl"
              fontWeight="bold"
              _hover={{ textDecoration: 'none' }}
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
            >
              CryptoFees
            </Link>
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Link as={NextLink} href="/" _hover={{ color: 'blue.500' }}>
                CEX Fees
              </Link>
              <Link as={NextLink} href="/dex" _hover={{ color: 'blue.500' }}>
                DEX Fees
              </Link>
              <Link as={NextLink} href="/about" _hover={{ color: 'blue.500' }}>
                About
              </Link>
              <Link as={NextLink} href="/contact" _hover={{ color: 'blue.500' }}>
                Contact
              </Link>
            </HStack>
          </HStack>

          <HStack spacing={2}>
            {/* Real-time status indicator */}
            <RealtimeIndicator showDetails={false} />
            
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />

            {/* Mobile menu */}
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                display={{ base: 'flex', md: 'none' }}
              />
              <MenuList>
                <MenuItem as={NextLink} href="/">
                  CEX Fees
                </MenuItem>
                <MenuItem as={NextLink} href="/dex">
                  DEX Fees
                </MenuItem>
                <MenuItem as={NextLink} href="/about">
                  About
                </MenuItem>
                <MenuItem as={NextLink} href="/contact">
                  Contact
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
