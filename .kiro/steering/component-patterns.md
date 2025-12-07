---
inclusion: always
---

# Component Patterns & UI Guidelines

## Component Structure Standards

### File Organization
```typescript
// Each component file should follow this structure:
// 1. Imports (external, then internal)
// 2. Type definitions
// 3. Component implementation
// 4. Exports

// Example: ExchangeCard.tsx
import { Box, Text, Badge, Image, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface ExchangeCardProps {
  exchange: CEXFees;
  onClick?: () => void;
}

export function ExchangeCard({ exchange, onClick }: ExchangeCardProps) {
  // Component logic
}
```

### Component Naming Conventions
- **PascalCase** for component names: `ExchangeCard`, `FeeComparison`
- **camelCase** for props and functions: `onClick`, `handleSubmit`
- **UPPER_SNAKE_CASE** for constants: `MAX_EXCHANGES`, `CACHE_DURATION`
- Prefix custom hooks with `use`: `useExchangeFees`, `useFilters`

## Chakra UI Component Patterns

### Layout Components

#### Responsive Container
```typescript
// components/layout/Layout.tsx
import { Box, Container, Flex } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Container
        maxW="container.xl"
        flex="1"
        py={8}
        px={{ base: 4, md: 8 }}
      >
        {children}
      </Container>
      <Footer />
    </Flex>
  );
}
```

#### Header with Navigation
```typescript
// components/layout/Header.tsx
import { Box, Flex, HStack, Link, useColorMode, IconButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="header"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      borderBottom="1px"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8}>
            <Link as={NextLink} href="/" fontSize="xl" fontWeight="bold">
              CryptoFees
            </Link>
            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Link as={NextLink} href="/">CEX Fees</Link>
              <Link as={NextLink} href="/dex">DEX Fees</Link>
              <Link as={NextLink} href="/about">About</Link>
              <Link as={NextLink} href="/contact">Contact</Link>
            </HStack>
          </HStack>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
          />
        </Flex>
      </Container>
    </Box>
  );
}
```

### Exchange Card Component

```typescript
// components/exchange/ExchangeCard.tsx
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
            fallbackSrc="/logos/default.png"
          />
        </VStack>

        {/* Exchange Info */}
        <VStack align="start" flex={1} spacing={2}>
          <Text fontWeight="bold" fontSize="lg">
            {exchange.exchangeName}
          </Text>
          
          <HStack spacing={4} fontSize="sm">
            <Tooltip label="Maker Fee">
              <Text>
                Maker: <Text as="span" fontWeight="semibold" color="green.500">
                  {exchange.makerFee}%
                </Text>
              </Text>
            </Tooltip>
            
            <Tooltip label="Taker Fee">
              <Text>
                Taker: <Text as="span" fontWeight="semibold" color="blue.500">
                  {exchange.takerFee}%
                </Text>
              </Text>
            </Tooltip>
          </HStack>

          <HStack spacing={2}>
            <Badge colorScheme="purple">
              Trust: {exchange.trustScore}/10
            </Badge>
            {exchange.country && (
              <Badge colorScheme="gray">{exchange.country}</Badge>
            )}
          </HStack>
        </VStack>
      </Flex>
    </MotionBox>
  );
}
```

### Skeleton Loading Component

```typescript
// components/exchange/ExchangeSkeleton.tsx
import { Box, Flex, Skeleton, SkeletonCircle, VStack } from '@chakra-ui/react';

export function ExchangeSkeleton() {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Flex gap={4}>
        <SkeletonCircle size="48px" />
        <VStack align="start" flex={1} spacing={2}>
          <Skeleton height="20px" width="150px" />
          <Skeleton height="16px" width="200px" />
          <Skeleton height="16px" width="100px" />
        </VStack>
      </Flex>
    </Box>
  );
}

// Grid of skeletons
export function ExchangeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ExchangeSkeleton key={i} />
      ))}
    </>
  );
}
```

### Exchange Grid with Filters

