// contracts/contracts/Election.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ZKPVerifier.sol";
import "./MerkleVerifier.sol";

/**
 * @title Election
 * @dev Sistema de votación con ZKP y Merkle Trees en Syscoin
 */
contract Election is Ownable, ReentrancyGuard, Pausable, ZKPVerifier, MerkleVerifier {
    using ECDSA for bytes32;

    // ============ ENUMS ============
    
    enum ElectionState { CREATED, ACTIVE, PAUSED, ENDED, VERIFIED }

    // ============ STRUCTS ============
    
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string description;
        string photoHash;
        uint256 voteCount;
        bool active;
    }

    struct Session {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool finalized;
        uint256 totalVotes;
        uint256 validVotes;
        uint256 noiseVotes;
        bytes32 merkleRoot;
        bytes32 resultHash;
        bool resultsPublished;
    }

    struct Vote {
        bytes32 voteHash;
        uint256 sessionId;
        address voter;
        uint256 timestamp;
        bytes32 merkleRoot;
        bool isReal;
        bool zkpValid;
        bool counted;
        uint256 candidateId;
    }

    struct ZKProofData {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] input;
    }

    // ============ STATE VARIABLES ============
    
    ElectionState public state;
    uint256 public currentSessionId;
    
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => mapping(uint256 => Candidate)) public sessionCandidates;
    mapping(uint256 => uint256[]) public sessionCandidateIds;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(bytes32 => bool)) public voteExists;
    mapping(uint256 => mapping(bytes32 => Vote)) public votes;
    mapping(uint256 => uint256) public sessionTotalVotes;
    mapping(uint256 => uint256) public sessionValidVotes;
    mapping(uint256 => bool) public sessionResultsPublished;

    // ============ EVENTS ============
    
    event VoteCast(
        uint256 indexed sessionId,
        address indexed voter,
        bytes32 voteHash,
        bytes32 merkleRoot,
        uint256 timestamp
    );
    
    event VoteVerified(
        uint256 indexed sessionId,
        bytes32 voteHash,
        bool isValid,
        bool isReal
    );
    
    event CandidateAdded(
        uint256 indexed sessionId,
        uint256 candidateId,
        string name
    );
    
    event SessionCreated(
        uint256 indexed sessionId,
        string name,
        uint256 startTime,
        uint256 endTime
    );
    
    event SessionFinalized(
        uint256 indexed sessionId,
        uint256 totalVotes,
        uint256 validVotes,
        bytes32 resultHash
    );
    
    event MerkleRootUpdated(
        uint256 indexed sessionId,
        bytes32 oldRoot,
        bytes32 newRoot
    );

    event ResultsPublished(
        uint256 indexed sessionId,
        bytes32 resultHash,
        uint256 timestamp
    );

    // ============ MODIFIERS ============
    
    modifier onlyActiveSession(uint256 sessionId) {
        Session memory session = sessions[sessionId];
        require(session.active, "Session not active");
        require(!session.finalized, "Session finalized");
        require(
            block.timestamp >= session.startTime &&
            block.timestamp <= session.endTime,
            "Session not in voting period"
        );
        _;
    }

    modifier onlyFinalizedSession(uint256 sessionId) {
        require(sessions[sessionId].finalized, "Session not finalized");
        _;
    }

    modifier onlyValidSession(uint256 sessionId) {
        require(sessions[sessionId].id != 0, "Session does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() Ownable(msg.sender) {
        state = ElectionState.CREATED;
        currentSessionId = 0;
    }

    // ============ SESSION MANAGEMENT ============
    
    /**
     * @dev Crea una nueva sesión de votación
     */
    function createSession(
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        string[] memory candidateNames,
        string[] memory candidateParties,
        string[] memory candidateDescriptions,
        string[] memory candidatePhotos
    ) external onlyOwner returns (uint256) {
        require(startTime < endTime, "Invalid time range");
        require(block.timestamp < startTime, "Start time must be in future");
        require(
            candidateNames.length == candidateParties.length &&
            candidateNames.length == candidateDescriptions.length &&
            candidateNames.length == candidatePhotos.length,
            "Candidate arrays length mismatch"
        );
        require(candidateNames.length >= 2, "Need at least 2 candidates");

        uint256 sessionId = ++currentSessionId;
        
        // Crear sesión
        sessions[sessionId] = Session({
            id: sessionId,
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            active: true,
            finalized: false,
            totalVotes: 0,
            validVotes: 0,
            noiseVotes: 0,
            merkleRoot: bytes32(0),
            resultHash: bytes32(0),
            resultsPublished: false
        });

        // Agregar candidatos
        for (uint256 i = 0; i < candidateNames.length; i++) {
            _addCandidate(
                sessionId,
                candidateNames[i],
                candidateParties[i],
                candidateDescriptions[i],
                candidatePhotos[i]
            );
        }

        emit SessionCreated(sessionId, name, startTime, endTime);
        state = ElectionState.ACTIVE;
        
        return sessionId;
    }

    /**
     * @dev Agrega un candidato a la sesión
     */
    function _addCandidate(
        uint256 sessionId,
        string memory name,
        string memory party,
        string memory description,
        string memory photoHash
    ) internal {
        uint256 candidateId = uint256(
            keccak256(abi.encodePacked(sessionId, name, block.timestamp))
        );
        
        sessionCandidates[sessionId][candidateId] = Candidate({
            id: candidateId,
            name: name,
            party: party,
            description: description,
            photoHash: photoHash,
            voteCount: 0,
            active: true
        });
        
        sessionCandidateIds[sessionId].push(candidateId);
        
        emit CandidateAdded(sessionId, candidateId, name);
    }

    /**
     * @dev Finaliza una sesión de votación
     */
    function finalizeSession(uint256 sessionId) external onlyOwner onlyValidSession(sessionId) {
        Session storage session = sessions[sessionId];
        require(session.active, "Session not active");
        require(!session.finalized, "Already finalized");
        require(block.timestamp > session.endTime, "Voting period not ended");
        
        session.active = false;
        session.finalized = true;
        
        // Generar hash de resultados
        session.resultHash = _generateResultHash(sessionId);
        
        emit SessionFinalized(
            sessionId,
            session.totalVotes,
            session.validVotes,
            session.resultHash
        );
        
        state = ElectionState.ENDED;
    }

    /**
     * @dev Publica los resultados de una sesión
     */
    function publishResults(uint256 sessionId) external onlyOwner onlyFinalizedSession(sessionId) {
        require(!sessionResultsPublished[sessionId], "Results already published");
        
        sessionResultsPublished[sessionId] = true;
        sessions[sessionId].resultsPublished = true;
        
        emit ResultsPublished(
            sessionId,
            sessions[sessionId].resultHash,
            block.timestamp
        );
        
        state = ElectionState.VERIFIED;
    }

    // ============ VOTING FUNCTIONS ============
    
    /**
     * @dev Emite un voto
     */
    function castVote(
        uint256 sessionId,
        bytes32 voteHash,
        bytes32[] calldata merkleProof,
        ZKProofData calldata zkp,
        bytes memory signature,
        uint256 candidateId
    ) external nonReentrant whenNotPaused onlyActiveSession(sessionId) {
        require(!hasVoted[sessionId][msg.sender], "Already voted in this session");
        require(!voteExists[sessionId][voteHash], "Vote already exists");
        require(candidateId > 0, "Invalid candidate");

        // 1. Verificar candidato
        require(sessionCandidates[sessionId][candidateId].active, "Candidate not active");
        
        // 2. Verificar ZKP
        bool zkpValid = verifyZKP(zkp.a, zkp.b, zkp.c, zkp.input);
        require(zkpValid, "Invalid ZK proof");

        // 3. Verificar Merkle Proof
        bytes32 leaf = keccak256(abi.encodePacked(voteHash));
        bool merkleValid = verifyMerkleProof(merkleProof, sessions[sessionId].merkleRoot, leaf);
        require(merkleValid, "Invalid Merkle proof");

        // 4. Verificar firma (EIP-712)
        bytes32 messageHash = keccak256(
            abi.encodePacked(voteHash, msg.sender, sessionId, candidateId)
        );
        require(
            messageHash.toEthSignedMessageHash().recover(signature) == msg.sender,
            "Invalid signature"
        );

        // 5. Guardar voto
        hasVoted[sessionId][msg.sender] = true;
        voteExists[sessionId][voteHash] = true;
        
        votes[sessionId][voteHash] = Vote({
            voteHash: voteHash,
            sessionId: sessionId,
            voter: msg.sender,
            timestamp: block.timestamp,
            merkleRoot: sessions[sessionId].merkleRoot,
            isReal: true,
            zkpValid: zkpValid,
            counted: false,
            candidateId: candidateId
        });

        // 6. Actualizar contadores
        sessionTotalVotes[sessionId]++;
        sessions[sessionId].totalVotes++;
        
        if (zkpValid) {
            sessionValidVotes[sessionId]++;
            sessions[sessionId].validVotes++;
            // Contar voto para el candidato
            sessionCandidates[sessionId][candidateId].voteCount++;
        }

        emit VoteCast(sessionId, msg.sender, voteHash, sessions[sessionId].merkleRoot, block.timestamp);
    }

    /**
     * @dev Registra votos de ruido (llamado por el backend)
     */
    function registerNoiseVote(
        uint256 sessionId,
        bytes32 voteHash,
        uint256 candidateId
    ) external onlyOwner onlyActiveSession(sessionId) {
        require(!voteExists[sessionId][voteHash], "Vote already exists");
        require(sessionCandidates[sessionId][candidateId].active, "Candidate not active");

        voteExists[sessionId][voteHash] = true;
        
        votes[sessionId][voteHash] = Vote({
            voteHash: voteHash,
            sessionId: sessionId,
            voter: address(0),
            timestamp: block.timestamp,
            merkleRoot: sessions[sessionId].merkleRoot,
            isReal: false,
            zkpValid: false,
            counted: false,
            candidateId: candidateId
        });

        sessions[sessionId].noiseVotes++;
        sessions[sessionId].totalVotes++;
        
        emit VoteVerified(sessionId, voteHash, false, false);
    }

    // ============ MERKLE TREE FUNCTIONS ============
    
    /**
     * @dev Actualiza la raíz del Merkle Tree
     */
    function updateMerkleRoot(uint256 sessionId, bytes32 newRoot) external onlyOwner onlyValidSession(sessionId) {
        require(sessions[sessionId].active, "Session not active");
        
        bytes32 oldRoot = sessions[sessionId].merkleRoot;
        sessions[sessionId].merkleRoot = newRoot;
        
        // Registrar la raíz para verificación
        registerMerkleRoot(newRoot);
        
        emit MerkleRootUpdated(sessionId, oldRoot, newRoot);
    }

    /**
     * @dev Verifica un voto en el Merkle Tree
     */
    function verifyVoteInMerkleTree(
        uint256 sessionId,
        bytes32 voteHash,
        bytes32[] calldata proof
    ) external view returns (bool) {
        return verifyVoteInTree(
            sessionId,
            voteHash,
            sessions[sessionId].merkleRoot,
            proof
        );
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Obtiene los candidatos de una sesión
     */
    function getSessionCandidates(uint256 sessionId) external view returns (Candidate[] memory) {
        uint256[] memory ids = sessionCandidateIds[sessionId];
        Candidate[] memory candidates = new Candidate[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            candidates[i] = sessionCandidates[sessionId][ids[i]];
        }
        
        return candidates;
    }

    /**
     * @dev Obtiene los resultados de una sesión
     */
    function getSessionResults(uint256 sessionId) 
        external 
        view 
        onlyFinalizedSession(sessionId) 
        returns (Candidate[] memory) 
    {
        return getSessionCandidates(sessionId);
    }

    /**
     * @dev Obtiene estadísticas de una sesión
     */
    function getSessionStats(uint256 sessionId) 
        external 
        view 
        onlyValidSession(sessionId) 
        returns (
            uint256 totalVotes,
            uint256 validVotes,
            uint256 noiseVotes,
            uint256 participationRate
        ) 
    {
        Session memory session = sessions[sessionId];
        return (
            session.totalVotes,
            session.validVotes,
            session.noiseVotes,
            session.totalVotes > 0 ? (session.validVotes * 100) / session.totalVotes : 0
        );
    }

    /**
     * @dev Verifica si un votante ha votado en una sesión
     */
    function hasVoterVoted(uint256 sessionId, address voter) external view returns (bool) {
        return hasVoted[sessionId][voter];
    }

    /**
     * @dev Obtiene un voto por hash
     */
    function getVote(uint256 sessionId, bytes32 voteHash) external view returns (Vote memory) {
        require(voteExists[sessionId][voteHash], "Vote not found");
        return votes[sessionId][voteHash];
    }

    /**
     * @dev Obtiene la información del Merkle Tree
     */
    function getMerkleInfo(uint256 sessionId) external view returns (bytes32 root, bool verified) {
        root = sessions[sessionId].merkleRoot;
        verified = isRootVerified(root);
        return (root, verified);
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Genera el hash de los resultados
     */
    function _generateResultHash(uint256 sessionId) internal view returns (bytes32) {
        uint256[] memory ids = sessionCandidateIds[sessionId];
        bytes memory data;
        
        for (uint256 i = 0; i < ids.length; i++) {
            Candidate memory candidate = sessionCandidates[sessionId][ids[i]];
            data = abi.encodePacked(
                data,
                candidate.id,
                candidate.name,
                candidate.voteCount
            );
        }
        
        return keccak256(
            abi.encodePacked(
                sessionId,
                sessions[sessionId].totalVotes,
                sessions[sessionId].validVotes,
                data
            )
        );
    }

    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Reanuda el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Elimina una sesión (solo en emergencia)
     */
    function emergencyDeleteSession(uint256 sessionId) external onlyOwner {
        require(!sessions[sessionId].finalized, "Session already finalized");
        require(sessions[sessionId].totalVotes == 0, "Session has votes");
        
        delete sessions[sessionId];
        delete sessionCandidateIds[sessionId];
    }
}