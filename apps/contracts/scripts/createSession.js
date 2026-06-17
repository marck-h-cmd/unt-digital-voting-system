// contracts/scripts/createSession.js
const hre = require("hardhat");

async function main() {
    console.log("📝 Creating voting session...");
    
    const electionAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    const Election = await hre.ethers.getContractFactory("Election");
    const election = Election.attach(electionAddress);
    
    // Configuración de la sesión
    const sessionName = "Elecciones Universitarias UNT 2024";
    const sessionDescription = "Votación para representantes estudiantiles UNT";
    const startTime = Math.floor(Date.now() / 1000) + 3600; // En 1 hora
    const endTime = startTime + 7 * 24 * 60 * 60; // 7 días después
    
    // Candidatos
    const candidateNames = [
        "Ana Martínez",
        "Carlos López", 
        "María García",
        "Juan Pérez"
    ];
    
    const candidateParties = [
        "Frente Universitario",
        "Movimiento Estudiantil",
        "Unión Democrática",
        "Coalición Progresista"
    ];
    
    const candidateDescriptions = [
        "Estudiante de Ingeniería, comprometida con la transparencia",
        "Estudiante de Derecho, experto en políticas educativas",
        "Estudiante de Medicina, enfocada en bienestar estudiantil",
        "Estudiante de Economía, especialista en finanzas universitarias"
    ];
    
    const candidatePhotos = [
        "QmX4xPTnq4WqgG5P5QKd8kpjZHyv6DnVd4Q6bGkPpVRtE",
        "QmY5yQUnr5XrH6R6SLe9lkqkZIzA7EoWe5R7cHlQqWSsF",
        "QmZ6zRVo6YsI7T7TMe0mlrLzJAB8FpXf6S8dImRrXTtG",
        "QmA7aSWp7ZtJ8U8UNf1nmsMaKB C9GqYg7T9eJnSsYUuH"
    ];
    
    const tx = await election.createSession(
        sessionName,
        sessionDescription,
        startTime,
        endTime,
        candidateNames,
        candidateParties,
        candidateDescriptions,
        candidatePhotos
    );
    
    const receipt = await tx.wait();
    console.log(`✅ Session created with tx: ${receipt.transactionHash}`);
    
    // Obtener el ID de la sesión
    const sessionId = await election.currentSessionId();
    console.log(`📋 Session ID: ${sessionId}`);
    console.log(`🔗 View on Sysscan: https://sysscan.io/tx/${receipt.transactionHash}`);
    
    console.log("\n📊 Session details:");
    console.log(`   Name: ${sessionName}`);
    console.log(`   Start: ${new Date(startTime * 1000).toLocaleString()}`);
    console.log(`   End: ${new Date(endTime * 1000).toLocaleString()}`);
    console.log(`   Candidates: ${candidateNames.length}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });