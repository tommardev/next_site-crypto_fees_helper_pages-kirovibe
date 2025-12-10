---
inclusion: always
---

# Component Patterns - MANDATORY

## Core Principle: Consistent Chakra UI Patterns

**Use Chakra UI components with consistent patterns for dark mode and accessibility.**

## Component Structure Standards

### File Organization (STRICT)
```typescript
// 1. Imports (external, then internal)
// 2. Type definitions
// 3. Component implementation
// 4. Exports

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

### Naming Conventions (MANDATORY)
- **PascalCase**: Component names (`ExchangeCard`, `FeeComparison`)
- **camelCase**: Props and functions (`onClick`, `handleSubmit`)
- **UPPER_SNAKE_CASE**: Constants (`MAX_EXCHANGES`, `CACHE_DURATION`)
- **use prefix**: Custom hooks (`useExchangeFees`, `useFilters`)

## Essential Component Patterns

### Layout Pattern (REQUIRED)
```typescript
// components/layout/Layout.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Container maxW="container.xl" flex="1" py={8} px={{ base: 4, md: 8 }}>
        {children}
      </Container>
      <Footer />
    </Flex>
  );
}
```

### Dark Mode Pattern (MANDATORY)
```typescript
// Always use useColorModeValue for dark mode compatibility
import { useColorModeValue } from '@chakra-ui/react';

export function ExchangeCard({ exchange }: ExchangeCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box bg={bgColor} borderColor={borderColor} _hover={{ bg: hoverBg }}>
      {/* Content */}
    </Box>
  );
}
```

### Loading State Pattern (REQUIRED)
```typescript
// components/exchange/ExchangeSkeleton.tsx
export function ExchangeSkeleton() {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Flex gap={4}>
        <SkeletonCircle size="48px" />
        <VStack align="start" flex={1} spacing={2}>
          <Skeleton height="20px" width="150px" />
          <Skeleton height="16px" width="200px" />
        </VStack>
      </Flex>
    </Box>
  );
}
```

### Grid Pattern (REQUIRED)
```typescript
// components/exchange/ExchangeGrid.tsx
export function ExchangeGrid({ exchanges, isLoading }: ExchangeGridProps) {
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <ExchangeGridSkeleton count={9} />
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {exchanges.map((exchange, index) => (
        <ExchangeCard key={exchange.exchangeId} exchange={exchange} rank={index + 1} />
      ))}
    </SimpleGrid>
  );
}
```

### Filter Pattern (REQUIRED)
```typescript
// components/exchange/ExchangeFilters.tsx
export function ExchangeFilters({ searchQuery, onSearchChange, sortBy, onSortChange, onReset }: ExchangeFiltersProps) {
  return (
    <Box mb={6}>
      <HStack spacing={4} flexWrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
          <Input placeholder="Search exchanges..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
        </InputGroup>
        <Select maxW="200px" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="rank">Rank</option>
          <option value="name">Name (A-Z)</option>
          <option value="makerFee">Maker Fee (Low to High)</option>
        </Select>
        <Button variant="outline" onClick={onReset}>Reset</Button>
      </HStack>
    </Box>
  );
}
```

## Animation Patterns

### Page Transitions (RECOMMENDED)
```typescript
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
}
```

### Card Hover Animation (RECOMMENDED)
```typescript
const MotionBox = motion(Box);

<MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition="all 0.2s">
  {/* Card content */}
</MotionBox>
```

## Error Handling Patterns

### Error Boundary (REQUIRED)
```typescript
// components/common/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={10}>
          <VStack spacing={4}>
            <Heading size="lg">Something went wrong</Heading>
            <Text color="gray.600">{this.state.error?.message || 'An unexpected error occurred'}</Text>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </VStack>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

### Error Alert (REQUIRED)
```typescript
// components/common/ErrorAlert.tsx
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

## Accessibility Requirements (MANDATORY)

### ARIA Labels
- Always provide `aria-label` for icon buttons
- Use semantic HTML elements (`<nav>`, `<main>`, `<footer>`)
- Ensure keyboard navigation works

### Focus Management
```typescript
<Button _focus={{ boxShadow: 'outline', outline: '2px solid', outlineColor: 'blue.500' }}>
  Click me
</Button>
```

### Color Contrast
- Use Chakra UI's color mode values for proper contrast
- Test with both light and dark modes
- Avoid color-only indicators (use icons + color)

## Performance Patterns

### Lazy Loading
```typescript
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

## Critical Rules

### ✅ ALWAYS DO:
- Use `useColorModeValue` for all color values
- Implement loading skeletons for all data-dependent components
- Add proper TypeScript interfaces for all props
- Include ARIA labels for interactive elements
- Use responsive breakpoints (`{{ base: 1, md: 2, lg: 3 }}`)
- Implement error boundaries around major component trees

### ❌ NEVER DO:
- Hardcode colors (use theme values)
- Skip loading states
- Use `any` types for component props
- Forget fallback images for exchange logos
- Skip responsive design considerations

**Remember: Consistency in component patterns ensures maintainable, accessible, and performant UI.**
