import React, { useState, useRef } from 'react';
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
  Box,
  Image
} from '@chakra-ui/react';
import { FaUserShield, FaUpload } from 'react-icons/fa';
import { apiService } from '../../services/api.service';

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
  const [dniPhoto, setDniPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDniPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValidate = async () => {
    let isValid = true;
    if (role === 'TEACHER' && !dni) isValid = false;
    if (role === 'STUDENT') {
      if (validationMethod === 'DNI' && !dni) isValid = false;
      if (validationMethod === 'CARNET' && !carnet) isValid = false;
    }
    if (!dniPhoto) isValid = false;

    if (!isValid) {
      toast({
        title: 'Faltan datos',
        description: 'Por favor completa todos los campos requeridos y sube tu foto de DNI',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiService.post<{ status: string; message: string; voterId: string }>('/identity/validate-dni', {
        dni,
        dniPhotoBase64: dniPhoto,
        role,
      });
      
      onSuccess({ dni, carnet, role });
      onClose();
    } catch (error: any) {
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
              Ingresa tus datos institucionales y sube tu foto de DNI para proceder con la verificación facial.
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

            <FormControl isRequired>
              <FormLabel>Foto de DNI</FormLabel>
              <Box 
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="lg"
                p={4}
                textAlign="center"
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {dniPhoto ? (
                  <Image src={dniPhoto} alt="DNI" maxH="200px" mx="auto" />
                ) : (
                  <VStack>
                    <FaUpload size="24px" color="gray.400" />
                    <Text color="gray.500">Haz clic para subir tu foto de DNI</Text>
                  </VStack>
                )}
              </Box>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                display="none"
              />
            </FormControl>
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
