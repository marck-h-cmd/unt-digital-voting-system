// frontend/src/components/common/Navbar.tsx
import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Button,
  useColorMode,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Badge,
  Spacer,
  Link,
  Divider,
} from '@chakra-ui/react';
import { useAccount, useDisconnect } from 'wagmi';
import { FaMoon, FaSun, FaUser, FaChartBar, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const navItems = [
    { path: '/', label: 'Votar', icon: FaUser },
    { path: '/dashboard', label: 'Dashboard', icon: FaChartBar },
    { path: '/audit', label: 'Auditoría', icon: FaShieldAlt },
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
        <Heading size="md" color="unt.primary" whiteSpace="nowrap">
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
              bg={location.pathname === item.path ? 'unt.primary' : 'transparent'}
              color={location.pathname === item.path ? 'white' : 'gray.600'}
              _hover={{
                bg: location.pathname === item.path ? 'unt.dark' : 'gray.100',
                transform: 'scale(1.02)',
              }}
              transition="all 0.2s"
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

        {isConnected ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rounded="full"
              padding={0}
              _hover={{ bg: 'transparent' }}
            >
              <HStack spacing={2}>
                <Avatar size="sm" bg="unt.primary" icon={<FaUser color="white" />} />
                <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                  <Text fontSize="sm" fontWeight="medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">
                    Conectado
                  </Badge>
                </VStack>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUser />}>Mi Perfil</MenuItem>
              <MenuItem icon={<FaShieldAlt />}>Verificaciones</MenuItem>
              <Divider />
              <MenuItem icon={<FaSignOutAlt />} onClick={() => disconnect()}>
                Desconectar
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button
            colorScheme="primary"
            size="sm"
            onClick={() => window.dispatchEvent(new Event('web3modal-open'))}
          >
            Conectar Wallet
          </Button>
        )}
      </HStack>
    </Box>
  );
};