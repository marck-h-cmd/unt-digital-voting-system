// contracts/scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Election Contract to Syscoin NEVM...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📡 Deploying with account: ${deployer.address}`);
    console.log(`💰 Account balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} SYS`);
    
    // Deploy ZKPVerifier
    console.log("\n📝 Deploying ZKPVerifier...");
    const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
    const zkpVerifier = await ZKPVerifier.deploy();
    await zkpVerifier.deployed();
    console.log(`✅ ZKPVerifier deployed at: ${zkpVerifier.address}`);
    
    // Deploy Election
    console.log("\n📝 Deploying Election...");
    const Election = await hre.ethers.getContractFactory("Election");
    const election = await Election.deploy();
    await election.deployed();
    console.log(`✅ Election deployed at: ${election.address}`);
    
    // Guardar direcciones
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        electionAddress: election.address,
        zkpVerifierAddress: zkpVerifier.address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        gasPrice: hre.ethers.utils.formatUnits(
            await hre.ethers.provider.getGasPrice(),
            "gwei"
        ),
        sysscanUrl: `https://sysscan.io/address/${election.address}`
    };
    
    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentPath, fileName),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n📄 Deployment info saved to:", fileName);
    console.log(`🔗 View on Sysscan: ${deploymentInfo.sysscanUrl}`);
    
    // Mostrar estadísticas de gas
    console.log("\n⛽ Gas Stats:");
    console.log(`   Gas Price: ${deploymentInfo.gasPrice} Gwei`);
    console.log(`   Estimated cost: ~${await estimateDeploymentCost(election)} SYS`);
    
    return deploymentInfo;
}

async function estimateDeploymentCost(contract) {
    const tx = await contract.deployTransaction;
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed;
    const gasPrice = await hre.ethers.provider.getGasPrice();
    const cost = gasUsed.mul(gasPrice);
    return hre.ethers.utils.formatEther(cost);
}

// Ejecutar deploy
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });