// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { ChakraProvider, extendTheme, Box, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { VotingInterface } from './components/voting/VotingInterface';
import { VotingDashboard } from './components/dashboard/VotingDashboard';
import { AuditPanel } from './components/dashboard/AuditPanel';
import { AdminPanel } from './components/admin/AdminPanel';
import { ZKPVerification } from './components/voting/ZKPVerification';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Tema personalizado de la UNT
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  colors: {
    unt: {
      primary: '#003366',
      secondary: '#FFD700',
      accent: '#2B6CB0',
      dark: '#001F3F',
      light: '#F5F8FF',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'medium',
      },
      variants: {
        primary: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'unt.secondary' : 'unt.primary',
          color: props.colorMode === 'dark' ? 'gray.900' : 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'yellow.300' : 'unt.dark',
          },
        }),
        secondary: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'unt.secondary',
          color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'unt.dark',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'yellow.400',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          borderRadius: 'lg',
          boxShadow: 'sm',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderWidth: props.colorMode === 'dark' ? '1px' : '0px',
          borderColor: 'gray.700',
        },
      }),
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        }
      })
    }
  },
});

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30000,
      cacheTime: 600000,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode="light" />
        <BrowserRouter>
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box flex="1" py={8} px={4}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<VotingInterface />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <VotingDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audit"
                    element={
                      <ProtectedRoute>
                        <AuditPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/verify/:voteHash" element={<ZKPVerification />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </Box>
            <Footer />
          </Box>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              style: {
                background: '#22c55e',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;