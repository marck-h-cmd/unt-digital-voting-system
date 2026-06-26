import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import App from './App.tsx';

const projectId = import.meta.env.VITE_WALLET_CONNECT_ID || '';

const zkTanenbaum = {
  id: 57057,
  name: 'zkTanenbaum Testnet',
  network: 'zk-tanenbaum',
  nativeCurrency: {
    decimals: 18,
    name: 'Syscoin',
    symbol: 'TSYS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-zk.tanenbaum.io'],
    },
    public: {
      http: ['https://rpc-zk.tanenbaum.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'zkTanenbaum Explorer',
      url: 'https://explorer-zk.tanenbaum.io',
    },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [zkTanenbaum],
  [w3mProvider({ projectId }), publicProvider()]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    ...w3mConnectors({ projectId, chains }),
  ],
  publicClient,
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
