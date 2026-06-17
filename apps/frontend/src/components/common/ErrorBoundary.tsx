// frontend/src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, VStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box
            minH="400px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={8}
          >
            <VStack spacing={6} maxW="md" textAlign="center">
              <Icon as={FaExclamationTriangle} boxSize={16} color="red.500" />
              <Heading size="lg">Algo salió mal</Heading>
              <Text color="gray.600">
                {this.state.error?.message || 'Ha ocurrido un error inesperado'}
              </Text>
              <Button
                leftIcon={<FaSync />}
                colorScheme="primary"
                onClick={this.handleReload}
              >
                Recargar Página
              </Button>
            </VStack>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}