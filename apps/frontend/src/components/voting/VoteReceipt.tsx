// frontend/src/components/voting/VoteReceipt.tsx
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Code,
  Badge,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Grid,
  GridItem,
  Tooltip,
  useClipboard,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCheckCircle, FaCopy, FaDownload, FaShare, FaQrcode } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';

import { useBlockchain } from '../../hooks/useBlockchain';

interface VoteReceiptProps {
  voteHash: string;
  sessionId: number;
  candidateName?: string;
  onReset: () => void;
}

export const VoteReceipt: React.FC<VoteReceiptProps> = ({
  voteHash,
  sessionId,
  candidateName,
  onReset,
}) => {
  const { getTransactionReceipt, getTransactionConfirmations } = useBlockchain();
  const { hasCopied, onCopy } = useClipboard(voteHash);
  const toast = useToast();
  const [confirmations, setConfirmations] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDownload = () => {
    const receipt = {
      voteHash,
      sessionId,
      candidateName,
      timestamp: new Date().toISOString(),
      network: 'Syscoin Testnet',
      explorerUrl: `https://sysscan.io/tx/${voteHash}`,
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${voteHash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Comprobante descargado',
      description: 'El comprobante ha sido descargado exitosamente',
      status: 'success',
      duration: 3000,
    });
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const receipt = await getTransactionReceipt(voteHash);
      const confirmations = await getTransactionConfirmations(voteHash);
      setConfirmations(confirmations);

      if (receipt && receipt.status === 1) {
        toast({
          title: 'Voto verificado',
          description: `Transacción confirmada con ${confirmations} confirmaciones`,
          status: 'success',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Voto pendiente',
          description: 'La transacción aún no ha sido confirmada',
          status: 'warning',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error al verificar',
        description: 'No se pudo verificar la transacción',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('green.50', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('green.700', 'green.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        border="1px solid"
        borderColor={borderColor}
        borderRadius="2xl"
        boxShadow="sm"
        bg={bgColor}
      >
        <CardHeader bg={headerBg} borderTopRadius="2xl">
          <VStack spacing={2}>
            <HStack>
              <Icon as={FaCheckCircle} boxSize={8} color="green.500" />
              <Heading size="lg" color={headingColor}>
                ¡Voto Emitido con Éxito!
              </Heading>
            </HStack>
            <Text color={textColor}>
              Tu voto ha sido registrado en la blockchain de Syscoin
            </Text>
          </VStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            <Alert status="success" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Transacción Confirmada</AlertTitle>
                <AlertDescription>
                  Tu voto ha sido confirmado en la red Syscoin NEVM
                </AlertDescription>
              </Box>
            </Alert>

            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
              <GridItem>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color={textColor} fontSize="sm">
                      Hash del Voto
                    </Text>
                    <Code
                      p={3}
                      borderRadius="md"
                      fontSize="xs"
                      wordBreak="break-all"
                      bg={codeBg}
                    >
                      {voteHash}
                    </Code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onCopy}
                      leftIcon={<FaCopy />}
                      mt={2}
                    >
                      {hasCopied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </Box>

                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="bold" color={textColor} fontSize="sm">
                        Sesión
                      </Text>
                      <Text>#{sessionId}</Text>
                    </Box>
                    {candidateName && (
                      <Box>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          Candidato
                        </Text>
                        <Text>{candidateName}</Text>
                      </Box>
                    )}
                  </HStack>

                  <Box>
                    <Text fontWeight="bold" color={textColor} fontSize="sm">
                      Red
                    </Text>
                    <Badge colorScheme="purple">Syscoin Testnet</Badge>
                  </Box>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack align="center" spacing={4}>
                  <Box
                    p={4}
                    bg="white"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <QRCode
                      value={JSON.stringify({
                        voteHash,
                        sessionId,
                        timestamp: new Date().toISOString(),
                        network: 'Syscoin',
                        explorerUrl: `https://sysscan.io/tx/${voteHash}`,
                      })}
                      size={150}
                      level="H"
                    />
                  </Box>
                  <Text fontSize="sm" color="gray.500">
                    Escanea para verificar tu voto
                  </Text>
                </VStack>
              </GridItem>
            </Grid>

            <Divider />

            <HStack justify="space-between" wrap="wrap" spacing={4}>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FaDownload />}
                  onClick={handleDownload}
                >
                  Descargar Comprobante
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FaShare />}
                >
                  Compartir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FaQrcode />}
                  isLoading={isVerifying}
                  onClick={handleVerify}
                >
                  Verificar Ahora
                </Button>
              </HStack>

              <Button
                variant="primary"
                onClick={onReset}
              >
                Volver a Votar
              </Button>
            </HStack>

            {confirmations > 0 && (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle>Confirmaciones</AlertTitle>
                  <AlertDescription>
                    {confirmations} confirmaciones en la red Syscoin
                    {confirmations >= 12 && ' ✅' }
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </motion.div>
  );
};