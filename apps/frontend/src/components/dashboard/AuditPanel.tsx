// frontend/src/components/dashboard/AuditPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  HStack,
  VStack,
  Icon,
  useToast,
  Spinner,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSearch, FaCheckCircle, FaTimesCircle, FaClock, FaDownload } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';

import { useVoting } from '../../hooks/useVoting';
import { useBlockchain } from '../../hooks/useBlockchain';

export const AuditPanel: React.FC = () => {
  const { getVotes, getSessionStats, verifyVote } = useVoting();
  const { getGasPrice, getNetworkInfo } = useBlockchain();
  const toast = useToast();
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'noise'>('all');
  const cardBg = useColorModeValue('white', 'gray.800');

  const { data: votes, isLoading: votesLoading, refetch: refetchVotes } = useQuery({
    queryKey: ['audit-votes', selectedSession, filterType],
    queryFn: () => getVotes(selectedSession),
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats', selectedSession],
    queryFn: () => getSessionStats(selectedSession),
    refetchInterval: 10000,
  });

  const filteredVotes = votes?.filter((vote: any) => {
    const matchesSearch = vote.voteHash.includes(searchTerm) || 
                          vote.voterAddress.includes(searchTerm);
    const matchesType = filterType === 'all' || 
                        (filterType === 'real' && vote.isReal) ||
                        (filterType === 'noise' && !vote.isReal);
    return matchesSearch && matchesType;
  });

  const handleVerifyVote = async (voteHash: string) => {
    try {
      const result = await verifyVote({
        sessionId: selectedSession,
        voteHash,
        merkleProof: [],
      });
      
      toast({
        title: result.isValid ? 'Voto Verificado' : 'Voto No Verificado',
        status: result.isValid ? 'success' : 'error',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error al verificar',
        description: (error as any).message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const exportAudit = () => {
    const data = {
      sessionId: selectedSession,
      stats,
      votes: filteredVotes,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${selectedSession}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (votesLoading || statsLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Cargando datos de auditoría...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="7xl" mx="auto">
      <VStack spacing={8} align="stretch">
        <Card>
          <CardHeader>
            <VStack align="start" spacing={2}>
              <Heading size="lg">Panel de Auditoría</Heading>
              <Text color="gray.600">
                Verifica y audita todos los votos del sistema
              </Text>
            </VStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack w="full" spacing={4}>
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  w="200px"
                >
                  <option value={1}>Sesión 1 - UNT 2024</option>
                  <option value={2}>Sesión 2 - Facultad</option>
                </Select>
                <Input
                  placeholder="Buscar por hash o votante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  flex={1}
                />
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  w="150px"
                >
                  <option value="all">Todos</option>
                  <option value="real">Reales</option>
                  <option value="noise">Ruido</option>
                </Select>
                <Button colorScheme="primary" onClick={exportAudit} leftIcon={<FaDownload />}>
                  Exportar
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {stats && (
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Heading size="sm">Estadísticas</Heading>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Métrica</Th>
                        <Th isNumeric>Valor</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Total Votos</Td>
                        <Td isNumeric>{stats.totalVotes}</Td>
                      </Tr>
                      <Tr>
                        <Td>Votos Válidos</Td>
                        <Td isNumeric>{stats.validVotes}</Td>
                      </Tr>
                      <Tr>
                        <Td>Votos de Ruido</Td>
                        <Td isNumeric>{stats.noiseVotes}</Td>
                      </Tr>
                      <Tr>
                        <Td>Participación</Td>
                        <Td isNumeric>{stats.participationRate.toFixed(1)}%</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Heading size="sm">Votos Registrados</Heading>
                <Badge colorScheme="blue">
                  {filteredVotes?.length || 0} votos
                </Badge>
              </HStack>

              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Hash</Th>
                      <Th>Votante</Th>
                      <Th>Tipo</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredVotes?.map((vote: any) => (
                      <Tr key={vote.voteHash || vote.nullifierHash}>
                        <Td>
                          <Code fontSize="xs">
                            {(vote.voteHash || '0x0000000000000000').slice(0, 8)}...
                          </Code>
                        </Td>
                        <Td>
                          <Code fontSize="xs">
                            {(vote.voterAddress || vote.nullifierHash || '0x0000000000000000').slice(0, 6)}...{(vote.voterAddress || vote.nullifierHash || '0x0000000000000000').slice(-4)}
                          </Code>
                        </Td>
                        <Td>
                          <Badge colorScheme={vote.isReal ? 'green' : 'gray'}>
                            {vote.isReal ? 'Real' : 'Ruido'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={vote.status === 'confirmed' ? 'green' : 'yellow'}>
                            {vote.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleVerifyVote(vote.voteHash)}
                          >
                            Verificar
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Auditoría Completa</AlertTitle>
            <AlertDescription>
              Todos los votos están verificados criptográficamente con ZKP y Merkle Trees
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};