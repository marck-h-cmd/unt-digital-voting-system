import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  useToast,
  RadioGroup,
  Stack,
  Radio,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUserShield } from 'react-icons/fa';
import { apiService } from '../../services/api.service';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { dni: string; carnet: string; role: string; token: string; nullifierHash: string }) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [dni, setDni] = useState('');
  const [carnet, setCarnet] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [validationMethod, setValidationMethod] = useState('DNI');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleValidate = async () => {
    let isValid = true;
    if (role === 'TEACHER' && !dni) isValid = false;
    if (role === 'STUDENT') {
      if (validationMethod === 'DNI' && !dni) isValid = false;
      if (validationMethod === 'CARNET' && !carnet) isValid = false;
    }

    if (!isValid) {
      toast({
        title: 'Faltan datos',
        description: 'Por favor completa todos los campos requeridos',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('ValidationModal: Sending request to /identity/validate-dni with:', { dni, carnet, role });
      const result = await apiService.identityPost<{ 
        status: string; 
        message: string; 
        token: string; 
        nullifierHash: string;
        voter: any;
      }>('/identity/validate-dni', {
        dni,
        carnet,
        role,
      });
      console.log('✅ ValidationModal: Backend Response:', result);
      console.log('result.token:', result.token);
      console.log('result.nullifierHash:', result.nullifierHash);
      
      const successData = { 
        dni, 
        carnet, 
        role,
        token: result.token,
        nullifierHash: result.nullifierHash
      };
      console.log('ValidationModal: Calling onSuccess with data:', successData);
      onSuccess(successData);
      console.log('ValidationModal: onSuccess called, now calling onClose');
      onClose();
    } catch (error: any) {
      console.error('❌ ValidationModal: Error:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: 'Error de validación',
        description: error.response?.data?.message || 'No se pudo verificar la identidad',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="2xl">
        <ModalHeader borderBottomWidth="1px" display="flex" alignItems="center" gap={2}>
          <FaUserShield color="var(--chakra-colors-unt-primary)" />
          Validación de Identidad
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <VStack spacing={4}>
            <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="sm">
              Ingresa tus datos institucionales para validar tu identidad.
            </Text>
            
            <FormControl isRequired>
              <FormLabel>Rol en la Universidad</FormLabel>
              <Select value={role} onChange={(e) => {
                  setRole(e.target.value);
                  setValidationMethod('DNI'); // Resetear método
                  setDni('');
                  setCarnet('');
              }}>
                <option value="STUDENT">Estudiante</option>
                <option value="TEACHER">Docente</option>
              </Select>
            </FormControl>

            {role === 'STUDENT' && (
              <FormControl>
                <FormLabel>Método de Validación</FormLabel>
                <RadioGroup value={validationMethod} onChange={setValidationMethod}>
                  <Stack direction="row" spacing={4}>
                    <Radio value="DNI">DNI</Radio>
                    <Radio value="CARNET">Carnet Universitario</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            )}

            {(role === 'TEACHER' || (role === 'STUDENT' && validationMethod === 'DNI')) && (
              <FormControl isRequired>
                <FormLabel>DNI</FormLabel>
                <Input 
                  type="text" 
                  maxLength={8}
                  placeholder="Ingresa tu DNI de 8 dígitos" 
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                />
              </FormControl>
            )}

            {role === 'STUDENT' && validationMethod === 'CARNET' && (
              <FormControl isRequired>
                <FormLabel>Carnet Universitario</FormLabel>
                <Input 
                  type="text" 
                  placeholder="Código de estudiante" 
                  value={carnet}
                  onChange={(e) => setCarnet(e.target.value)}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px">
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleValidate} isLoading={isLoading}>
            Validar Identidad
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
