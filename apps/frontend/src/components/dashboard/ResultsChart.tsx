// frontend/src/components/dashboard/ResultsChart.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Select,
  HStack,
  VStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { motion } from 'framer-motion';

interface Result {
  candidateId: string;
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

interface ResultsChartProps {
  results: Result[];
  title?: string;
  loading?: boolean;
}

const COLORS = ['#003366', '#FFD700', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export const ResultsChart: React.FC<ResultsChartProps> = ({
  results,
  title = 'Resultados de la Votación',
  loading = false,
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const cardBg = useColorModeValue('white', 'gray.800');

  const chartData = useMemo(() => {
    return results.map((r, index) => ({
      ...r,
      color: COLORS[index % COLORS.length],
      label: `${r.name} (${r.party})`,
    }));
  }, [results]);

  const totalVotes = useMemo(() => {
    return results.reduce((sum, r) => sum + r.votes, 0);
  }, [results]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Box textAlign="center" py={10}>
            <Text>Cargando resultados...</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card bg={cardBg} boxShadow="lg" borderRadius="xl">
        <CardHeader>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Heading size="md">{title}</Heading>
              <Select
                w="150px"
                size="sm"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <option value="pie">Torta</option>
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
              </Select>
            </HStack>
            <HStack spacing={4}>
              <Badge colorScheme="blue">
                Total votos: {totalVotes}
              </Badge>
              <Badge colorScheme="green">
                Candidatos: {results.length}
              </Badge>
            </HStack>
          </VStack>
        </CardHeader>

        <CardBody>
          <Box h="400px">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="votes"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      return [`${value} votos (${props.payload.percentage.toFixed(1)}%)`, props.payload.name];
                    }}
                  />
                  <Legend />
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      return [`${value} votos (${props.payload.percentage.toFixed(1)}%)`, 'Votos'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="votes" fill="#003366">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      return [`${value} votos`, 'Votos'];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="votes"
                    stroke="#003366"
                    strokeWidth={2}
                    dot={{ fill: '#003366', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Box>

          <Box mt={4}>
            <VStack align="stretch" spacing={2}>
              {chartData.map((item, index) => (
                <HStack
                  key={index}
                  justify="space-between"
                  p={2}
                  bg={index % 2 === 0 ? 'gray.50' : 'transparent'}
                  borderRadius="md"
                >
                  <HStack>
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      bg={item.color}
                    />
                    <Text fontWeight="medium">{item.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      ({item.party})
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">{item.votes}</Text>
                    <Text fontSize="sm" color="gray.500">
                      ({item.percentage.toFixed(1)}%)
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        </CardBody>
      </Card>
    </motion.div>
  );
};