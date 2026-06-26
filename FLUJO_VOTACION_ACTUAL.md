# Flujo de Votación y Arquitectura Actual

Este documento describe cómo funciona el sistema de votación universitario UNT en su estado actual, operando con componentes reales, conectividad a la blockchain y garantizando **Verificabilidad de Extremo a Extremo (E2E-V)**.

---

## 🗳️ Flujo de Votación Actual (Paso a Paso)

1. **Inicio del Sistema**
   - El usuario abre la aplicación web (Frontend).
   - Se muestra la página principal con el botón de inicio del proceso de votación.

2. **Validación de Identidad**
   - El usuario ingresa sus credenciales de estudiante o docente (DNI o Carnet Universitario).
   - El frontend envía la solicitud de validación al Backend.
   - El Backend verifica las credenciales en la base de datos de la unt.
   - Si es válido, genera un token JWT temporal y un `nullifierHash` para evitar doble votación.
   - Devuelve el token al frontend para habilitar la sesión de votación.

3. **Acceso a la Urna**
   - El frontend asegura la sesión con el token recibido.
   - Se despliega la urna de votación mostrando la lista real de candidatos obtenidos desde el backend.

4. **Votación (Zero-Knowledge Proof)**
   - El usuario selecciona un candidato y emite su voto.
   - El frontend genera una prueba criptográfica Zero-Knowledge Proof (ZKP) para garantizar el anonimato.
   - Envía el voto y la prueba ZKP al Backend.

5. **Registro y Consenso Blockchain**
   - El Backend recibe el voto, valida la prueba ZKP y el `nullifierHash` para asegurar que el voto es único y válido sin revelar la identidad.
   - El voto se almacena en PostgreSQL y se actualiza el estado en Redis.
   - El Backend interactúa con los Smart Contracts para registrar el voto (o el Merkle Root del lote de votos) en la Blockchain de Syscoin y guardar la evidencia (manifest) en IPFS.
   - Se genera un hash de transacción que sirve como recibo inmutable.

6. **Recibo de Voto y Garantía E2E-V (End-to-End Verifiability)**
   - El backend devuelve el hash de la transacción al frontend.
   - El usuario visualiza su recibo de voto garantizado por la blockchain.
   - **Garantía E2E-V**: Con este recibo, el votante puede verificar matemáticamente de forma independiente que su voto fue registrado y contabilizado correctamente en la blockchain pública de Syscoin, sin depender de la confianza en los administradores del sistema, asegurando una auditabilidad total.

7. **Soporte y Consultas (Opcional)**
   - El usuario puede interactuar con el Telegram Bot para resolver dudas sobre el proceso electoral a través de inteligencia artificial.

---

## 🏗️ Arquitectura del Sistema Actual (Diagrama ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ 
│                          SISTEMA DE VOTACIÓN UNIVERSITARIA - ARQUITECTURA REAL                              │ 
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
│                                                                                                             │ 
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐  │ 
│  │                              FRONTEND (React + TypeScript)                                            │  │ 
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              │  │ 
│  │  │   Validación     │  │  Urna de Votos   │  │  Recibo de Voto  │  │ Generación ZKP   │              │  │ 
│  │  │   Identidad      │  │  (Candidatos)    │  │  (Hash de Voto)  │  │ (Cliente)        │              │  │ 
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘              │  │ 
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘  │ 
│                                             │                                                             │ 
│                                             ▼                                                             │ 
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐  │ 
│  │                      BACKEND (NestJS + GraphQL)                                                      │  │ 
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │  │ 
│  │  │                           MÓDULOS PRINCIPALES                                                   │   │  │ 
│  │  │                                                                                                 │   │  │ 
│  │  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐           │   │  │ 
│  │  │  │   Identity Module       │  │  Voting Module         │  │  Blockchain Contracts  │           │   │  │ 
│  │  │  │ (Validación BD Local)   │  │ (Gestión de Votos ZKP) │  │ (Integración Syscoin)  │           │   │  │ 
│  │  │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘           │   │  │ 
│  │  └─────────────────────────────────────────────────────────────────────────────────────────────┘   │  │ 
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘  │ 
│                    │                             │                             │                           │ 
│                    ▼                             ▼                             ▼                           │ 
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────┐ │ 
│  │     PostgreSQL (Puerto 5432)     │  │     Redis (Puerto 6379)         │  │   SYSCOIN BLOCKCHAIN    │ │ 
│  │  Base de datos principal         │  │  Almacenamiento temporal y      │  │   + IPFS                │ │ 
│  │  (Estudiantes, Candidatos, Votos)│  │  caché de sesiones              │  │  (Registro Inmutable)   │ │ 
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────┘ │ 
│                                                                                                             │ 
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐  │ 
│  │                              TELEGRAM BOT (Python)                                                    │  │ 
│  │  • Responde FAQs sobre el sistema de votación (LLM)                                                    │  │ 
│  │  • Asistencia al votante                                                                               │  │ 
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘  │ 
│                                                                                                             │ 
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Servicios Activos

| Servicio | Descripción |
|----------|-------------|
| **Frontend** | Aplicación web para la interacción del votante (React) |
| **Backend** | API central y orquestador del proceso (NestJS) |
| **PostgreSQL** | Base de datos relacional para el padrón electoral y registro estructurado |
| **Redis** | Almacenamiento en memoria rápida para el estado de la sesión |
| **Syscoin Blockchain & IPFS** | Contratos inteligentes y almacenamiento descentralizado para inmutabilidad del voto |
| **Telegram Bot** | Asistente conversacional de soporte al votante |

