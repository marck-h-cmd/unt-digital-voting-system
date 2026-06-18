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

## Rutas Protegidas y Acceso de Administración

Las vistas críticas del sistema de gestión y auditoría están resguardadas tras una capa de autenticación administrativa:

* **Rutas Protegidas:**
  * `/dashboard` (Visualización en tiempo real y estadísticas del sistema)
  * `/audit` (Verificación de integridad de los bloques de votación)
  * `/admin` (Creación de sesiones, registro de candidatos y manejo del árbol de Merkle)
* **Acceso:** Se puede acceder a través de la ruta `/login` o pulsando el botón **"Acceso Admin"** en la barra de navegación superior.
* **Credenciales de Administrador por Defecto:**
  * **Usuario:** `admin`
  * **Contraseña:** `admin123`

Al iniciar sesión exitosamente, se almacena un token administrativo en `localStorage` que habilita dinámicamente las rutas protegidas y actualiza la barra de navegación para mostrar los enlaces correspondientes y la opción **"Salir Admin"**.

## Proceso de Votación para el Votante

El flujo completo del votante para emitir su sufragio de forma segura, anónima y auditable es el siguiente:

1. **Conexión de la Wallet:**
   * El votante ingresa a la aplicación web principal y hace clic en **"Conectar Wallet"**.
   * Conecta su wallet preferida (por ejemplo, **Pali Wallet** o cualquier wallet compatible mediante WalletConnect) en la red *Syscoin Testnet (Tanenbaum)*.

2. **Verificación de Elegibilidad:**
   * El sistema interactúa con el backend para verificar si la dirección de la wallet del votante está registrada en el padrón electoral universitario autorizado de la sesión de votación activa.
   * Dicha validación se realiza mediante un **árbol de Merkle**. El backend genera la prueba de membresía (*Merkle Proof*) para la dirección del votante.

3. **Generación de la Prueba de Conocimiento Cero (ZKP) (Local):**
   * A fin de preservar el anonimato absoluto, el navegador del votante procesa localmente con *snarkjs* y el circuito *Circom* una prueba de conocimiento cero (ZKP).
   * Esta prueba certifica de manera criptográfica que el votante posee una credencial válida contenida en la raíz pública del árbol de Merkle cargada en el contrato inteligente, **sin revelar** la clave pública de su wallet ni su identidad real.

4. **Firma del Voto (EIP-712):**
   * El votante firma digitalmente desde su wallet un mensaje estructurado que contiene:
     * El hash del voto (*voteHash*).
     * El ID de la sesión electoral.
     * El ID del candidato seleccionado.
   * Esto proporciona prueba matemática e innegable de la intención del votante.

5. **Transmisión e Inserción On-Chain:**
   * Se envía la transacción al contrato inteligente `Election.sol` desplegado en la blockchain de Syscoin. El contrato realiza las siguientes validaciones en orden estricto:
     1. **Unicidad:** Verifica que la dirección no haya votado previamente en la sesión actual (`hasVoted[sessionId][msg.sender] == false`).
     2. **Verificación ZKP:** Ejecuta el método `verifyZKP(...)` importado de `ZKPVerifier` para confirmar que la prueba ZK local es válida.
     3. **Verificación del Árbol de Merkle:** Ejecuta `verifyMerkleProof(...)` para confirmar que el hash del voto pertenece a la raíz autorizada.
     4. **Verificación de Firma:** Recupera al firmante utilizando la firma EIP-712 provista para certificar que coincide con quien ejecuta la transacción.
   * Si las pruebas pasan, el contrato marca la dirección como "ha votado", incrementa las estadísticas y registra el voto de manera completamente anónima e inmutable.

6. **Auditoría e Integridad:**
   * Tras la emisión del voto, la aplicación muestra una confirmación con un *hash de verificación único*.
   * El votante puede ingresar a `/verify/:voteHash` en cualquier momento para comprobar que su voto fue correctamente registrado en el árbol de Merkle y almacenado sin modificaciones en la blockchain de Syscoin.

