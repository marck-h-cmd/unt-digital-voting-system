// frontend/src/components/voting/CandidateCard.tsx
import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Image,
  VStack,
  Heading,
  Text,
  Badge,
  Radio,
  HStack,
  Icon,
  useColorModeValue,
  CardFooter,
  Button,
} from '@chakra-ui/react';
import { FaUser, FaVoteYea } from 'react-icons/fa';

interface Candidate {
  id: string;
  name: string;
  party: string;
  photoHash: string;
  description: string;
  voteCount: number;
  active: boolean;
}

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const photoUrl = candidate.photoHash
    ? `https://gateway.ipfs.io/ipfs/${candidate.photoHash}`
    : '/default-avatar.png';

  return (
    <Box>
      <Card
        border="1px solid"
        borderColor={isSelected ? useColorModeValue('unt.primary', 'unt.secondary') : borderColor}
        bg={isSelected ? selectedBg : cardBg}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        onClick={!disabled ? onSelect : undefined}
        position="relative"
        overflow="hidden"
        boxShadow="sm"
        _hover={!disabled ? {
          borderColor: useColorModeValue('unt.primary', 'unt.secondary'),
          boxShadow: 'md',
        } : {}}
      >
        {isSelected && (
          <Box
            position="absolute"
            top={0}
            right={0}
            bg={useColorModeValue('unt.primary', 'unt.secondary')}
            color={useColorModeValue('white', 'gray.900')}
            px={3}
            py={1}
            borderBottomLeftRadius="md"
            fontSize="sm"
            fontWeight="bold"
          >
            Seleccionado
          </Box>
        )}

        <CardBody>
          <VStack spacing={4}>
            <Box
              position="relative"
              w="full"
              h="150px"
              borderRadius="lg"
              overflow="hidden"
              bg="gray.100"
            >
              <Image
                src={photoUrl}
                alt={candidate.name}
                objectFit="cover"
                w="full"
                h="full"
                fallbackSrc="/default-avatar.png"
              />
              {candidate.voteCount > 0 && (
                <Badge
                  position="absolute"
                  bottom={2}
                  right={2}
                  bg="gray.800"
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {candidate.voteCount} votos
                </Badge>
              )}
            </Box>

            <VStack align="start" w="full" spacing={1}>
              <Heading size="md" noOfLines={1} color={useColorModeValue('gray.800', 'whiteAlpha.900')}>
                {candidate.name}
              </Heading>
              <Badge bg={useColorModeValue('gray.200', 'gray.600')} color={useColorModeValue('gray.800', 'whiteAlpha.900')} fontSize="sm">
                {candidate.party || 'Independiente'}
              </Badge>
              <Text fontSize="sm" color={textColor} noOfLines={2}>
                {candidate.description}
              </Text>
            </VStack>

            <Radio
              isChecked={isSelected}
              onChange={onSelect}
              isDisabled={disabled}
              colorScheme="yellow"
              alignSelf="start"
            >
              <Text fontSize="sm" color={textColor}>
                Votar por este candidato
              </Text>
            </Radio>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};