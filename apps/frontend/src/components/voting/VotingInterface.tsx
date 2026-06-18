// frontend/src/components/voting/VotingInterface.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Grid,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Progress,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Tooltip,
  Collapse,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  FormControl,
  FormLabel,
  Switch,
} from '@chakra-ui/react';
import { useAccount, useSignMessage, useBalance, useNetwork, useSwitchNetwork } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { FaShieldAlt, FaVoteYea, FaUserCheck, FaClock, FaGasPump } from 'react-icons/fa';

import { CandidateCard } from './CandidateCard';
import { VoteReceipt } from './VoteReceipt';
import { ValidationModal } from './ValidationModal';
import { FacialVerification } from './FacialVerification';
import { SessionTimer } from './SessionTimer';
import { useVoting } from '../../hooks/useVoting';
import { useZKProof } from '../../hooks/useZKProof';
import { useBlockchain } from '../../hooks/useBlockchain';

interface Candidate {
  id: string;
  name: string;
  party: string;
  photoHash: string;
  description: string;
  voteCount: number;
  active: boolean;
}

interface VotingSession {
  id: number;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  active: boolean;
  finalized: boolean;
  totalVotes: number;
  validVotes: number;
  noiseVotes: number;
  merkleRoot?: string;
}

export const VotingInterface: React.FC = () => {
  // Solo se usa para mostrar info de red, ya no restringe el acceso al votante
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const { castVote, getSession, getCandidates, getSessionStats } = useVoting();
  const { generateProof, verifyProof } = useZKProof();
  const { getGasPrice, getNetworkInfo } = useBlockchain();
  const toast_ = useToast();
  const queryClient = useQueryClient();

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [votingStep, setVotingStep] = useState<'select' | 'verify' | 'voting' | 'receipt'>('select');
  const [voteHash, setVoteHash] = useState<string>('');
  const [sessionId, setSessionId] = useState<number>(1);
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [zkpType, setZkpType] = useState<'groth16' | 'pedersen'>('groth16');
  
  // Nuevos estados para identidad
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showFacial, setShowFacial] = useState(false);
  const [voterData, setVoterData] = useState<any>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Obtener información de la sesión
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    refetchInterval: 30000,
  });

  // Obtener candidatos
  const { data: candidates, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery({
    queryKey: ['candidates', sessionId],
    queryFn: () => getCandidates(sessionId),
  });

  // Obtener estadísticas
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats', sessionId],
    queryFn: () => getSessionStats(sessionId),
    refetchInterval: 10000,
  });

  // Obtener gas price
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const price = await getGasPrice();
        setGasPrice(price);
      } catch (error) {
        console.error('Error fetching gas price:', error);
      }
    };
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 60000);
    return () => clearInterval(interval);
  }, [getGasPrice]);

  // Verificar red correcta (solo aplica a admins con wallet conectada)
  useEffect(() => {
    if (address && chain?.id !== 5700) {
      // Opcional: mostrar advertencia solo si es admin
    }
  }, [chain, address]);

  const isVotingActive = useMemo(() => {
    if (!session) return false;
    return (
      session.active &&
      !session.finalized &&
      Date.now() >= session.startTime * 1000 &&
      Date.now() <= session.endTime * 1000
    );
  }, [session]);

  const timeRemaining = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, session.endTime * 1000 - Date.now());
  }, [session]);

  const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const voteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await castVote(data);
    },
    onSuccess: (data) => {
      setVoteHash(data.voteHash);
      setVotingStep('receipt');
      toast.success('¡Voto emitido con éxito!');
      queryClient.invalidateQueries({ queryKey: ['stats', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
    onError: (error: any) => {
      toast.error(`Error al votar: ${error.message}`);
      setVotingStep('select');
    },
  });

  const handleVote = useCallback(async () => {
    if (!selectedCandidate || !sessionToken || !nullifierHash || !session) return;

    try {
      setVotingStep('verify');
      const loadingToast = toast.loading('Preparando voto...');

      // 1. Generar ZKP
      toast.loading('Generando prueba ZKP...', { id: loadingToast });
      const zkp = await generateProof({
        voterId: nullifierHash,
        candidateId: selectedCandidate,
        sessionId: sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        zkpType,
      });

      toast.loading('ZKP generada, firmando voto...', { id: loadingToast });

      // 2. Preparar datos del voto
      const voteData = {
        sessionId,
        candidateId: selectedCandidate,
        timestamp: Math.floor(Date.now() / 1000),
        voterId: nullifierHash,
        zkpType,
      };

      // 3. Generar hash del voto
      const voteHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(voteData))
      );

      // 4. Se elimina la firma con wallet, la validación se hace vía JWT en el backend
      const signature = 'jwt-auth';

      toast.loading('Enviando voto a blockchain...', { id: loadingToast });

      // 5. Enviar voto
      setVotingStep('voting');
      await voteMutation.mutateAsync({
        sessionId,
        voteHash,
        merkleProof: [],
        zkp,
        sessionToken,
        nullifierHash,
        candidateId: selectedCandidate,
        encryptedVote: JSON.stringify(voteData),
      });

      toast.success('¡Voto emitido con éxito!', { id: loadingToast });

    } catch (error: any) {
      console.error('Error en voto:', error);
      setVotingStep('select');
    }
  }, [selectedCandidate, sessionToken, nullifierHash, session, sessionId, generateProof, voteMutation, zkpType]);

  // Si está en el proceso de verificación facial
  if (showFacial) {
    return (
      <Box maxW="6xl" mx="auto" py={10}>
        <FacialVerification 
          dni={voterData?.dni || ''}
          onVerificationSuccess={(token, nullifier) => {
            setSessionToken(token);
            setNullifierHash(nullifier);
            setShowFacial(false);
          }}
          onCancel={() => setShowFacial(false)}
        />
      </Box>
    );
  }

  // Si no ha iniciado sesión
  if (!sessionToken) {
    return (
      <Box
        maxW="6xl"
        mx="auto"
        textAlign="center"
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderTop="8px solid"
        borderTopColor={useColorModeValue("unt.secondary", "unt.primary")}
        borderRadius="2xl"
        boxShadow="md"
        px={10}
        py={16}
      >
        <VStack spacing={8}>
          <Icon as={FaVoteYea} boxSize={16} color="unt.primary" />
          <Heading size="xl" color={useColorModeValue('unt.primary', 'unt.secondary')}>
            Elecciones Universitarias UNT 2024
          </Heading>
          <Text fontSize="lg" color={textColor} maxW="2xl">
            Participa en las elecciones estudiantiles con un sistema de votación
            descentralizado, seguro y verificable.
          </Text>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowValidation(true)}
            leftIcon={<FaUserCheck />}
            px={8}
            py={7}
            fontSize="lg"
            borderRadius="xl"
          >
            Validar Identidad y Votar
          </Button>
          <Text fontSize="sm" color="gray.500">
            Requiere cámara web, DNI y Carnet Universitario
          </Text>
        </VStack>
        <ValidationModal 
          isOpen={showValidation} 
          onClose={() => setShowValidation(false)} 
          onSuccess={(data) => {
            setVoterData(data);
            setShowValidation(false);
            setShowFacial(true);
          }}
        />
      </Box>
    );
  }

  if (sessionLoading || candidatesLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" thickness="4px" color="unt.primary" />
        <Text mt={4} fontSize="lg">
          Cargando información de la votación...
        </Text>
      </Box>
    );
  }

  return (
    <Box maxW="7xl" mx="auto">
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box
          bg={bgColor}
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor={borderColor}
          borderTop="4px solid"
          borderTopColor={useColorModeValue("unt.secondary", "unt.primary")}
          p={8}
        >
          <VStack align="stretch" spacing={6}>
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={2}>
                <Heading size="xl" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                  {session?.name || 'Elecciones UNT 2024'}
                </Heading>
                <Text color={textColor} fontSize="lg">{session?.description}</Text>
              </VStack>
              <HStack spacing={2}>
                <Badge
                  colorScheme={isVotingActive ? 'green' : 'red'}
                  fontSize="md"
                  p={2}
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={isVotingActive ? 'green.500' : 'red.500'}
                    animation={isVotingActive ? 'pulse 2s infinite' : 'none'}
                  />
                  {isVotingActive ? 'Votación Activa' : 'Votación Cerrada'}
                </Badge>
                {isVotingActive && (
                  <>
                    <Tooltip label="Tiempo restante">
                      <Badge colorScheme="blue" fontSize="md" p={2} borderRadius="md">
                        <HStack spacing={1}>
                          <Icon as={FaClock} />
                          <Text>
                            {daysRemaining > 0 && `${daysRemaining}d `}
                            {hoursRemaining > 0 && `${hoursRemaining}h `}
                            {minutesRemaining > 0 && `${minutesRemaining}m`}
                          </Text>
                        </HStack>
                      </Badge>
                    </Tooltip>
                    <Tooltip label="Precio del gas en Syscoin">
                      <Badge colorScheme="gray" fontSize="md" p={2} borderRadius="md">
                        <HStack spacing={1}>
                          <Icon as={FaGasPump} />
                          <Text>{gasPrice} Gwei</Text>
                        </HStack>
                      </Badge>
                    </Tooltip>
                  </>
                )}
              </HStack>
            </HStack>

            {/* Stats */}
            <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
              <Stat>
                <StatLabel>Total Votos</StatLabel>
                <StatNumber>{stats?.totalVotes || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {stats?.validVotes || 0} válidos
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Participación</StatLabel>
                <StatNumber>{stats?.participationRate?.toFixed(1) || 0}%</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {stats?.noiseVotes || 0} votos de ruido
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Votante Seguro</StatLabel>
                <StatNumber fontSize="sm">
                  DNI: {voterData?.dni ? `***${voterData.dni.slice(-3)}` : 'Validado'}
                </StatNumber>
                <StatHelpText>
                  Token de Sesión Activo
                </StatHelpText>
              </Stat>
            </Grid>
            {sessionToken && (
              <Box mt={4}>
                <SessionTimer onExpire={() => {
                  setSessionToken(null);
                  toast.error('Tu sesión segura ha expirado. Por favor, vuelve a validar tu identidad.');
                }} />
              </Box>
            )}
          </VStack>
        </Box>

        {/* Advanced Settings */}
        <Card borderTop="4px solid" borderTopColor={borderColor}>
          <CardHeader py={4}>
            <HStack justify="space-between">
              <Heading size="md" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                Opciones Avanzadas
              </Heading>
              <Button size="sm" variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Ocultar' : 'Mostrar'}
              </Button>
            </HStack>
          </CardHeader>
          <Collapse in={showAdvanced}>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={4}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Tipo de ZKP</FormLabel>
                  <HStack spacing={4}>
                    <Button
                      size="sm"
                      colorScheme={zkpType === 'groth16' ? 'primary' : 'gray'}
                      onClick={() => setZkpType('groth16')}
                    >
                      Groth16
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={zkpType === 'pedersen' ? 'primary' : 'gray'}
                      onClick={() => setZkpType('pedersen')}
                    >
                      Pedersen
                    </Button>
                  </HStack>
                </FormControl>
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Groth16</AlertTitle>
                    <AlertDescription>
                      Pruebas más rápidas de verificar, ideales para blockchain
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Collapse>
        </Card>

        {/* Candidates Selection */}
        {votingStep === 'select' && isVotingActive && (
          <Box pt={4}>
            <VStack align="center" mb={8} spacing={2} textAlign="center">
              <Heading size="xl" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                Selecciona tu candidato
              </Heading>
              <Text color={textColor} fontSize="lg" maxW="2xl">
                Tu voto es secreto y verificable. Selecciona al candidato de tu preferencia para continuar con la firma criptográfica local.
              </Text>
            </VStack>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={8} mb={8}>
              {candidates?.map((candidate: Candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidate === candidate.id}
                  onSelect={() => setSelectedCandidate(candidate.id)}
                  disabled={!isVotingActive}
                />
              ))}
            </Grid>

            {selectedCandidate && isVotingActive && (
              <Box textAlign="center" mt={10} p={6} bg={cardBg} borderRadius="xl" border="1px" borderColor={borderColor}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onOpen}
                  leftIcon={<FaShieldAlt />}
                  px={12}
                  py={6}
                  borderRadius="md"
                  fontSize="lg"
                >
                  Confirmar Voto para{' '}
                  {candidates?.find((c: Candidate) => c.id === selectedCandidate)?.name}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {votingStep === 'verify' && (
          <Box
            textAlign="center"
            py={16}
            bg={bgColor}
            border="1px"
            borderColor={borderColor}
            borderTop="6px solid"
            borderTopColor="unt.secondary"
            borderRadius="xl"
            boxShadow="md"
          >
            <VStack spacing={8}>
              <Spinner size="xl" thickness="4px" color={useColorModeValue('unt.primary', 'unt.secondary')} />
              <VStack spacing={2}>
                <Heading size="lg" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                  Verificando identidad
                </Heading>
                <Text color={textColor} fontSize="lg">
                  Generando prueba ZKP y preparando voto...
                </Text>
              </VStack>
              <Progress
                value={45}
                size="sm"
                width="50%"
                colorScheme="primary"
                borderRadius="full"
                isIndeterminate
              />
              <Text fontSize="sm" color="gray.500">
                Esto puede tomar unos segundos
              </Text>
            </VStack>
          </Box>
        )}

        {votingStep === 'voting' && (
          <Box
            textAlign="center"
            py={16}
            bg={bgColor}
            border="1px"
            borderColor={borderColor}
            borderTop="6px solid"
            borderTopColor="unt.secondary"
            borderRadius="xl"
            boxShadow="md"
          >
            <VStack spacing={8}>
              <Spinner size="xl" thickness="4px" color={useColorModeValue('unt.primary', 'unt.secondary')} />
              <VStack spacing={2}>
                <Heading size="lg" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                  Enviando voto a Syscoin
                </Heading>
                <Text color={textColor} fontSize="lg">
                  Confirmando transacción en la red NEVM
                </Text>
              </VStack>
              <HStack spacing={4}>
                <Badge colorScheme="gray">Gas: {gasPrice} Gwei</Badge>
                <Badge colorScheme="blue">Red: Syscoin Testnet</Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Costo estimado: ~0.005 SYS
              </Text>
            </VStack>
          </Box>
        )}

        {votingStep === 'receipt' && (
          <VoteReceipt
            voteHash={voteHash}
            sessionId={sessionId}
            candidateName={candidates?.find((c: Candidate) => c.id === selectedCandidate)?.name}
            onReset={() => {
              setVotingStep('select');
              setSelectedCandidate(null);
            }}
          />
        )}

        {!isVotingActive && session && (
          <Alert
            status={session.finalized ? 'info' : 'warning'}
            borderRadius="2xl"
            p={6}
          >
            <AlertIcon />
            <Box>
              <AlertTitle>
                {session.finalized ? 'Votación Finalizada' : 'Votación No Activa'}
              </AlertTitle>
              <AlertDescription>
                {session.finalized
                  ? 'Esta votación ha finalizado. Puedes ver los resultados en el panel de auditoría.'
                  : 'La votación aún no ha comenzado o ha terminado. Revisa las fechas.'}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Modal de Confirmación */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="lg"
          motionPreset="slideInBottom"
        >
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent borderRadius="2xl">
            <ModalHeader borderBottomWidth={1}>
              <HStack>
                <Icon as={FaShieldAlt} color="unt.primary" />
                <Text>Confirmar Voto</Text>
              </HStack>
            </ModalHeader>
            <ModalBody py={6}>
              <VStack spacing={6}>
                <Box w="full" p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text fontWeight="bold" color={textColor} fontSize="sm">
                    Candidato seleccionado:
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('unt.primary', 'unt.secondary')}>
                    {candidates?.find((c: Candidate) => c.id === selectedCandidate)?.name}
                  </Text>
                  <Text fontSize="md" color={textColor}>
                    {candidates?.find((c: Candidate) => c.id === selectedCandidate)?.party}
                  </Text>
                </Box>

                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Este voto es secreto y verificable. No podrás cambiarlo
                      después de confirmar.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box w="full" p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('blue.700', 'blue.200')}>
                        Costo estimado de transacción
                      </Text>
                      <Text fontSize="lg" color={useColorModeValue('blue.900', 'blue.100')}>
                        ~0.005 SYS
                      </Text>
                    </VStack>
                    <Badge colorScheme="gray" fontSize="sm">
                      Gas: {gasPrice} Gwei
                    </Badge>
                  </HStack>
                </Box>

                <HStack w="full" justify="space-between">
                  <Text fontSize="sm" color="gray.500">
                    Red: {chain?.name || 'Syscoin Testnet'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    ZKP: {zkpType === 'groth16' ? 'Groth16' : 'Pedersen'}
                  </Text>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter borderTopWidth={1}>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="green"
                onClick={() => {
                  onClose();
                  handleVote();
                }}
                leftIcon={<FaVoteYea />}
                isLoading={voteMutation.isLoading}
              >
                Confirmar Voto
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};