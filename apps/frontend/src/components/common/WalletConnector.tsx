// frontend/src/components/common/WalletConnector.tsx
import React from 'react';
import { Button, useToast, HStack, Text, Icon } from '@chakra-ui/react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { FaWallet, FaSignOutAlt } from 'react-icons/fa';

export const WalletConnector: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const toast = useToast();

  const handleConnect = async () => {
    try {
      await connect({ connector: connectors[0] });
    } catch (error) {
      toast({
        title: 'Error al conectar',
        description: (error as any).message,
        status: 'error',
        duration: 3000,
      });
    }
  };

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
      onClick={handleConnect}
      leftIcon={<FaWallet />}
    >
      Conectar Wallet
    </Button>
  );
};