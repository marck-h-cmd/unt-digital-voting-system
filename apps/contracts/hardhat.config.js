// contracts/hardhat.config.js
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-web3");

module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            evmVersion: "london"
        }
    },
    
    networks: {
        // Syscoin Mainnet
        syscoin: {
            url: "https://rpc.syscoin.org",
            chainId: 57,
            gasPrice: 20000000000, // 20 Gwei
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            timeout: 60000
        },
        
        // Syscoin Testnet
        "syscoin-testnet": {
            url: "https://rpc-testnet.syscoin.org",
            chainId: 5700,
            gasPrice: 20000000000, // 20 Gwei
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            timeout: 60000,
            testnet: true
        },
        
        // Local development
        hardhat: {
            chainId: 1337,
            gasPrice: 20000000000,
            allowUnlimitedContractSize: true
        },
        
        // Syscoin NEVM local
        "syscoin-local": {
            url: "http://localhost:8545",
            chainId: 5700,
            gasPrice: 20000000000,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
        }
    },
    
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    
    mocha: {
        timeout: 100000
    },
    
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
        gasPriceApi: "https://api.syscoin.org/api/gasPrice",
        token: "SYS",
        coinmarketcap: process.env.CMC_API_KEY,
        rst: true,
        rstNoColors: true
    },
    
    etherscan: {
        apiKey: process.env.SYSCOINSCAN_API_KEY || "your-api-key"
    }
};