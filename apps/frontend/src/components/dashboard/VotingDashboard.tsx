import React, { useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Select,
  useColorModeValue,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useVoting } from '../../hooks/useVoting';
import { ResultsChart } from './ResultsChart';

export const VotingDashboard: React.FC = () => {
  const { getSessionStats, getSession } = useVoting();
  const [selectedSession, setSelectedSession] = useState<number>(2);
  const bgColor = useColorModeValue('white', 'gray.800');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedSession],
    queryFn: () => getSessionStats(selectedSession),
    refetchInterval: 10000,
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['dashboard-session', selectedSession],
    queryFn: () => getSession(selectedSession),
  });

  if (statsLoading || sessionLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="unt.primary" />
        <Text mt={4}>Cargando dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="7xl" mx="auto" px={4}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" wrap="wrap">
          <Box>
            <Heading size="lg" color="unt.primary">Dashboard de Resultados</Heading>
            <Text color="gray.600">Visualiza el progreso y los resultados en tiempo real</Text>
          </Box>
          <Select
            value={selectedSession}
            onChange={(e) => setSelectedSession(Number(e.target.value))}
            w="250px"
            bg={bgColor}
          >
            <option value={1}>Sesión 1 - UNT 2024</option>
            <option value={2}>Sesión 2 - Facultad</option>
          </Select>
        </HStack>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Votos Totales</StatLabel>
                  <StatNumber>{stats?.totalVotes || 0}</StatNumber>
                  <StatHelpText>Registrados en Syscoin</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Votos Válidos (ZKP)</StatLabel>
                  <StatNumber>{stats?.validVotes || 0}</StatNumber>
                  <StatHelpText>{stats?.participationRate?.toFixed(1) || 0}% de participación</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Votos de Ruido</StatLabel>
                  <StatNumber>{stats?.noiseVotes || 0}</StatNumber>
                  <StatHelpText>Para anonimato diferencial</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {stats?.results && stats.results.length > 0 ? (
          <ResultsChart results={stats.results} title={`Resultados - ${stats.name}`} />
        ) : (
          <Card>
            <CardBody py={10} textAlign="center">
              <Text color="gray.500">No hay votos registrados en esta sesión aún.</Text>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};
