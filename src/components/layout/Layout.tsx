import { Box, Container, Flex } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Container
        as="main"
        maxW="container.xl"
        flex="1"
        py={8}
        px={{ base: 4, md: 8 }}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Container>
      <Footer />
    </Flex>
  );
}
