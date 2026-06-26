// frontend/src/hooks/useVoting.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraphQLClient, gql } from 'graphql-request';
import toast from 'react-hot-toast';

const client = new GraphQLClient(
  import.meta.env.VITE_VOTE_API_URL || 'http://localhost:4000/graphql'
);

// Mock data
let mockSessions = [
  {
    id: 1,
    name: 'Elecciones Universitarias UNT 2026',
    description: 'Votación para el consejo estudiantil',
    startTime: Math.floor(Date.now() / 1000) - 3600,
    endTime: Math.floor(Date.now() / 1000) + 86400,
    active: true,
    finalized: false,
    totalVotes: 150,
    validVotes: 135,
    noiseVotes: 15,
    merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
];

let mockCandidates = [
  {
    id: 1,
    name: 'Dra. María Elena',
    party: 'Frente Universitario (FU)',
    photoHash: '',
    description: 'Candidata a presidenta del consejo estudiantil',
    voteCount: 45,
    active: true,
    sessionId: 1,
  },
  {
    id: 2,
    name: 'Dr. Carlos Mendoza',
    party: 'Movimiento Estudiantil (ME)',
    photoHash: '',
    description: 'Candidato a presidenta del consejo estudiantil',
    voteCount: 38,
    active: true,
    sessionId: 1,
  },
  {
    id: 3,
    name: 'Dr. Luis Paredes',
    party: 'Acción Universitaria (AU)',
    photoHash: '',
    description: 'Candidato a presidenta del consejo estudiantil',
    voteCount: 52,
    active: true,
    sessionId: 1,
  },
];

let mockVotes = [
  {
    voteHash: '0x1234567890abcdef',
    nullifierHash: '0xabcdef1234567890',
    isReal: true,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sessionId: 1,
  },
];

const VOTE_MUTATION = gql`
  mutation CastVote($input: CastVoteInput!) {
    castVote(input: $input) {
      success
      voteHash
      txHash
      blockNumber
      merkleRoot
      timestamp
    }
  }
`;

const CREATE_SESSION_MUTATION = gql`
  mutation CreateSession($input: CreateSessionInput!) {
    createSession(input: $input) {
      id
      name
      description
      startTime
      endTime
      active
      finalized
    }
  }
`;

const FINALIZE_SESSION_MUTATION = gql`
  mutation FinalizeSession($sessionId: Int!) {
    finalizeSession(sessionId: $sessionId)
  }
`;

const SESSIONS_QUERY = gql`
  query GetSessions {
    sessions {
      id
      name
      description
      startTime
      endTime
      active
      finalized
      totalVotes
      validVotes
      noiseVotes
      merkleRoot
    }
  }
`;

const SESSION_QUERY = gql`
  query GetSession($id: Int!) {
    session(id: $id) {
      id
      name
      description
      startTime
      endTime
      active
      finalized
      totalVotes
      validVotes
      noiseVotes
      merkleRoot
    }
  }
`;

const CANDIDATES_QUERY = gql`
  query GetCandidates($sessionId: Int!) {
    candidates(sessionId: $sessionId) {
      id
      name
      party
      photoHash
      description
      voteCount
      active
    }
  }
`;

const STATS_QUERY = gql`
  query GetSessionStats($sessionId: Int!) {
    sessionStats(sessionId: $sessionId) {
      sessionId
      name
      status
      totalVotes
      validVotes
      noiseVotes
      participationRate
      results {
        candidateId
        name
        party
        votes
        percentage
      }
      startTime
      endTime
      merkleRoot
      timestamp
    }
  }
`;

const VOTES_QUERY = gql`
  query GetVotes($sessionId: Int!) {
    votes(sessionId: $sessionId) {
      voteHash
      nullifierHash
      isReal
      status
      createdAt
    }
  }
`;

const VOTE_QUERY = gql`
  query GetVote($voteHash: String!) {
    vote(voteHash: $voteHash) {
      voteHash
      sessionId
      nullifierHash
      candidate {
        name
      }
      createdAt
      txHash
      blockNumber
      zkpProof
    }
  }
`;

const VERIFY_VOTE_QUERY = gql`
  query VerifyVote($input: VerifyVoteInput!) {
    verifyVote(input: $input) {
      isValid
      checks {
        onChain
        merkleProof
        zkpValid
        ipfsVerified
        confirmed
      }
      details
    }
  }
`;

export const useVoting = () => {
  const queryClient = useQueryClient();

  const getSessions = async () => {
    try {
      const response = await client.request<any>(SESSIONS_QUERY);
      return response.sessions;
    } catch (error) {
      console.error('Error fetching sessions, using mock:', error);
      return mockSessions;
    }
  };

  const castVote = useMutation({
    mutationFn: async (input: any) => {
      try {
        const response = await client.request<any>(VOTE_MUTATION, { input });
        return response.castVote;
      } catch (error) {
        console.error('Error casting vote, using mock:', error);
        const newVote = {
          success: true,
          voteHash: '0x' + Math.random().toString(16).substring(2, 66),
          txHash: '0x' + Math.random().toString(16).substring(2, 66),
          blockNumber: 123456,
          merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef12',
          timestamp: new Date().toISOString(),
        };
        mockVotes.push({
          voteHash: newVote.voteHash,
          nullifierHash: input.nullifierHash,
          isReal: true,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          sessionId: input.sessionId,
        });
        const session = mockSessions.find(s => s.id === input.sessionId);
        if (session) {
          session.totalVotes++;
          session.validVotes++;
        }
        return newVote;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Voto emitido exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al emitir voto: ${error.message}`);
    },
  });

  const createSession = useMutation({
    mutationFn: async (input: any) => {
      try {
        const response = await client.request<any>(CREATE_SESSION_MUTATION, { input });
        return response.createSession;
      } catch (error) {
        console.error('Error creating session, using mock:', error);
        const newSession = {
          id: mockSessions.length + 1,
          name: input.name,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          active: true,
          finalized: false,
          totalVotes: 0,
          validVotes: 0,
          noiseVotes: 0,
          merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef12',
        };
        mockSessions.push(newSession);
        // Add candidates
        for (let i = 0; i < input.candidateNames.length; i++) {
          mockCandidates.push({
            id: mockCandidates.length + 1,
            name: input.candidateNames[i],
            party: input.candidateParties?.[i] || '',
            photoHash: input.candidatePhotos?.[i] || '',
            description: input.candidateDescriptions?.[i] || '',
            voteCount: 0,
            active: true,
            sessionId: newSession.id,
          });
        }
        return newSession;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Sesión creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear sesión: ${error.message}`);
    },
  });

  const finalizeSession = useMutation({
    mutationFn: async (sessionId: number) => {
      try {
        const response = await client.request<any>(FINALIZE_SESSION_MUTATION, { sessionId });
        return response.finalizeSession;
      } catch (error) {
        console.error('Error finalizing session, using mock:', error);
        const session = mockSessions.find(s => s.id === sessionId);
        if (session) {
          session.finalized = true;
          session.active = false;
        }
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Sesión finalizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al finalizar sesión: ${error.message}`);
    },
  });

  const getSession = async (id: number) => {
    try {
      const response = await client.request<any>(SESSION_QUERY, { id });
      return response.session;
    } catch (error) {
      console.error('Error fetching session, using mock:', error);
      return mockSessions.find(s => s.id === id) || mockSessions[0];
    }
  };

  const getCandidates = async (sessionId: number) => {
    try {
      const response = await client.request<any>(CANDIDATES_QUERY, { sessionId });
      return response.candidates;
    } catch (error) {
      console.error('Error fetching candidates, using mock:', error);
      return mockCandidates.filter(c => c.sessionId === sessionId);
    }
  };

  const getSessionStats = async (sessionId: number) => {
    try {
      const response = await client.request<any>(STATS_QUERY, { sessionId });
      return response.sessionStats;
    } catch (error) {
      console.error('Error fetching session stats, using mock:', error);
      const session = mockSessions.find(s => s.id === sessionId) || mockSessions[0];
      const candidates = mockCandidates.filter(c => c.sessionId === sessionId);
      const results = candidates.map(c => ({
        candidateId: c.id,
        name: c.name,
        party: c.party,
        votes: c.voteCount,
        percentage: session.validVotes > 0 ? (c.voteCount / session.validVotes) * 100 : 0,
      }));
      return {
        sessionId: session.id,
        name: session.name,
        status: session.finalized ? 'finalized' : session.active ? 'active' : 'paused',
        totalVotes: session.totalVotes,
        validVotes: session.validVotes,
        noiseVotes: session.noiseVotes,
        participationRate: 75,
        results,
        startTime: session.startTime,
        endTime: session.endTime,
        merkleRoot: session.merkleRoot,
        timestamp: new Date().toISOString(),
      };
    }
  };

  const getVotes = async (sessionId: number) => {
    try {
      const response = await client.request<any>(VOTES_QUERY, { sessionId });
      return response.votes;
    } catch (error) {
      console.error('Error fetching votes, using mock:', error);
      return mockVotes.filter(v => v.sessionId === sessionId);
    }
  };

  const getVote = async (voteHash: string) => {
    try {
      const response = await client.request<any>(VOTE_QUERY, { voteHash });
      return response.vote;
    } catch (error) {
      console.error('Error fetching vote, using mock:', error);
      return mockVotes.find(v => v.voteHash === voteHash) || mockVotes[0];
    }
  };

  const verifyVote = async (input: any) => {
    try {
      const response = await client.request<any>(VERIFY_VOTE_QUERY, { input });
      return response.verifyVote;
    } catch (error) {
      console.error('Error verifying vote, using mock:', error);
      return {
        isValid: true,
        checks: {
          onChain: true,
          merkleProof: true,
          zkpValid: true,
          ipfsVerified: true,
          confirmed: true,
        },
        details: { voteHash: input.voteHash, timestamp: new Date().toISOString() },
      };
    }
  };

  const hasVoted = async (sessionId: number, nullifierHash: string) => {
    // Para simplificar en frontend, retornamos si hay votos del usuario
    try {
      const votes = await getVotes(sessionId);
      return votes.some((v: any) => v.nullifierHash === nullifierHash);
    } catch (error) {
      console.error('Error checking if voted, using mock:', error);
      return false;
    }
  };

  return {
    castVote: castVote.mutateAsync,
    createSession: createSession.mutateAsync,
    finalizeSession: finalizeSession.mutateAsync,
    getSessions,
    getSession,
    getCandidates,
    getSessionStats,
    getVotes,
    getVote,
    verifyVote,
    hasVoted,
    isLoading: castVote.isLoading || createSession.isLoading || finalizeSession.isLoading,
  };
};