// frontend/src/hooks/useVoting.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraphQLClient, gql } from 'graphql-request';
import toast from 'react-hot-toast';

const client = new GraphQLClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql'
);

const VOTE_MUTATION = gql`
  mutation CastVote($input: CastVoteInput!) {
    castVote(input: $input) {
      success
      voteHash
      txHash
      blockNumber
      gasCost
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
      voterAddress
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
      voterAddress
      candidate {
        name
      }
      createdAt
      txHash
      blockNumber
      gasCost
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

  const castVote = useMutation({
    mutationFn: async (input: any) => {
      const response = await client.request<any>(VOTE_MUTATION, { input });
      return response.castVote;
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
      const response = await client.request<any>(CREATE_SESSION_MUTATION, { input });
      return response.createSession;
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
      const response = await client.request<any>(FINALIZE_SESSION_MUTATION, { sessionId });
      return response.finalizeSession;
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
    const response = await client.request<any>(SESSION_QUERY, { id });
    return response.session;
  };

  const getCandidates = async (sessionId: number) => {
    const response = await client.request<any>(CANDIDATES_QUERY, { sessionId });
    return response.candidates;
  };

  const getSessionStats = async (sessionId: number) => {
    const response = await client.request<any>(STATS_QUERY, { sessionId });
    return response.sessionStats;
  };

  const getVotes = async (sessionId: number) => {
    const response = await client.request<any>(VOTES_QUERY, { sessionId });
    return response.votes;
  };

  const getVote = async (voteHash: string) => {
    const response = await client.request<any>(VOTE_QUERY, { voteHash });
    return response.vote;
  };

  const verifyVote = async (input: any) => {
    const response = await client.request<any>(VERIFY_VOTE_QUERY, { input });
    return response.verifyVote;
  };

  const hasVoted = async (sessionId: number, voterAddress: string) => {
    // Para simplificar en frontend, retornamos si hay votos del usuario
    const votes = await getVotes(sessionId);
    return votes.some((v: any) => v.voterAddress.toLowerCase() === voterAddress.toLowerCase());
  };

  return {
    castVote: castVote.mutateAsync,
    createSession: createSession.mutateAsync,
    finalizeSession: finalizeSession.mutateAsync,
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