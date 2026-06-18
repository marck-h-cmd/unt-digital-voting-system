import React, { useState, useEffect } from 'react';
import { Box, HStack, Text, Progress, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';

interface SessionTimerProps {
  durationMinutes?: number;
  onExpire: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ durationMinutes = 5, onExpire }) => {
  const totalSeconds = durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = (timeLeft / totalSeconds) * 100;

  const colorScheme = timeLeft < 60 ? 'red' : timeLeft < 180 ? 'orange' : 'green';

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('unt.primary', 'unt.secondary');

  return (
    <Box w="full" bg={bgColor} p={4} borderRadius="xl" boxShadow="sm" borderWidth={1} borderColor={borderColor}>
      <HStack justify="space-between" mb={2}>
        <HStack color={timeLeft < 60 ? 'red.500' : textColor}>
          <Icon as={FaClock} />
          <Text fontWeight="bold">Sesión de Votación Segura</Text>
        </HStack>
        <Text fontWeight="bold" fontSize="lg" color={timeLeft < 60 ? 'red.500' : primaryColor} fontFamily="monospace">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </Text>
      </HStack>
      <Progress value={progressPercent} colorScheme={colorScheme} size="sm" borderRadius="full" />
    </Box>
  );
};
