import React, { useRef, useState, useCallback } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Spinner,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaCamera, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface FacialVerificationProps {
  onVerificationSuccess: (token: string, nullifierHash: string) => void;
  onCancel: () => void;
  dni: string;
}

export const FacialVerification: React.FC<FacialVerificationProps> = ({ onVerificationSuccess, onCancel, dni }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError('No se pudo acceder a la cámara. Por favor otorga permisos.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureAndVerify = async () => {
    if (!videoRef.current) return;

    setIsVerifying(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      // API call to our backend which talks to DeepFace
      // Mocked for the frontend integration flow right now
      await new Promise(r => setTimeout(r, 2000));
      
      const mockSessionToken = 'jwt-token-mock-' + Date.now();
      const mockNullifier = '0x' + Math.random().toString(16).substring(2, 66);

      toast({
        title: 'Verificación Facial Exitosa',
        description: 'Identidad validada. Tienes 5 minutos para votar.',
        status: 'success',
        duration: 4000,
      });

      stopCamera();
      onVerificationSuccess(mockSessionToken, mockNullifier);
    } catch (e: any) {
      toast({
        title: 'Error de verificación',
        description: e.message || 'El rostro no coincide con los registros.',
        status: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const primaryColor = useColorModeValue('unt.primary', 'unt.secondary');
  const videoBg = useColorModeValue('gray.100', 'gray.900');

  return (
    <Box maxW="lg" mx="auto" p={8} bg={bgColor} borderRadius="xl" boxShadow="sm" border="1px" borderColor={borderColor} textAlign="center">
      <VStack spacing={6}>
        <Heading size="md" color={primaryColor}>Verificación Facial</Heading>
        <Text color={textColor}>
          Por favor mira directamente a la cámara y asegúrate de tener buena iluminación.
        </Text>

        <Box 
          w="full" 
          h="300px" 
          bg={videoBg} 
          borderRadius="xl" 
          overflow="hidden" 
          position="relative"
          border="2px solid"
          borderColor={error ? "red.400" : borderColor}
        >
          {error ? (
            <VStack justify="center" h="full" color="red.500">
              <Icon as={FaTimesCircle} boxSize={8} />
              <Text px={4}>{error}</Text>
            </VStack>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
          
          {isVerifying && (
            <Box position="absolute" top={0} left={0} w="full" h="full" bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center">
              <VStack color="white">
                <Spinner size="xl" />
                <Text fontWeight="bold">Analizando biométricos...</Text>
              </VStack>
            </Box>
          )}
        </Box>

        <Button 
          w="full" 
          variant="primary" 
          size="lg" 
          leftIcon={<FaCamera />}
          onClick={captureAndVerify}
          isLoading={isVerifying}
          isDisabled={!!error}
        >
          Capturar y Verificar
        </Button>
        <Button variant="ghost" onClick={() => { stopCamera(); onCancel(); }} isDisabled={isVerifying}>
          Cancelar
        </Button>
      </VStack>
    </Box>
  );
};
