// frontend/src/components/common/LoadingSpinner.tsx
import React from 'react';
import { Box, Spinner, VStack, Text, useColorModeValue } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'xl',
  text = 'Cargando...',
  fullScreen = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');

  const content = (
    <VStack spacing={4}>
      <Spinner
        size={size}
        thickness="4px"
        color="unt.primary"
        speed="0.65s"
        emptyColor="gray.200"
      />
      {text && <Text color="gray.600">{text}</Text>}
    </VStack>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return <Box textAlign="center" py={10}>{content}</Box>;
};