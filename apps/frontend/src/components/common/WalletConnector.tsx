// frontend/src/components/common/WalletConnector.tsx
import React from 'react';
import { Button, HStack, Text } from '@chakra-ui/react';
import { useWeb3Modal } from '@web3modal/react';
import { useAccount, useDisconnect } from 'wagmi';
import { FaWallet, FaSignOutAlt } from 'react-icons/fa';

export const WalletConnector: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  if (isConnected) {
    return (
      <HStack spacing={2}>
        <Text fontSize="sm" fontFamily="mono" color="gray.600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => disconnect()}
          leftIcon={<FaSignOutAlt />}
        >
          Desconectar
        </Button>
      </HStack>
    );
  }

  return (
    <Button
      colorScheme="primary"
      onClick={() => open()}
      leftIcon={<FaWallet />}
    >
      Conectar Wallet
    </Button>
  );
};