import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  Card,
  CardBody,
  useColorModeValue,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api.service';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Obtener la página a la que quería ir, o por defecto al admin
  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simular retraso de red para dar feedback de carga
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Validar credenciales mock (admin / admin123)
    if (username === 'admin' && password === 'admin123') {
      apiService.setAuthToken('mock_admin_jwt_token_unt_voting_2026');
      toast.success('Sesión iniciada exitosamente como Administrador');
      setIsLoading(false);
      navigate(from, { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos');
      toast.error('Error de autenticación');
      setIsLoading(false);
    }
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      minH="80vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Card
        w="full"
        maxW="md"
        bg={cardBg}
        border="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        boxShadow="2xl"
        overflow="hidden"
      >
        <CardBody p={{ base: 6, md: 8 }}>
          <VStack spacing={6} align="stretch" as="form" onSubmit={handleLogin}>
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="unt.primary">
                🔑 Acceso Admin
              </Heading>
              <Text fontSize="sm" color={textColor}>
                Ingresa las credenciales administrativas de la UNT
              </Text>
            </VStack>

            <FormControl isInvalid={!!error}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Usuario</FormLabel>
                  <InputGroup>
                    <Input
                      type="text"
                      placeholder="Ej. admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      borderRadius="lg"
                      focusBorderColor="unt.primary"
                    />
                    <InputRightElement color="gray.400" mr={1}>
                      <FaUser size={14} />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Contraseña</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      borderRadius="lg"
                      focusBorderColor="unt.primary"
                    />
                    <InputRightElement width="3rem" mr={1}>
                      <IconButton
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        variant="ghost"
                        color="gray.400"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </VStack>
              {error && <FormErrorMessage mt={3}>{error}</FormErrorMessage>}
            </FormControl>

            <Button
              type="submit"
              variant="primary"
              w="full"
              isLoading={isLoading}
              loadingText="Iniciando sesión..."
              size="lg"
              mt={2}
            >
              Iniciar Sesión
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Login;
