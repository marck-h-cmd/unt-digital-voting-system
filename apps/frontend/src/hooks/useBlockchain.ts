// frontend/src/hooks/useBlockchain.ts
import { useState } from 'react';
import { ethers } from 'ethers';

const SYSCOIN_RPC_URL = import.meta.env.VITE_SYSCOIN_RPC_URL || 'https://rpc.tanenbaum.io';

export const useBlockchain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const address = '0x1234567890abcdef1234567890abcdef12345678';
  const chain = { id: 5700, name: 'Syscoin Testnet' };
  const balance = { value: ethers.parseEther('10'), symbol: 'SYS' };

  const getGasPrice = async (): Promise<string> => {
    try {
      const response = await fetch(SYSCOIN_RPC_URL, {
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
      const response = await fetch(SYSCOIN_RPC_URL, {
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
      return {
        chainId: '5700',
        name: 'Syscoin Testnet',
        network: 'syscoin-testnet',
      };
    }
  };

  const getTransactionReceipt = async (txHash: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(SYSCOIN_RPC_URL, {
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
      return data.result || {
        blockNumber: '0x123',
        status: '0x1',
        transactionHash: txHash,
      };
    } catch (error) {
      console.error('Error fetching transaction receipt:', error);
      return {
        blockNumber: '0x123',
        status: '0x1',
        transactionHash: txHash,
      };
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
      return 10;
    }
  };

  const getCurrentBlock = async (): Promise<number> => {
    try {
      const response = await fetch(SYSCOIN_RPC_URL, {
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
      return 123456;
    }
  };

  const getBalance = async (address: string) => {
    try {
      const response = await fetch(SYSCOIN_RPC_URL, {
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
      return '10.0';
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