```typescript
// components/exchange/ExchangeGrid.tsx
import { SimpleGrid, Box, Text } from '@chakra-ui/react';
import { ExchangeCard } from './ExchangeCard';
import { ExchangeGridSkeleton } from './ExchangeSkeleton';
import { CEXFees } from '@/lib/types/exchange';

interface ExchangeGridProps {
  exchanges: CEXFees[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ExchangeGrid({
  exchanges,
  isLoading,
  emptyMessage = 'No exchanges found',
}: ExchangeGridProps) {
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <ExchangeGridSkeleton count={9} />
      </SimpleGrid>
    );
  }

  if (exchanges.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.500">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {exchanges.map((exchange, index) => (
        <ExchangeCard
          key={exchange.exchangeId}
          exchange={exchange}
          rank={index + 1}
        />
      ))}
    </SimpleGrid>
  );
}
```

### Filter & Sort Controls

```typescript
// components/exchange/ExchangeFilters.tsx
import {
  Box,
  HStack,
  Input,
  Select,
  Button,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

interface ExchangeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

export function ExchangeFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onReset,
}: ExchangeFiltersProps) {
  return (
    <Box mb={6}>
      <HStack spacing={4} flexWrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search exchanges..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>

        <Select
          maxW="200px"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="rank">Rank</option>
          <option value="name">Name (A-Z)</option>
          <option value="makerFee">Maker Fee (Low to High)</option>
          <option value="takerFee">Taker Fee (Low to High)</option>
          <option value="volume">Volume (High to Low)</option>
          <option value="trustScore">Trust Score (High to Low)</option>
        </Select>

        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </HStack>
    </Box>
  );
}
```

## Animation Patterns

### Page Transitions
```typescript
// Use framer-motion for smooth transitions
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### Stagger Children Animation
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Usage in grid
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {exchanges.map((exchange) => (
    <motion.div key={exchange.id} variants={itemVariants}>
      <ExchangeCard exchange={exchange} />
    </motion.div>
  ))}
</motion.div>
```

## Error Handling Components

### Error Boundary
```typescript
// components/common/ErrorBoundary.tsx
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={10}>
          <VStack spacing={4}>
            <Heading size="lg">Something went wrong</Heading>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

### Error Alert
```typescript
// components/common/ErrorAlert.tsx
import { Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton } from '@chakra-ui/react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

export function ErrorAlert({ title = 'Error', message, onClose }: ErrorAlertProps) {
  return (
    <Alert status="error" borderRadius="md">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Box>
      {onClose && <CloseButton onClick={onClose} />}
    </Alert>
  );
}
```

## Accessibility Guidelines

### ARIA Labels
- Always provide `aria-label` for icon buttons
- Use semantic HTML elements (`<nav>`, `<main>`, `<footer>`)
- Ensure keyboard navigation works for all interactive elements

### Color Contrast
- Use Chakra UI's color mode values for proper contrast
- Test with both light and dark modes
- Avoid color-only indicators (use icons + color)

### Focus Management
```typescript
// Ensure visible focus indicators
<Button
  _focus={{
    boxShadow: 'outline',
    outline: '2px solid',
    outlineColor: 'blue.500',
  }}
>
  Click me
</Button>
```

## Performance Optimization

### Lazy Loading
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton height="300px" />,
  ssr: false,
});
```

### Memoization
```typescript
import { memo, useMemo } from 'react';

// Memoize expensive computations
const sortedExchanges = useMemo(() => {
  return exchanges.sort((a, b) => a.makerFee - b.makerFee);
}, [exchanges]);

// Memoize components that don't need frequent re-renders
export const ExchangeCard = memo(ExchangeCardComponent);
```

### Image Optimization
```typescript
// Use next/image for optimized images (with fallback for static export)
import Image from 'next/image';

<Image
  src={exchange.logo}
  alt={exchange.name}
  width={48}
  height={48}
  loading="lazy"
/>
```
