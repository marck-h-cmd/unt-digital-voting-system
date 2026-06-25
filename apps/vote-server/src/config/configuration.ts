// backend/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "unt_voting",
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || "",
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  syscoin: {
    rpcUrl: process.env.SYSCOIN_RPC_URL || "https://rpc.tanenbaum.io",
    network: process.env.SYSCOIN_NETWORK || "testnet",
    contractAddress: process.env.CONTRACT_ADDRESS,
    gasPrice: process.env.SYSCOIN_GAS_PRICE || "20",
    privateKey: process.env.PRIVATE_KEY,
  },

  ipfs: {
    host: process.env.IPFS_HOST || "localhost",
    port: parseInt(process.env.IPFS_PORT, 10) || 5001,
    gateway: process.env.IPFS_GATEWAY || "https://gateway.ipfs.io",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "supersecret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },

  rateLimiter: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },

  zkp: {
    wasmPath: process.env.ZKP_WASM_PATH || "circuits/vote.wasm",
    zkeyPath: process.env.ZKP_ZKEY_PATH || "circuits/vote.zkey",
    vkeyPath: process.env.ZKP_VKEY_PATH || "circuits/vote.vkey.json",
  },

  voting: {
    noiseRatio: parseInt(process.env.NOISE_RATIO, 10) || 10,
    maxVotesPerSession:
      parseInt(process.env.MAX_VOTES_PER_SESSION, 10) || 10000,
  },
});
