import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { Layout } from '@/components/layout/Layout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DebugPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: debugData, error, isLoading } = useSWR(
    `/api/debug-data?_=${refreshKey}`, 
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <Layout>
        <Box textAlign="center" py={10}>
          <Heading size="lg" mb={4}>Debug Page</Heading>
          <Text color="gray.500">This page is only available in development mode.</Text>
        </Box>
      </Layout>
    );
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (error) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          Failed to load debug data: {error.message}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="xl">Debug Data Viewer</Heading>
            <Button 
              onClick={handleRefresh} 
              isLoading={isLoading}
              colorScheme="blue"
              size="sm"
            >
              Refresh Data
            </Button>
          </HStack>
          <Text color="gray.600" mb={2}>
            Development tool to inspect cached data, AI processing status, and data correctness
          </Text>
          {debugData?.timestamp && (
            <Badge colorScheme="green">
              Last updated: {new Date(debugData.timestamp).toLocaleString()}
            </Badge>
          )}
        </Box>

        {isLoading && (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" />
            <Text mt={4}>Loading debug data...</Text>
          </Box>
        )}

        {debugData && (
          <Tabs variant="enclosed">
            <TabList>
              <Tab>CEX Data</Tab>
              <Tab>DEX Data</Tab>
              <Tab>AI Status</Tab>
              <Tab>Configuration</Tab>
            </TabList>

            <TabPanels>
              {/* CEX Data Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={3}>CEX Cache Status</Heading>
                    <HStack spacing={4} flexWrap="wrap">
                      <Badge colorScheme={debugData.cex?.cached ? 'green' : 'red'}>
                        {debugData.cex?.cached ? 'Cached' : 'No Cache'}
                      </Badge>
                      {debugData.cex?.cacheAge !== null && (
                        <Badge colorScheme="blue">
                          Cache Age: {debugData.cex.cacheAge}h
                        </Badge>
                      )}
                      <Badge colorScheme="purple">
                        Total: {debugData.cex?.totalExchanges || 0} exchanges
                      </Badge>
                      <Badge colorScheme={debugData.cex?.aiProcessing ? 'yellow' : 'green'}>
                        {debugData.cex?.aiProcessing ? 'AI Processing' : 'AI Ready'}
                      </Badge>
                    </HStack>
                  </Box>

                  {debugData.cex?.feeDataStatus && (
                    <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Heading size="md" mb={3}>Fee Data Status</Heading>
                      <HStack spacing={4}>
                        <Badge colorScheme="green">
                          With Maker Fee: {debugData.cex.feeDataStatus.withMakerFee}
                        </Badge>
                        <Badge colorScheme="green">
                          With Taker Fee: {debugData.cex.feeDataStatus.withTakerFee}
                        </Badge>
                        <Badge colorScheme="orange">
                          Without Fees: {debugData.cex.feeDataStatus.withoutFees}
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  {debugData.cex?.sampleData && debugData.cex.sampleData.length > 0 && (
                    <Accordion allowToggle>
                      <AccordionItem>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Heading size="md">Sample Data (First 3 Exchanges)</Heading>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <Code display="block" whiteSpace="pre" p={4} borderRadius="md">
                            {JSON.stringify(debugData.cex.sampleData, null, 2)}
                          </Code>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {debugData.cex?.dataStructure && (
                    <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Heading size="md" mb={3}>Data Structure</Heading>
                      <HStack spacing={2} flexWrap="wrap">
                        {debugData.cex.dataStructure.map((field: string) => (
                          <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* DEX Data Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={3}>DEX Cache Status</Heading>
                    <HStack spacing={4} flexWrap="wrap">
                      <Badge colorScheme={debugData.dex?.cached ? 'green' : 'red'}>
                        {debugData.dex?.cached ? 'Cached' : 'No Cache'}
                      </Badge>
                      {debugData.dex?.cacheAge !== null && (
                        <Badge colorScheme="blue">
                          Cache Age: {debugData.dex.cacheAge}h
                        </Badge>
                      )}
                      <Badge colorScheme="purple">
                        Total: {debugData.dex?.totalDEXes || 0} DEXes
                      </Badge>
                      <Badge colorScheme={debugData.dex?.aiProcessing ? 'yellow' : 'green'}>
                        {debugData.dex?.aiProcessing ? 'AI Processing' : 'AI Ready'}
                      </Badge>
                    </HStack>
                  </Box>

                  {debugData.dex?.feeDataStatus && (
                    <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Heading size="md" mb={3}>Fee Data Status</Heading>
                      <HStack spacing={4}>
                        <Badge colorScheme="green">
                          With Swap Fee: {debugData.dex.feeDataStatus.withSwapFee}
                        </Badge>
                        <Badge colorScheme="orange">
                          Without Fees: {debugData.dex.feeDataStatus.withoutFees}
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  {debugData.dex?.sampleData && debugData.dex.sampleData.length > 0 && (
                    <Accordion allowToggle>
                      <AccordionItem>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Heading size="md">Sample Data (First 3 DEXes)</Heading>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <Code display="block" whiteSpace="pre" p={4} borderRadius="md">
                            {JSON.stringify(debugData.dex.sampleData, null, 2)}
                          </Code>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {debugData.dex?.dataStructure && (
                    <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Heading size="md" mb={3}>Data Structure</Heading>
                      <HStack spacing={2} flexWrap="wrap">
                        {debugData.dex.dataStructure.map((field: string) => (
                          <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* AI Status Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={3}>AI Processing Status</Heading>
                    <VStack align="stretch" spacing={3}>
                      <HStack>
                        <Text fontWeight="bold">CEX AI Processing:</Text>
                        <Badge colorScheme={debugData.aiStatus?.cexProcessing ? 'yellow' : 'green'}>
                          {debugData.aiStatus?.cexProcessing ? 'Active' : 'Idle'}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">DEX AI Processing:</Text>
                        <Badge colorScheme={debugData.aiStatus?.dexProcessing ? 'yellow' : 'green'}>
                          {debugData.aiStatus?.dexProcessing ? 'Active' : 'Idle'}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Box>

                  {debugData.aiStatus?.circuitBreaker && (
                    <Alert status="warning">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">Circuit Breaker Active</Text>
                        <Text fontSize="sm">
                          Blocked until: {new Date(debugData.aiStatus.circuitBreaker.until).toLocaleString()}
                        </Text>
                      </VStack>
                    </Alert>
                  )}

                  {(debugData.aiStatus?.lastCEXError || debugData.aiStatus?.lastDEXError) && (
                    <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Heading size="md" mb={3}>Recent AI Errors</Heading>
                      {debugData.aiStatus.lastCEXError && (
                        <Alert status="error" mb={2}>
                          <AlertIcon />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">CEX AI Error:</Text>
                            <Text fontSize="sm">{debugData.aiStatus.lastCEXError}</Text>
                          </VStack>
                        </Alert>
                      )}
                      {debugData.aiStatus.lastDEXError && (
                        <Alert status="error">
                          <AlertIcon />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">DEX AI Error:</Text>
                            <Text fontSize="sm">{debugData.aiStatus.lastDEXError}</Text>
                          </VStack>
                        </Alert>
                      )}
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* Configuration Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={3}>API Keys Configuration</Heading>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Text fontWeight="bold">Gemini API Key:</Text>
                        <Badge colorScheme={debugData.config?.hasGeminiKey ? 'green' : 'red'}>
                          {debugData.config?.hasGeminiKey ? 'Configured' : 'Missing'}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">CoinMarketCap API Key:</Text>
                        <Badge colorScheme={debugData.config?.hasCMCKey ? 'green' : 'red'}>
                          {debugData.config?.hasCMCKey ? 'Configured' : 'Missing'}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">CoinGecko API Key:</Text>
                        <Badge colorScheme={debugData.config?.hasCoinGeckoKey ? 'green' : 'yellow'}>
                          {debugData.config?.hasCoinGeckoKey ? 'Configured' : 'Optional'}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box bg={bgColor} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={3}>Cache Configuration</Heading>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Text fontWeight="bold">CEX Cache Duration:</Text>
                        <Badge colorScheme="blue">{debugData.config?.cexCacheHours}h</Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">DEX Cache Duration:</Text>
                        <Badge colorScheme="blue">{debugData.config?.dexCacheHours}h</Badge>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>
    </Layout>
  );
}