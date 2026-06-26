// frontend/src/components/common/Navbar.tsx
import React from 'react';
import {
  Box,
  HStack,
  Heading,
  Button,
  useColorMode,
  useColorModeValue,
  IconButton,
  Text,
  Spacer,
  Link,
} from '@chakra-ui/react';
import { FaMoon, FaSun, FaUser, FaChartBar, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { WalletConnector } from './WalletConnector';

export const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isAdmin = !!localStorage.getItem('auth_token');

  const navItems = [
    { path: '/', label: 'Votar', icon: FaUser },
    ...(isAdmin ? [
      { path: '/dashboard', label: 'Dashboard', icon: FaChartBar },
      { path: '/audit', label: 'Auditoría', icon: FaShieldAlt },
      { path: '/admin', label: 'Admin', icon: FaShieldAlt },
    ] : []),
  ];

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <HStack maxW="7xl" mx="auto" spacing={4}>
        <Heading size="md" color={useColorModeValue("unt.primary", "unt.secondary")} whiteSpace="nowrap">
          🗳️ UNT Vota
        </Heading>

        <Spacer />

        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              as={RouterLink}
              to={item.path}
              p={2}
              borderRadius="lg"
              fontWeight={location.pathname === item.path ? 'bold' : 'normal'}
              bg={location.pathname === item.path ? useColorModeValue('unt.primary', 'unt.secondary') : 'transparent'}
              color={location.pathname === item.path ? useColorModeValue('white', 'gray.900') : useColorModeValue('gray.600', 'gray.300')}
              _hover={{
                bg: location.pathname === item.path ? useColorModeValue('unt.dark', 'yellow.300') : useColorModeValue('gray.100', 'whiteAlpha.200'),
              }}
              transition="background-color 0.2s"
            >
              <HStack spacing={1}>
                <item.icon size={16} />
                <Text>{item.label}</Text>
              </HStack>
            </Link>
          ))}
        </HStack>

        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
          onClick={toggleColorMode}
          variant="ghost"
          size="sm"
        />

        <WalletConnector />
        {isAdmin ? (
          <Button
            leftIcon={<FaSignOutAlt />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/';
            }}
          >
            Salir Admin
          </Button>
        ) : (
          location.pathname !== '/login' && (
            <Button
              as={RouterLink}
              to="/login"
              colorScheme="yellow"
              variant="outline"
              size="sm"
            >
              Acceso Admin
            </Button>
          )
        )}
      </HStack>
    </Box>
  );
};