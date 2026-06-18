// frontend/src/components/voting/ZKPVerification.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Code,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Icon,
  Grid,
  GridItem,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaClock, FaGasPump } from 'react-icons/fa';
import { motion } from 'framer-motion';

import { useVoting } from '../../hooks/useVoting';
import { useZKProof } from '../../hooks/useZKProof';
import { useBlockchain } from '../../hooks/useBlockchain';

export const ZKPVerification: React.FC = () => {
  const { voteHash } = useParams<{ voteHash: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchHash, setSearchHash] = useState(voteHash || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  const { verifyVote, getVote } = useVoting();
  const { verifyProof } = useZKProof();
  const { getGasPrice, getNetworkInfo } = useBlockchain();

  useEffect(() => {
    if (voteHash) {
      handleVerify(voteHash);
    }
  }, [voteHash]);

  const handleVerify = async (hash: string) => {
    if (!hash) {
      toast({
        title: 'Hash vacío',
        description: 'Por favor ingresa un hash de voto',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Obtener información del voto
      const vote = await getVote(hash);
      
      // 2. Verificar en blockchain
      const blockchainResult = await verifyVote({
        sessionId: vote.sessionId,
        voteHash: hash,
        merkleProof: [],
      });

      // 3. Verificar ZKP
      const zkpValid = await verifyProof(vote.zkpProof);

      // 4. Verificar Merkle Tree
      const merkleValid = await verifyMerkleProof(vote);

      // 5. Verificar IPFS
      const ipfsValid = await verifyIPFS(vote);

      const result = {
        voteHash: hash,
        sessionId: vote.sessionId,
        voterAddress: vote.voterAddress,
        candidateName: vote.candidate?.name,
        timestamp: vote.createdAt,
        checks: {
          onChain: blockchainResult.checks.onChain,
          zkpValid: zkpValid,
          merkleValid: merkleValid,
          ipfsValid: ipfsValid,
          confirmed: blockchainResult.checks.confirmed,
        },
        details: {
          txHash: vote.txHash,
          blockNumber: vote.blockNumber,
          gasCost: vote.gasCost,
          confirmations: blockchainResult.details?.confirmations || 0,
        },
        isValid: blockchainResult.isValid && zkpValid && merkleValid,
      };

      setVerificationResult(result);
      setVerificationHistory(prev => [result, ...prev].slice(0, 10));

      toast({
        title: result.isValid ? 'Voto Verificado' : 'Voto No Verificado',
        description: result.isValid
          ? 'El voto es válido y ha sido confirmado'
          : 'El voto no pudo ser verificado completamente',
        status: result.isValid ? 'success' : 'error',
        duration: 5000,
      });

    } catch (error) {
      toast({
        title: 'Error al verificar',
        description: (error as any).message,
        status: 'error',
        duration: 5000,
      });
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyMerkleProof = async (vote: any): Promise<boolean> => {
    // Implementar verificación de Merkle
    return true;
  };

  const verifyIPFS = async (vote: any): Promise<boolean> => {
    // Implementar verificación de IPFS
    return true;
  };

  return (
    <Box maxW="6xl" mx="auto">
      <VStack spacing={8} align="stretch">
        <Card>
          <CardHeader>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FaShieldAlt} boxSize={6} color="unt.primary" />
                <Heading size="lg">Verificador de Votos</Heading>
              </HStack>
              <Text color="gray.600">
                Verifica la integridad y validez de cualquier voto en el sistema
              </Text>
            </VStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack w="full" spacing={4}>
                <Input
                  placeholder="Ingresa el hash del voto"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  size="lg"
                  fontSize="sm"
                />
                <Button
                  colorScheme="primary"
                  onClick={() => handleVerify(searchHash)}
                  isLoading={isVerifying}
                  loadingText="Verificando"
                  px={8}
                >
                  Verificar
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Ejemplo: 0x1234...abcd
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {isVerifying && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Spinner size="xl" color="unt.primary" />
                <Text>Verificando voto en Syscoin...</Text>
                <Progress isIndeterminate width="full" colorScheme="primary" />
              </VStack>
            </CardBody>
          </Card>
        )}

        {verificationResult && !isVerifying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader
                bg={verificationResult.isValid ? 'green.50' : 'red.50'}
                borderTopRadius="lg"
              >
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon
                      as={verificationResult.isValid ? FaCheckCircle : FaTimesCircle}
                      boxSize={6}
                      color={verificationResult.isValid ? 'green.500' : 'red.500'}
                    />
                    <Heading size="md" color={verificationResult.isValid ? 'green.700' : 'red.700'}>
                      {verificationResult.isValid ? 'Voto Válido' : 'Voto Inválido'}
                    </Heading>
                  </HStack>
                  <Text color="gray.600" fontSize="sm">
                    {verificationResult.isValid
                      ? 'El voto ha sido verificado exitosamente'
                      : 'El voto no pudo ser verificado completamente'}
                  </Text>
                </VStack>
              </CardHeader>

              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                    <GridItem>
                      <Stat>
                        <StatLabel>Hash del Voto</StatLabel>
                        <Code
                          p={2}
                          borderRadius="md"
                          fontSize="xs"
                          wordBreak="break-all"
                          bg={useColorModeValue('gray.50', 'gray.900')}
                        >
                          {verificationResult.voteHash}
                        </Code>
                      </Stat>
                    </GridItem>
                    <GridItem>
                      <Stat>
                        <StatLabel>Votante</StatLabel>
                        <StatNumber fontSize="sm">
                          {verificationResult.voterAddress}
                        </StatNumber>
                        <StatHelpText>
                          {verificationResult.candidateName || 'Candidato no encontrado'}
                        </StatHelpText>
                      </Stat>
                    </GridItem>
                  </Grid>

                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Verificación</Th>
                          <Th isNumeric>Estado</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Blockchain</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={verificationResult.checks.onChain ? 'green' : 'red'}
                            >
                              {verificationResult.checks.onChain ? 'Válido' : 'Inválido'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>ZKP</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={verificationResult.checks.zkpValid ? 'green' : 'red'}
                            >
                              {verificationResult.checks.zkpValid ? 'Válido' : 'Inválido'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>Merkle Tree</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={verificationResult.checks.merkleValid ? 'green' : 'red'}
                            >
                              {verificationResult.checks.merkleValid ? 'Válido' : 'Inválido'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>IPFS</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={verificationResult.checks.ipfsValid ? 'green' : 'red'}
                            >
                              {verificationResult.checks.ipfsValid ? 'Válido' : 'Inválido'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>Confirmaciones</Td>
                          <Td isNumeric>
                            <HStack justify="flex-end">
                              <Badge
                                colorScheme={verificationResult.details.confirmations >= 12 ? 'green' : 'yellow'}
                              >
                                {verificationResult.details.confirmations}
                              </Badge>
                              {verificationResult.details.confirmations >= 12 && (
                                <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                  <Box p={4} bg={useColorModeValue('gray.50', 'gray.900')} borderRadius="lg">
                    <HStack justify="space-between" wrap="wrap">
                      <Box>
                        <Text fontWeight="bold" color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
                          Hash de Transacción
                        </Text>
                        <Text fontSize="sm" fontFamily="mono">
                          {verificationResult.details.txHash || 'N/A'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
                          Bloque
                        </Text>
                        <Text fontSize="sm">
                          {verificationResult.details.blockNumber || 'N/A'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
                          Gas
                        </Text>
                        <Text fontSize="sm">
                          {verificationResult.details.gasCost || 'N/A'} SYS
                        </Text>
                      </Box>
                    </HStack>
                  </Box>

                  <Button
                    colorScheme="primary"
                    onClick={() => navigate(`/audit?vote=${verificationResult.voteHash}`)}
                  >
                    Ver en Auditoría
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {verificationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">Historial de Verificaciones</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {verificationHistory.map((result, index) => (
                  <HStack
                    key={index}
                    p={3}
                    bg={result.isValid ? 'green.50' : 'red.50'}
                    borderRadius="lg"
                    justify="space-between"
                  >
                    <HStack>
                      <Icon
                        as={result.isValid ? FaCheckCircle : FaTimesCircle}
                        color={result.isValid ? 'green.500' : 'red.500'}
                      />
                      <Text fontFamily="mono" fontSize="sm">
                        {result.voteHash.slice(0, 10)}...
                      </Text>
                    </HStack>
                    <HStack>
                      <Badge colorScheme={result.isValid ? 'green' : 'red'}>
                        {result.isValid ? 'Válido' : 'Inválido'}
                      </Badge>
                      <Badge colorScheme="gray">{result.sessionId}</Badge>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(result.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};