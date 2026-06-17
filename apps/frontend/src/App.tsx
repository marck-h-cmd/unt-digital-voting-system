// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { ChakraProvider, extendTheme, Box, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Toaster } from 'react-hot-toast';

import { VotingInterface } from './components/voting/VotingInterface';
import { VotingDashboard } from './components/dashboard/VotingDashboard';
import { AuditPanel } from './components/dashboard/AuditPanel';
import { AdminPanel } from './components/admin/AdminPanel';
import { ZKPVerification } from './components/voting/ZKPVerification';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Configuración de Syscoin
const syscoinChain = {
  id: 5700,
  name: 'Syscoin Testnet',
  network: 'syscoin-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Syscoin',
    symbol: 'SYS',
  },
  rpcUrls: {
    public: { http: ['https://rpc-testnet.syscoin.org'] },
    default: { http: ['https://rpc-testnet.syscoin.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Sysscan',
      url: 'https://sysscan.io',
    },
  },
  testnet: true,
};

const projectId = import.meta.env.VITE_WALLET_CONNECT_ID || '';

const { chains, publicClient } = configureChains(
  [syscoinChain],
  [w3mProvider({ projectId }), publicProvider()]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    ...w3mConnectors({ projectId, chains })
  ],
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

// Tema personalizado de la UNT
const theme = extendTheme({
  colors: {
    unt: {
      primary: '#003366',
      secondary: '#FFD700',
      accent: '#E8F0FE',
      dark: '#001F3F',
      light: '#F5F8FF',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 'semibold',
      },
      variants: {
        primary: {
          bg: 'unt.primary',
          color: 'white',
          _hover: {
            bg: 'unt.dark',
            transform: 'scale(1.02)',
          },
          _active: {
            transform: 'scale(0.98)',
          },
        },
        secondary: {
          bg: 'unt.secondary',
          color: 'unt.dark',
          _hover: {
            bg: 'yellow.400',
            transform: 'scale(1.02)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'lg',
          transition: 'all 0.2s',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: 'xl',
          },
        },
      },
    },
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
      <WagmiConfig config={wagmiConfig}>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode="light" />
          <Web3Modal
            projectId={projectId}
            ethereumClient={ethereumClient}
          />
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box flex="1" py={8} px={4}>
              <ErrorBoundary>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<VotingInterface />} />
                    <Route path="/dashboard" element={<VotingDashboard />} />
                    <Route path="/audit" element={<AuditPanel />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/verify/:voteHash" element={<ZKPVerification />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </Box>
            <Footer />
          </Box>
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
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;