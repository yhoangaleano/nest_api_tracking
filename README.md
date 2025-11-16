# API de tracking logístico

Sistema de seguimiento de paquetes construido con NestJS, implementando arquitectura limpia para procesar aproximadamente 1.21 millones de checkpoints diarios.

## Despliegue

Esta API está desplegada en Render y es accesible en:
- **API base**: [https://nest-api-tracking.onrender.com/api/v1](https://nest-api-tracking.onrender.com/api/v1)
- **Documentación Swagger**: [https://nest-api-tracking.onrender.com/api](https://nest-api-tracking.onrender.com/api)

La base de datos utilizada es MongoDB Atlas: [https://cloud.mongodb.com](https://cloud.mongodb.com)

La cola de mensajes es gestionada por CloudAMQP: [https://api.cloudamqp.com](https://api.cloudamqp.com)
**Nota importante**: Tanto Render como CloudAMQP están en tiers gratuitos, lo que significa que la aplicación o la cola de mensajes pueden apagarse debido a inactividad o límites de uso. Si experimentas problemas de acceso, por favor, contacta al administrador para su reactivación.

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
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://root:password@localhost:27017/tracking_db?authSource=admin

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672
CHECKPOINT_QUEUE_NAME=checkpoint_events

# RabbitMQ Consumer Configuration
# Prefetch count: messages processed concurrently per consumer
# - Development (single worker): 5-10
# - Production (single worker): 5
# - Production (multiple workers): 1-3
QUEUE_PREFETCH_COUNT=5

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-here
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-minimum-32-characters-long
JWT_REFRESH_EXPIRATION=7d

# Security
ALLOWED_ORIGINS=http://localhost:3001
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

### Opción 1: docker-compose (desarrollo/staging)

Para ejecutar todo el stack (API, worker, MongoDB y RabbitMQ) con Docker:

```bash
# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api worker
```

### Opción 2: docker standalone (flexible para producción)

El Dockerfile soporta dos modos de ejecución mediante la variable de entorno `ENTRY_FILE`:

**Modo API (default)** - Ejecuta el servidor HTTP con productor y consumidor:

```bash
# Construir imagen
docker build -t tracking-api .

# Ejecutar en modo API (default)
docker run -p 3000:3000 \
  -e DATABASE_URL=mongodb://... \
  -e RABBITMQ_URL=amqp://... \
  tracking-api

# O especificando explícitamente
docker run -p 3000:3000 \
  -e ENTRY_FILE=main \
  -e DATABASE_URL=mongodb://... \
  -e RABBITMQ_URL=amqp://... \
  tracking-api
```

**Modo Worker** - Ejecuta solo el consumidor de mensajes:

```bash
# Ejecutar en modo Worker (solo consumidor)
docker run \
  -e ENTRY_FILE=main.worker \
  -e DATABASE_URL=mongodb://... \
  -e RABBITMQ_URL=amqp://... \
  tracking-api
```

**Estrategia de escalado:**

```bash
# 1 instancia API + 3 instancias Worker
docker run -d -p 3000:3000 -e ENTRY_FILE=main tracking-api      # API
docker run -d -e ENTRY_FILE=main.worker tracking-api            # Worker 1
docker run -d -e ENTRY_FILE=main.worker tracking-api            # Worker 2
docker run -d -e ENTRY_FILE=main.worker tracking-api            # Worker 3
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

El proyecto sigue una estructura modular basada en los principios de **arquitectura limpia (Clean Architecture)**. Cada módulo de negocio (`auth`, `tracking`) está aislado y dividido en cuatro capas principales: `domain`, `application`, `infrastructure` y `presentation`.

```
src/
├── app.module.ts           # Módulo raíz de la aplicación
├── main.ts                 # Punto de entrada de la API (HTTP Server)
├── main.worker.ts          # Punto de entrada del Worker (Consumidor de colas)
│
├── config/                 # Configuración de la aplicación (variables de entorno, logger)
├── core/                   # Componentes transversales (filtros de excepciones, logger global)
│
├── modules/                # Contenedor de los módulos de negocio
│   │
│   ├── auth/               # Módulo de autenticación y usuarios
│   │   ├── application/    # Casos de uso (login, registro)
│   │   ├── domain/         # Entidades (User), repositorios y lógica de negocio pura
│   │   ├── infrastructure/ # Implementaciones (repositorio con MongoDB, estrategias JWT)
│   │   └── presentation/   # Capa de entrada (Controller, DTOs, Guards)
│   │
│   └── tracking/           # Módulo de seguimiento de paquetes (corazón del negocio)
│       ├── application/    # Casos de uso (registrar checkpoint, consultar historial)
│       │
│       ├── domain/         # Lógica de negocio del tracking
│       │   ├── entities/       # Entidades de negocio (Unit, Checkpoint)
│       │   ├── value-objects/  # Objetos de valor (TrackingId)
│       │   ├── repositories/   # Contratos de repositorios (IUnitRepository)
│       │   ├── ports/          # Puertos para casos de uso y comunicación externa (messaging)
│       │   ├── exceptions/     # Errores de dominio personalizados
│       │   └── configs/        # Constantes y enumeraciones del dominio (UnitState)
│       │
│       ├── infrastructure/ # Implementaciones de tecnología y servicios externos
│       │   ├── persistence/    # Repositorio con MongoDB (MongoUnitRepository)
│       │   ├── messaging/      # Productores y consumidores de RabbitMQ
│       │   └── providers/      # Inyección de dependencias para casos de uso
│       │
│       └── presentation/   # Capa de entrada para el módulo de tracking
│           ├── dtos/           # Data Transfer Objects para requests y responses
│           ├── mappers/        # Mapeadores entre DTOs y entidades de dominio
│           └── tracking.controller.ts # Controlador HTTP
│
└── shared/                 # Código compartido entre módulos
    └── domain/             # Elementos de dominio transversales (ej. DomainException base)

docs/
├── adr/                    # Architecture Decision Records (decisiones de diseño)
└── c4/                     # Diagramas de arquitectura (Contexto, Contenedores, etc.)
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

1. **Domain** (dominio): Lógica de negocio pura, entidades, errores de dominio.
2. **Application** (aplicación): Casos de uso que orquestan el flujo.
3. **Infrastructure** (infraestructura): Implementaciones concretas de tecnología (repositorios, colas).
4. **Presentation** (presentación): Capa de entrada y salida (controllers, DTOs).

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

Consulta los documentos en [`docs/adr/`](./docs/adr) para más detalles sobre las decisiones de diseño clave:

- **ADR-001**: Arquitectura limpia con NestJS.
- **ADR-002**: Cola de mensajes para garantía de entrega.
- **ADR-003**: MongoDB con checkpoints embebidos.
- **ADR-004**: Máquina de estados para consistencia de datos.
- **ADR-005**: Sin caché para simplificar la arquitectura inicial.
- **ADR-006**: Colocación del productor y consumidor en el mismo servicio.

Consulta la [guía de los diagramas de arquitectura (C4)](./docs/c4/README.md) para entender mejor la estructura del sistema.

## Detalles de la implementación

Esta sección cubre decisiones de implementación internas que son útiles para los desarrolladores que trabajan en el proyecto.

### Versionado de la API

El versionado de la API se gestiona a través de la URL. La versión actual es la **v1**, y todos los endpoints están prefijados con `/api/v1`.

### Gestión de la configuración

La aplicación utiliza el `ConfigModule` de NestJS para gestionar las variables de entorno.

- **Carga**: Las variables se cargan desde un fichero `.env` que sobreescribe los valores por defecto.
- **Validación**: El fichero `src/config/env.validation.ts` utiliza `Joi` para validar que todas las variables de entorno requeridas estén presentes y sean del tipo correcto durante el arranque. Si falta una variable o es inválida, la aplicación no se iniciará.

### Manejo de errores

El proyecto tiene una estrategia centralizada para el manejo de errores mediante filtros de excepciones globales, definidos en `src/core/filters`:

- **`AllExceptionsFilter`**: Captura cualquier excepción no controlada para asegurar que el servidor siempre devuelva una respuesta JSON estructurada en lugar de un error HTML.
- **`DomainExceptionFilter`**: Captura las excepciones de dominio personalizadas (clases que heredan de `DomainException`). Esto permite lanzar errores de negocio desde la capa de dominio (ej. `UnitNotFoundError`) y traducirlos automáticamente a respuestas HTTP apropiadas (ej. `404 Not Found`).
- **`HttpExceptionFilter`**: Captura las excepciones propias de NestJS (ej. `NotFoundException`) para centralizar el logging.

### Logging

Se utiliza **Winston** para un logging estructurado y configurable. La configuración se encuentra en `src/config/logger.config.ts`.

- **Formato**: En desarrollo, los logs se imprimen en consola con colores para facilitar la lectura. En producción, se utiliza un formato JSON que es ideal para ser ingerido por sistemas de monitorización.
- **Niveles**: Se utilizan los niveles estándar (`debug`, `info`, `warn`, `error`).
- **Contexto**: Cada log incluye el contexto (ej. el nombre de la clase) desde donde fue emitido, facilitando la trazabilidad.

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

- `CREATED` → `DELIVERED` (falta el estado intermedio) ---> Rechazado
- `CREATED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED` ---> Aceptado
