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
  useColorModeValue
} from '@chakra-ui/react';
import { FaUserShield } from 'react-icons/fa';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { dni: string; carnet: string; role: string }) => void;
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
      // Mock validation call - in a real app this would ping the backend ValidationModule
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      onSuccess({ dni, carnet, role });
      onClose();
    } catch (error) {
      toast({
        title: 'Error de validación',
        description: 'No se pudo verificar la identidad',
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
              Ingresa tus datos institucionales para proceder con la verificación facial.
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
            Siguiente Paso
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
