import {
  Box,
  Heading,
  Text,
  VStack,
  Link,
  HStack,
  Icon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { EmailIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Layout } from '@/components/layout/Layout';

export default function ContactPage() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="600px" mx="auto">
        <Box>
          <Heading size="xl" mb={4}>
            Contact Us
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Have questions, suggestions, or found an issue? We'd love to hear from you!
          </Text>
        </Box>

        <Divider />

        <VStack spacing={6} align="stretch">
          <Box
            p={6}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <HStack spacing={3} mb={3}>
              <Icon as={EmailIcon} boxSize={5} color="blue.500" />
              <Heading size="md">Email</Heading>
            </HStack>
            <Text mb={2}>
              For general inquiries, feedback, or support:
            </Text>
            <Link
              href="mailto:contact@cryptofees.com"
              color="blue.500"
              fontWeight="semibold"
            >
              contact@cryptofees.com
            </Link>
          </Box>

          <Box
            p={6}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <HStack spacing={3} mb={3}>
              <Icon as={ExternalLinkIcon} boxSize={5} color="purple.500" />
              <Heading size="md">Report Issues</Heading>
            </HStack>
            <Text mb={2}>
              Found incorrect data or a bug? Help us improve:
            </Text>
            <Link
              href="https://github.com/cryptofees/issues"
              color="blue.500"
              fontWeight="semibold"
              isExternal
            >
              Report on GitHub <ExternalLinkIcon mx="2px" />
            </Link>
          </Box>

          <Box
            p={6}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <Heading size="md" mb={3}>
              Feature Requests
            </Heading>
            <Text mb={3}>
              Want to see a specific exchange or feature? Let us know what would 
              make CryptoFees more useful for you.
            </Text>
            <Text fontSize="sm" color="gray.600">
              We're constantly working to improve the platform and add new data sources.
            </Text>
          </Box>

          <Box
            p={6}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
          >
            <Heading size="md" mb={3}>
              Data Partnerships
            </Heading>
            <Text mb={3}>
              Are you an exchange or data provider interested in partnering with us?
            </Text>
            <Link
              href="mailto:partnerships@cryptofees.com"
              color="blue.500"
              fontWeight="semibold"
            >
              partnerships@cryptofees.com
            </Link>
          </Box>
        </VStack>

        <Box pt={4}>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            We typically respond within 24-48 hours during business days.
          </Text>
        </Box>
      </VStack>
    </Layout>
  );
}
