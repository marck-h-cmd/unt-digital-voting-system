// frontend/src/components/common/Footer.tsx
import React from 'react';
import { Box, HStack, Text, VStack, Link, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaHeart, FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="footer"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      px={4}
      py={6}
      mt="auto"
    >
      <HStack
        maxW="7xl"
        mx="auto"
        justify="space-between"
        wrap="wrap"
        spacing={4}
      >
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" color="gray.600">
            🗳️ UNT Vota - Sistema de Votación Descentralizada
          </Text>
          <Text fontSize="xs" color="gray.500">
            Universidad Nacional de Trujillo 2024
          </Text>
        </VStack>

        <HStack spacing={4}>
          <Link
            href="https://github.com/unt-voting"
            isExternal
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          >
            <Icon as={FaGithub} boxSize={5} color="gray.500" />
          </Link>
          <Link
            href="https://twitter.com/unt_voting"
            isExternal
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          >
            <Icon as={FaTwitter} boxSize={5} color="gray.500" />
          </Link>
          <Link
            href="https://linkedin.com/company/unt-voting"
            isExternal
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          >
            <Icon as={FaLinkedin} boxSize={5} color="gray.500" />
          </Link>
        </HStack>

        <HStack spacing={1}>
          <Text fontSize="xs" color="gray.500">
            Hecho con
          </Text>
          <Icon as={FaHeart} boxSize={3} color="red.500" />
          <Text fontSize="xs" color="gray.500">
            para la UNT
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};