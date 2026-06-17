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
import { motion } from 'framer-motion';
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
  const selectedBg = useColorModeValue('unt.accent', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  const photoUrl = candidate.photoHash
    ? `https://gateway.ipfs.io/ipfs/${candidate.photoHash}`
    : '/default-avatar.png';

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        border="2px solid"
        borderColor={isSelected ? 'unt.primary' : borderColor}
        bg={isSelected ? selectedBg : cardBg}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        onClick={!disabled ? onSelect : undefined}
        position="relative"
        overflow="hidden"
        _hover={{
          borderColor: 'unt.primary',
          boxShadow: 'xl',
        }}
      >
        {isSelected && (
          <Box
            position="absolute"
            top={0}
            right={0}
            bg="unt.primary"
            color="white"
            px={3}
            py={1}
            borderBottomLeftRadius="lg"
            fontSize="sm"
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
                  colorScheme="green"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {candidate.voteCount} votos
                </Badge>
              )}
            </Box>

            <VStack align="start" w="full" spacing={1}>
              <Heading size="md" noOfLines={1}>
                {candidate.name}
              </Heading>
              <Badge colorScheme="blue" fontSize="sm">
                {candidate.party || 'Independiente'}
              </Badge>
              <Text fontSize="sm" color="gray.500" noOfLines={2}>
                {candidate.description}
              </Text>
            </VStack>

            <Radio
              isChecked={isSelected}
              onChange={onSelect}
              isDisabled={disabled}
              colorScheme="primary"
              alignSelf="start"
            >
              <Text fontSize="sm" color="gray.500">
                Votar por este candidato
              </Text>
            </Radio>
          </VStack>
        </CardBody>
      </Card>
    </motion.div>
  );
};