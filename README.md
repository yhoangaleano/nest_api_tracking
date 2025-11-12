# API de tracking logístico

Sistema de seguimiento de paquetes construido con NestJS, implementando arquitectura limpia para procesar aproximadamente 1.21 millones de checkpoints diarios.

## Requisitos previos

- **Node.js**: v18+ (ver [.nvmrc](./nvmrc))
- **Docker**: Para MongoDB y RabbitMQ
- **Docker Compose**: Para levantar servicios

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd nestjs-tracking-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con las siguientes variables:

```ini
# Puerto de la API
PORT=3000

# Conexión a MongoDB
DATABASE_URL=mongodb://root:password@localhost:27017/tracking_db?authSource=admin

# Conexión a RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672

# Nombre de la cola
CHECKPOINT_QUEUE_NAME=checkpoint_events

# JWT secret (producción)
JWT_SECRET=your-secret-key-here
```

### 4. Levantar servicios con Docker

```bash
docker-compose up -d mongo rabbitmq
```

Esto iniciará:
- **MongoDB** en `localhost:27017`
- **RabbitMQ** en `localhost:5672`
- **RabbitMQ Management UI** en `http://localhost:15672` (user: `user`, password: `password`)

## Ejecución en desarrollo

El proyecto requiere dos procesos ejecutándose simultáneamente: la API y el worker consumidor.

### Terminal 1: API (productor)

```bash
npm run start:dev
```

La API estará disponible en:

- **API base**: `http://localhost:3000`
- **Documentación Swagger**: `http://localhost:3000/api`

### Terminal 2: Worker (consumidor)

```bash
npm run start:worker
```

El worker procesará los mensajes de la cola `checkpoint_events`.

## Ejecución en producción

Para ejecutar todo el stack (API, worker, MongoDB y RabbitMQ) con Docker:

```bash
# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api worker
```

## Pruebas

```bash
# Ejecutar tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests e2e (requiere servicios corriendo)
npm run test:e2e

# Linter
npm run lint

# Formatear código
npm run p:fix
```

## Endpoints principales

### Autenticación

**POST** `/api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Respuesta:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Checkpoints

**POST** `/api/v1/checkpoints`

Requiere autenticación con Bearer Token.

```json
{
  "trackingId": "T-ABC-12345",
  "status": "PICKED_UP",
  "location": "BODEGA_PRINCIPAL_MED",
  "timestamp": "2025-11-10T14:30:00Z",
  "notes": "Paquete recogido por transportista"
}
```

Respuesta: `202 Accepted`

```json
{
  "message": "Checkpoint received and queued for processing."
}
```

Estados válidos:

- `CREATED`
- `PICKED_UP`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `FAILED`

### Consultas

**GET** `/api/v1/tracking/:trackingId`

Obtiene el historial completo de un paquete.

Respuesta: `200 OK`

```json
{
  "id": "60d0f1b9b5f5f4001f0b1a0e",
  "trackingId": "T-ABC-12345",
  "currentState": "PICKED_UP",
  "checkpoints": [
    {
      "status": "CREATED",
      "timestamp": "2025-11-10T10:00:00Z",
      "location": "System",
      "notes": "Guía registrada"
    },
    {
      "status": "PICKED_UP",
      "timestamp": "2025-11-10T14:30:00Z",
      "location": "BODEGA_PRINCIPAL_MED",
      "notes": "Paquete recogido"
    }
  ]
}
```

**GET** `/api/v1/shipments?status=IN_TRANSIT`

Lista unidades por estado. Requiere autenticación.

Respuesta: `200 OK`

```json
[
  {
    "id": "60d0f1b9b5f5f4001f0b1a1c",
    "trackingId": "T-XYZ-67890",
    "currentState": "IN_TRANSIT"
  }
]
```

## Estructura del proyecto

```
src/
├── config/                 # Configuraciones (Winston, etc.)
├── core/                   # Servicios globales (Logger, Filters)
├── modules/
│   ├── auth/              # Autenticación (JWT)
│   │   ├── domain/        # Entidades, errores
│   │   ├── application/   # Casos de uso
│   │   ├── infrastructure/# Repositorio MongoDB
│   │   └── presentation/  # Controllers, DTOs, Guards
│   └── tracking/          # Tracking de paquetes
│       ├── domain/        # Unit entity, máquina de estados
│       ├── application/   # Casos de uso
│       ├── infrastructure/# Repositorio y RabbitMQ
│       └── presentation/  # Controllers, DTOs
├── app.module.ts          # Módulo principal
├── main.ts                # Entry point de la API
└── main.worker.ts         # Entry point del worker

docs/
├── adr/                   # Architecture Decision Records
└── c4/                    # Diagramas de arquitectura C4
```

## Stack tecnológico

- **Framework**: NestJS 10
- **Lenguaje**: TypeScript 5
- **Base de datos**: MongoDB con Mongoose
- **Cola de mensajes**: RabbitMQ
- **Autenticación**: JWT con Passport
- **Logging**: Winston
- **Validación**: class-validator, class-transformer
- **Testing**: Jest
- **Linting**: ESLint, Prettier

## Arquitectura

El proyecto implementa **arquitectura limpia** con 4 capas:

1. **Domain** (dominio): Lógica de negocio pura, entidades, errores de dominio
2. **Application** (aplicación): Casos de uso, orquestación
3. **Infrastructure** (infraestructura): Repositorios MongoDB, productores RabbitMQ
4. **Presentation** (presentación): Controllers HTTP, DTOs, validaciones

### Flujo asíncrono

```
POST /checkpoints → API valida → Publica en RabbitMQ (202 Accepted)
                                        ↓
                                    Worker consume
                                        ↓
                                Aplica lógica de negocio
                                        ↓
                                Persiste en MongoDB
```

### Decisiones arquitectónicas

Consulta los documentos en [`docs/adr/`](./docs/adr) para más detalles:

- **ADR-001**: Arquitectura limpia con NestJS
- **ADR-002**: Cola de mensajes para garantía de entrega
- **ADR-003**: MongoDB con checkpoints embebidos
- **ADR-004**: Máquina de estados para consistencia
- **ADR-005**: Sin caché para simplificar

## Scripts disponibles

```bash
# Desarrollo
npm run start:dev          # API en modo desarrollo
npm run start:worker       # Worker en modo desarrollo
npm run build              # Compilar TypeScript

# Producción
npm run start:prod         # API en producción
npm run start:worker:prod  # Worker en producción

# Testing
npm test                   # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end

# Calidad de código
npm run lint               # Ejecutar ESLint
npm run lint:fix           # Corregir errores de ESLint
npm run p:fix              # Formatear con Prettier
```

## Troubleshooting

### El worker no procesa mensajes

Verifica que RabbitMQ esté corriendo:

```bash
docker-compose ps
```

Revisa los logs del worker:

```bash
npm run start:worker
```

### Errores de conexión a MongoDB

Verifica la URL en `.env`:

```bash
DATABASE_URL=mongodb://root:password@localhost:27017/tracking_db?authSource=admin
```

Asegúrate de que MongoDB esté corriendo:

```bash
docker-compose ps mongo
```

### Error: Invalid state transition

El sistema rechaza transiciones de estado inválidas. Ejemplo:
- ❌ `CREATED` → `DELIVERED` (falta el estado intermedio)
- ✅ `CREATED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`

## Licencia

MIT
