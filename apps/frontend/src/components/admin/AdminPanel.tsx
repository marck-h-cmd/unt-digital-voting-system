import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Grid,
  GridItem,
  useToast,
  List,
  ListItem,
  IconButton,
  Divider,
  NumberInput,
  NumberInputField,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaTrash, FaPlus, FaCheck } from 'react-icons/fa';
import { useVoting } from '../../hooks/useVoting';

export const AdminPanel: React.FC = () => {
  const { createSession, finalizeSession } = useVoting();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('3600'); // 1 hora por defecto en segundos
  const [candidates, setCandidates] = useState<Array<{ name: string; party: string; desc: string }>>([
    { name: '', party: '', desc: '' }
  ]);
  const [finalizeId, setFinalizeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', desc: '' }]);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleCandidateChange = (index: number, field: string, value: string) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const handleCreate = async () => {
    if (!name || candidates.length < 2) {
      toast({
        title: 'Error de validación',
        description: 'Se requiere un nombre y al menos 2 candidatos',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const startTime = Math.floor(Date.now() / 1000) + 60; // Inicia en 1 minuto
      const endTime = startTime + Number(duration);

      const input = {
        name,
        description,
        startTime,
        endTime,
        candidateNames: candidates.map(c => c.name),
        candidateParties: candidates.map(c => c.party),
        candidateDescriptions: candidates.map(c => c.desc),
        candidatePhotos: candidates.map(() => ''), // Opcional
      };

      await createSession(input);
      toast({
        title: 'Éxito',
        description: 'Sesión creada con éxito',
        status: 'success',
        duration: 3000,
      });

      // Reset form
      setName('');
      setDescription('');
      setCandidates([{ name: '', party: '', desc: '' }]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la sesión',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeId) return;
    setIsLoading(true);
    try {
      await finalizeSession(Number(finalizeId));
      toast({
        title: 'Éxito',
        description: `Sesión #${finalizeId} finalizada con éxito`,
        status: 'success',
        duration: 3000,
      });
      setFinalizeId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo finalizar la sesión',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const primaryColor = useColorModeValue('unt.primary', 'unt.secondary');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box maxW="6xl" mx="auto" px={4}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" color={primaryColor}>Panel de Administración</Heading>
          <Text color={textColor}>Administra las sesiones de elecciones estudiantiles</Text>
        </Box>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Crear Nueva Sesión de Votación</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Nombre de la Elección</FormLabel>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Elecciones Rectorado 2024" />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles de la sesión de votación..." />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Duración (en segundos)</FormLabel>
                    <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ej: 3600 (1 hora)" />
                  </FormControl>

                  <Divider my={4} />

                  <HStack justify="space-between">
                    <Heading size="sm">Candidatos</Heading>
                    <Button size="sm" leftIcon={<FaPlus />} onClick={handleAddCandidate} colorScheme="blue">
                      Agregar Candidato
                    </Button>
                  </HStack>

                  <List spacing={3}>
                    {candidates.map((candidate, idx) => (
                      <ListItem key={idx} p={4} borderWidth="1px" borderRadius="lg" bg={cardBg}>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Candidato #{idx + 1}</Text>
                            {candidates.length > 1 && (
                              <IconButton
                                aria-label="Eliminar"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveCandidate(idx)}
                              />
                            )}
                          </HStack>
                          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                            <FormControl isRequired>
                              <FormLabel fontSize="sm">Nombre</FormLabel>
                              <Input
                                size="sm"
                                value={candidate.name}
                                onChange={e => handleCandidateChange(idx, 'name', e.target.value)}
                                placeholder="Nombre completo"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">Partido/Agrupación</FormLabel>
                              <Input
                                size="sm"
                                value={candidate.party}
                                onChange={e => handleCandidateChange(idx, 'party', e.target.value)}
                                placeholder="Nombre del partido"
                              />
                            </FormControl>
                          </Grid>
                          <FormControl>
                            <FormLabel fontSize="sm">Descripción / Propuesta</FormLabel>
                            <Textarea
                              size="sm"
                              value={candidate.desc}
                              onChange={e => handleCandidateChange(idx, 'desc', e.target.value)}
                              placeholder="Breve descripción del candidato..."
                            />
                          </FormControl>
                        </VStack>
                      </ListItem>
                    ))}
                  </List>

                  <Button mt={4} colorScheme="green" onClick={handleCreate} isLoading={isLoading}>
                    Crear Sesión
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Finalizar Sesión</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="sm" color={textColor}>
                    Introduce el ID numérico de la sesión que deseas finalizar. Esto bloqueará la emisión de nuevos votos y generará los resultados definitivos.
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>ID de Sesión</FormLabel>
                    <Input
                      type="number"
                      value={finalizeId}
                      onChange={e => setFinalizeId(e.target.value)}
                      placeholder="Ej: 1"
                    />
                  </FormControl>
                  <Button
                    colorScheme="red"
                    leftIcon={<FaCheck />}
                    onClick={handleFinalize}
                    isLoading={isLoading}
                    isDisabled={!finalizeId}
                  >
                    Finalizar Sesión
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
};
