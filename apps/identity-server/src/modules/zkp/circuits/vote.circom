// backend/src/modules/zkp/circuits/vote.circom
pragma circom 2.1.6;

include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

// Circuito de verificación de voto
template VoteVerification(n) {
    // Inputs privados
    signal input voterId[n];        // ID del votante (hash)
    signal input candidateId[n];    // ID del candidato
    signal input sessionId[n];      // ID de la sesión
    signal input timestamp[n];      // Timestamp del voto
    signal input random[n];         // Random para anonimato
    
    // Inputs públicos
    signal input publicVoterHash[n];    // Hash público del votante
    signal input publicVoteHash[n];     // Hash del voto
    
    // Verificar que el votante está autorizado
    component voterCheck = Poseidon(n * 2);
    for (var i = 0; i < n; i++) {
        voterCheck.inputs[i] <== voterId[i];
        voterCheck.inputs[n + i] <== publicVoterHash[i];
    }
    voterCheck.out === 1;
    
    // Calcular hash del voto
    component voteHash = Poseidon(n * 4);
    for (var i = 0; i < n; i++) {
        voteHash.inputs[i] <== voterId[i];
        voteHash.inputs[n + i] <== candidateId[i];
        voteHash.inputs[2*n + i] <== sessionId[i];
        voteHash.inputs[3*n + i] <== timestamp[i];
    }
    
    // Verificar hash del voto
    component hashCheck = IsEqual(n);
    for (var i = 0; i < n; i++) {
        hashCheck.in[i] <== voteHash.out[i];
    }
    hashCheck.b <== 1;
    
    // Verificar timestamp (voto en tiempo permitido)
    component timeCheck = LessThan(n);
    for (var i = 0; i < n; i++) {
        timeCheck.in[i] <== timestamp[i];
    }
    timeCheck.b <== 1735689600; // 31/12/2024
}

component main = VoteVerification(64);