// frontend/src/hooks/useBlockchain.ts
import { useState } from 'react';
import { useAccount, useNetwork, useBalance } from 'wagmi';
import { ethers } from 'ethers';

export const useBlockchain = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({ address });
  const [isLoading, setIsLoading] = useState(false);

  const getGasPrice = async (): Promise<string> => {
    try {
      const response = await fetch('https://rpc-testnet.syscoin.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      return ethers.formatUnits(data.result, 'gwei');
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return '20';
    }
  };

  const getNetworkInfo = async () => {
    try {
      const response = await fetch('https://rpc-testnet.syscoin.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'net_version',
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      return {
        chainId: data.result,
        name: chain?.name || 'Syscoin Testnet',
        network: 'syscoin-testnet',
      };
    } catch (error) {
      console.error('Error fetching network info:', error);
      return null;
    }
  };

  const getTransactionReceipt = async (txHash: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://rpc-testnet.syscoin.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
      });
      const data = await response.json();
      return data.result;
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionConfirmations = async (txHash: string): Promise<number> => {
    try {
      const receipt = await getTransactionReceipt(txHash);
      if (!receipt) return 0;

      const blockNumber = parseInt(receipt.blockNumber, 16);
      const currentBlock = await getCurrentBlock();
      return currentBlock - blockNumber + 1;
    } catch (error) {
      console.error('Error getting confirmations:', error);
      return 0;
    }
  };

  const getCurrentBlock = async (): Promise<number> => {
    try {
      const response = await fetch('https://rpc-testnet.syscoin.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.error('Error getting current block:', error);
      return 0;
    }
  };

  const getBalance = async (address: string) => {
    try {
      const response = await fetch('https://rpc-testnet.syscoin.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });
      const data = await response.json();
      return ethers.formatEther(data.result);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  return {
    getGasPrice,
    getNetworkInfo,
    getTransactionReceipt,
    getTransactionConfirmations,
    getCurrentBlock,
    getBalance,
    isLoading,
    chain,
    address,
    balance,
  };
};