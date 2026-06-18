import React, { useRef, useState, useEffect } from 'react';
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
import { FaCamera, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/api.service';

interface FacialVerificationProps {
  onVerificationSuccess: (token: string, nullifierHash: string) => void;
  onCancel: () => void;
  dni: string;
}

interface VerifyFaceResponse {
  status: string;
  token: string;
  nullifierHash: string;
  voter: {
    id: string;
    role: string;
  };
}

export const FacialVerification: React.FC<FacialVerificationProps> = ({ onVerificationSuccess, onCancel, dni }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Use ref instead of state to avoid re-renders
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('No se pudo acceder a la cámara. Por favor otorga permisos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureAndVerify = async () => {
    console.log('FacialVerification: captureAndVerify called');
    if (!videoRef.current) {
      console.log('FacialVerification: No video ref, returning');
      return;
    }

    setIsVerifying(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      console.log('FacialVerification: Calling /identity/verify-face with dni:', dni);
      const response = await apiService.post<VerifyFaceResponse>('/identity/verify-face', {
        facePhotoBase64: base64Image,
        dni: dni, // Pass dni to backend!
      });

      console.log('FacialVerification: API success, response:', response);
      
      toast({
        title: 'Verificación Facial Exitosa',
        description: 'Identidad validada. Tienes 5 minutos para votar.',
        status: 'success',
        duration: 4000,
      });

      console.log('FacialVerification: Stopping camera');
      stopCamera();
      
      console.log('FacialVerification: Calling onVerificationSuccess with token and nullifierHash');
      onVerificationSuccess(response.token, response.nullifierHash);
    } catch (e: any) {
      console.error('FacialVerification: Error:', e);
      toast({
        title: 'Error de verificación',
        description: e.response?.data?.message || e.message || 'El rostro no coincide con los registros.',
        status: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Use effect without dependencies that change!
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // Empty dependency array!

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
          h="320px" 
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
          
          {/* Face overlay guide */}
          {!error && !isVerifying && (
            <Box 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
              w="200px"
              h="250px"
              border="3px dashed"
              borderColor={primaryColor}
              borderRadius="full"
              opacity={0.7}
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
