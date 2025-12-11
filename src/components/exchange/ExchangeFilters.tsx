import {
  Box,
  HStack,
  Input,
  Select,
  Button,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { SortOption } from '@/lib/types/exchange';

interface ExchangeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
  totalCount?: number;
  displayedCount?: number;
}

export function ExchangeFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onReset,
  totalCount,
  displayedCount,
}: ExchangeFiltersProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box mb={6} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
      <HStack spacing={4} flexWrap="wrap" mb={3}>
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
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
          maxW={{ base: '100%', md: '220px' }}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="trustScore">Trust Score (High to Low)</option>
          <option value="name">Name (A-Z)</option>
          <option value="makerFee">Maker Fee (Low to High)</option>
          <option value="takerFee">Taker Fee (Low to High)</option>
          <option value="volume">Volume (High to Low)</option>
        </Select>

        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </HStack>

      {totalCount !== undefined && displayedCount !== undefined && (
        <Text fontSize="sm" color="gray.600">
          Showing {displayedCount} of {totalCount} exchanges
        </Text>
      )}
    </Box>
  );
}
