# UNT Voting System

Sistema de votación universitaria con Zero-Knowledge Proofs (ZKP) y Blockchain.

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** NestJS + GraphQL
- **Contratos:** Solidity + Hardhat
- **ZKP:** Circom + SnarkJS
- **Infraestructura:** Docker + PostgreSQL + Redis

## Estructura

```
unt-voting-system/
├── apps/
│   ├── frontend/      # React + Vite
│   ├── backend/       # NestJS + GraphQL
│   └── contracts/     # Solidity + Hardhat
├── docker/            # Docker Compose + env
└── README.md
```

## Inicio rápido

```bash
# Levantar servicios con Docker
cd docker
docker compose up -d

# Frontend (desarrollo)
cd apps/frontend && npm install && npm run dev

# Backend (desarrollo)
cd apps/backend && npm install && npm run dev

# Compilar contratos
cd apps/contracts && npm install && npx hardhat compile
```
