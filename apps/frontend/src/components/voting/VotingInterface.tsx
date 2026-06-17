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
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { data: balance } = useBalance({ address });
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
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  // Obtener información de la sesión
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: isConnected,
    refetchInterval: 30000,
  });

  // Obtener candidatos
  const { data: candidates, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery({
    queryKey: ['candidates', sessionId],
    queryFn: () => getCandidates(sessionId),
    enabled: isConnected,
  });

  // Obtener estadísticas
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats', sessionId],
    queryFn: () => getSessionStats(sessionId),
    enabled: isConnected,
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

  // Verificar red correcta
  useEffect(() => {
    if (isConnected && chain?.id !== 5700) {
      toast.error('Por favor conecta a Syscoin Testnet');
      if (switchNetwork) {
        switchNetwork(5700);
      }
    }
  }, [chain, isConnected, switchNetwork]);

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
    if (!selectedCandidate || !address || !session) return;

    try {
      setVotingStep('verify');
      const loadingToast = toast.loading('Preparando voto...');

      // 1. Generar ZKP
      toast.loading('Generando prueba ZKP...', { id: loadingToast });
      const zkp = await generateProof({
        voterId: address,
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
        voterId: address,
        zkpType,
      };

      // 3. Generar hash del voto
      const voteHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(voteData))
      );

      // 4. Firmar el voto
      const signature = await signMessageAsync({
        message: `Vote: ${voteHash}`,
      });

      toast.loading('Enviando voto a blockchain...', { id: loadingToast });

      // 5. Enviar voto
      setVotingStep('voting');
      await voteMutation.mutateAsync({
        sessionId,
        voteHash,
        merkleProof: [],
        zkp,
        signature,
        candidateId: selectedCandidate,
        encryptedVote: JSON.stringify(voteData),
      });

      toast.success('¡Voto emitido con éxito!', { id: loadingToast });

    } catch (error: any) {
      console.error('Error en voto:', error);
      setVotingStep('select');
    }
  }, [selectedCandidate, address, session, sessionId, generateProof, signMessageAsync, voteMutation, zkpType]);

  if (!isConnected) {
    return (
      <Box
        maxW="6xl"
        mx="auto"
        py={20}
        textAlign="center"
        bg={bgColor}
        borderRadius="2xl"
        boxShadow="xl"
        px={8}
      >
        <VStack spacing={8}>
          <Icon as={FaVoteYea} boxSize={16} color="unt.primary" />
          <Heading size="xl" color="unt.primary">
            Elecciones Universitarias UNT 2024
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            Participa en las elecciones estudiantiles con un sistema de votación
            descentralizado, seguro y verificable.
          </Text>
          <Button
            colorScheme="primary"
            size="lg"
            onClick={() => window.dispatchEvent(new Event('web3modal-open'))}
            leftIcon={<FaUserCheck />}
          >
            Conectar Wallet
          </Button>
          <Text fontSize="sm" color="gray.500">
            Compatible con MetaMask, WalletConnect y más
          </Text>
        </VStack>
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
          borderRadius="2xl"
          boxShadow="lg"
          p={6}
          borderLeft="4px solid"
          borderColor="unt.primary"
        >
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={1}>
                <Heading size="xl" color="unt.primary">
                  {session?.name || 'Elecciones UNT 2024'}
                </Heading>
                <Text color="gray.600">{session?.description}</Text>
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
                      <Badge colorScheme="blue" fontSize="md" p={2} borderRadius="lg">
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
                      <Badge colorScheme="purple" fontSize="md" p={2} borderRadius="lg">
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
                <StatLabel>Wallet</StatLabel>
                <StatNumber fontSize="sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </StatNumber>
                <StatHelpText>
                  Balance: {balance ? Number(ethers.formatEther(balance.value)).toFixed(4) : '0'} SYS
                </StatHelpText>
              </Stat>
            </Grid>
          </VStack>
        </Box>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="sm">Opciones Avanzadas</Heading>
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
          <Box>
            <Heading size="lg" mb={4}>
              Selecciona tu candidato
            </Heading>
            <Text color="gray.600" mb={6}>
              Tu voto es secreto y verificable. Selecciona al candidato de tu preferencia.
            </Text>
            <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
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
              <Box textAlign="center" mt={8}>
                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={onOpen}
                  leftIcon={<FaShieldAlt />}
                  px={12}
                  py={6}
                  borderRadius="xl"
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
            borderRadius="2xl"
            boxShadow="lg"
          >
            <VStack spacing={6}>
              <Spinner size="xl" thickness="4px" color="unt.primary" />
              <Heading size="md">Verificando identidad</Heading>
              <Text color="gray.600">
                Generando prueba ZKP y preparando voto...
              </Text>
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
            borderRadius="2xl"
            boxShadow="lg"
          >
            <VStack spacing={6}>
              <Spinner size="xl" thickness="4px" color="unt.primary" />
              <Heading size="md">Enviando voto a Syscoin</Heading>
              <Text color="gray.600">
                Confirmando transacción en la red NEVM
              </Text>
              <HStack spacing={4}>
                <Badge colorScheme="purple">Gas: {gasPrice} Gwei</Badge>
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
                <Box w="full" p={4} bg={cardBg} borderRadius="xl">
                  <Text fontWeight="bold" color="gray.600" fontSize="sm">
                    Candidato seleccionado:
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="unt.primary">
                    {candidates?.find((c: Candidate) => c.id === selectedCandidate)?.name}
                  </Text>
                  <Text fontSize="md" color="gray.600">
                    {candidates?.find((c: Candidate) => c.id === selectedCandidate)?.party}
                  </Text>
                </Box>

                <Alert status="warning" borderRadius="xl">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Este voto es secreto y verificable. No podrás cambiarlo
                      después de confirmar.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box w="full" p={4} bg="blue.50" borderRadius="xl">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="blue.700">
                        Costo estimado de transacción
                      </Text>
                      <Text fontSize="lg" color="blue.900">
                        ~0.005 SYS
                      </Text>
                    </VStack>
                    <Badge colorScheme="purple" fontSize="sm">
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