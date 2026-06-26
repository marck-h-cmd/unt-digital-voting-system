import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { syscoin } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import App from './App.tsx';

// Configurar cadenas
const projectId = import.meta.env.VITE_WALLET_CONNECT_ID || '';
const { chains, publicClient } = configureChains(
  [syscoin],
  [w3mProvider({ projectId }), publicProvider()]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <App />
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </WagmiConfig>
  </React.StrictMode>,
);
