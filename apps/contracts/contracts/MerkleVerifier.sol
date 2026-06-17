// contracts/contracts/MerkleVerifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title MerkleVerifier
 * @dev Verificador de Merkle Tree para votos
 */
contract MerkleVerifier {
    // ============ STRUCTS ============
    
    struct MerkleNode {
        bytes32 hash;
        bytes32 left;
        bytes32 right;
        bool isLeaf;
    }

    struct MerkleTree {
        bytes32 root;
        uint256 depth;
        uint256 leavesCount;
        mapping(uint256 => MerkleNode) nodes;
    }

    // ============ STATE VARIABLES ============
    
    mapping(bytes32 => bool) public verifiedRoots;
    mapping(bytes32 => uint256) public rootTimestamp;
    
    // ============ EVENTS ============
    
    event MerkleRootVerified(bytes32 indexed root, uint256 timestamp);
    event MerkleProofValidated(bytes32 indexed leaf, bytes32 indexed root, bool valid);
    event MerkleTreeUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot, uint256 leavesCount);

    // ============ VERIFICACIÓN ============
    
    /**
     * @dev Verifica una prueba de Merkle
     * @param proof Array de hashes de la prueba
     * @param root Raíz del Merkle Tree
     * @param leaf Hoja a verificar
     * @return true si la prueba es válida
     */
    function verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    /**
     * @dev Verifica múltiples pruebas de Merkle
     * @param proofs Array de pruebas
     * @param root Raíz del Merkle Tree
     * @param leaves Array de hojas a verificar
     * @return true si todas las pruebas son válidas
     */
    function verifyMultipleMerkleProofs(
        bytes32[][] memory proofs,
        bytes32 root,
        bytes32[] memory leaves
    ) public pure returns (bool) {
        require(proofs.length == leaves.length, "Length mismatch");
        
        for (uint256 i = 0; i < proofs.length; i++) {
            bool isValid = MerkleProof.verify(proofs[i], root, leaves[i]);
            if (!isValid) return false;
        }
        
        return true;
    }

    /**
     * @dev Verifica una prueba de Merkle con datos adicionales
     * @param proof Array de hashes de la prueba
     * @param root Raíz del Merkle Tree
     * @param leaf Hoja a verificar
     * @param data Datos adicionales
     * @return true si la prueba es válida
     */
    function verifyMerkleProofWithData(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf,
        bytes memory data
    ) public pure returns (bool) {
        // Calcular hash de los datos
        bytes32 dataHash = keccak256(data);
        bytes32 combinedLeaf = keccak256(abi.encodePacked(leaf, dataHash));
        
        return MerkleProof.verify(proof, root, combinedLeaf);
    }

    // ============ FUNCIONES DE ÁRBOL ============
    
    /**
     * @dev Construye una hoja del árbol
     * @param data Datos de la hoja
     * @return hash de la hoja
     */
    function makeLeaf(bytes memory data) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(data));
    }

    /**
     * @dev Construye una hoja del árbol con tipo
     * @param data Datos de la hoja
     * @param leafType Tipo de hoja (0: voto real, 1: ruido)
     * @return hash de la hoja
     */
    function makeTypedLeaf(bytes memory data, uint8 leafType) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(leafType, data));
    }

    /**
     * @dev Calcula el hash de un nodo padre
     * @param left Hash del hijo izquierdo
     * @param right Hash del hijo derecho
     * @return hash del nodo padre
     */
    function combineNodes(bytes32 left, bytes32 right) public pure returns (bytes32) {
        if (left < right) {
            return keccak256(abi.encodePacked(left, right));
        } else {
            return keccak256(abi.encodePacked(right, left));
        }
    }

    /**
     * @dev Calcula la raíz del árbol a partir de las hojas
     * @param leaves Array de hojas
     * @return raíz del árbol
     */
    function computeRoot(bytes32[] memory leaves) public pure returns (bytes32) {
        require(leaves.length > 0, "Empty leaves");
        
        if (leaves.length == 1) {
            return leaves[0];
        }
        
        bytes32[] memory currentLevel = leaves;
        
        while (currentLevel.length > 1) {
            bytes32[] memory nextLevel = new bytes32[]((currentLevel.length + 1) / 2);
            
            for (uint256 i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel[i / 2] = combineNodes(currentLevel[i], currentLevel[i + 1]);
                } else {
                    nextLevel[i / 2] = currentLevel[i];
                }
            }
            
            currentLevel = nextLevel;
        }
        
        return currentLevel[0];
    }

    /**
     * @dev Calcula la raíz del árbol con datos de tipo
     * @param leaves Array de hojas
     * @param leafTypes Array de tipos de hoja
     * @return raíz del árbol
     */
    function computeTypedRoot(bytes32[] memory leaves, uint8[] memory leafTypes) public pure returns (bytes32) {
        require(leaves.length == leafTypes.length, "Length mismatch");
        require(leaves.length > 0, "Empty leaves");
        
        bytes32[] memory typedLeaves = new bytes32[](leaves.length);
        
        for (uint256 i = 0; i < leaves.length; i++) {
            typedLeaves[i] = keccak256(abi.encodePacked(leafTypes[i], leaves[i]));
        }
        
        return computeRoot(typedLeaves);
    }

    // ============ FUNCIONES DE VERIFICACIÓN AVANZADA ============
    
    /**
     * @dev Verifica la integridad de un conjunto de votos
     * @param voteHashes Array de hashes de votos
     * @param voteTypes Array de tipos de voto (0: real, 1: ruido)
     * @param merkleRoot Raíz del Merkle Tree
     * @param voterAddresses Array de direcciones de votantes
     * @return true si el conjunto es válido
     */
    function verifyVoteSet(
        bytes32[] memory voteHashes,
        uint8[] memory voteTypes,
        bytes32 merkleRoot,
        address[] memory voterAddresses
    ) public view returns (bool) {
        require(voteHashes.length == voteTypes.length, "Length mismatch");
        require(voteHashes.length == voterAddresses.length, "Length mismatch");
        
        // Verificar que la raíz está registrada
        require(verifiedRoots[merkleRoot], "Root not verified");
        
        // Calcular la raíz esperada
        bytes32 expectedRoot = computeTypedRoot(voteHashes, voteTypes);
        
        if (expectedRoot != merkleRoot) return false;
        
        // Verificar que los votantes son únicos
        for (uint256 i = 0; i < voterAddresses.length; i++) {
            for (uint256 j = i + 1; j < voterAddresses.length; j++) {
                if (voterAddresses[i] == voterAddresses[j]) return false;
            }
        }
        
        return true;
    }

    /**
     * @dev Registra una raíz de Merkle como verificada
     * @param root Raíz a registrar
     */
    function registerMerkleRoot(bytes32 root) public {
        require(!verifiedRoots[root], "Root already verified");
        verifiedRoots[root] = true;
        rootTimestamp[root] = block.timestamp;
        emit MerkleRootVerified(root, block.timestamp);
    }

    /**
     * @dev Verifica que una raíz está registrada y es válida
     * @param root Raíz a verificar
     * @return true si la raíz está registrada
     */
    function isRootVerified(bytes32 root) public view returns (bool) {
        return verifiedRoots[root];
    }

    /**
     * @dev Obtiene el timestamp de una raíz
     * @param root Raíz a consultar
     * @return timestamp de la raíz
     */
    function getRootTimestamp(bytes32 root) public view returns (uint256) {
        return rootTimestamp[root];
    }

    // ============ FUNCIONES DE AUDITORÍA ============
    
    /**
     * @dev Audita un conjunto de votos
     * @param voteHashes Array de hashes de votos
     * @param voteTypes Array de tipos de voto
     * @param merkleRoot Raíz del Merkle Tree
     * @return true si la auditoría es exitosa
     */
    function auditVoteSet(
        bytes32[] memory voteHashes,
        uint8[] memory voteTypes,
        bytes32 merkleRoot
    ) public view returns (bool) {
        require(voteHashes.length > 0, "Empty vote set");
        require(voteHashes.length == voteTypes.length, "Length mismatch");
        require(verifiedRoots[merkleRoot], "Root not verified");
        
        // Contar votos reales y de ruido
        uint256 realVotes = 0;
        uint256 noiseVotes = 0;
        
        for (uint256 i = 0; i < voteTypes.length; i++) {
            if (voteTypes[i] == 0) {
                realVotes++;
            } else {
                noiseVotes++;
            }
        }
        
        // Verificar proporción (mínimo 10% de votos reales)
        require(realVotes > 0, "No real votes");
        require(noiseVotes <= realVotes * 10, "Too much noise");
        
        return true;
    }

    /**
     * @dev Verifica un voto individual contra un Merkle Tree
     * @param sessionId ID de la sesión
     * @param voteHash Hash del voto
     * @param merkleRoot Raíz del Merkle Tree
     * @param proof Prueba de Merkle
     * @return true si el voto está en el árbol
     */
    function verifyVoteInTree(
        uint256 sessionId,
        bytes32 voteHash,
        bytes32 merkleRoot,
        bytes32[] memory proof
    ) public pure returns (bool) {
        // Incluir sessionId en la hoja para evitar ataques entre sesiones
        bytes32 sessionLeaf = keccak256(abi.encodePacked(sessionId, voteHash));
        
        return MerkleProof.verify(proof, merkleRoot, sessionLeaf);
    }
}