# API de tracking logístico

Sistema de seguimiento de paquetes construido con NestJS, implementando arquitectura limpia para procesar checkpoints de envíos.

## Stack tecnológico

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript 5
- **Base de datos**: PostgreSQL 16 con TypeORM
- **Cache**: Redis 7
- **Autenticación**: JWT con Passport
- **Logging**: Winston
- **Validación**: class-validator, class-transformer
- **Testing**: Jest + Testcontainers
- **Linting**: ESLint, Prettier

## Requisitos previos

- **Node.js**: v18+ (ver [.nvmrc](./.nvmrc))
- **Docker**: Para PostgreSQL y Redis
- **Docker Compose**: Para levantar servicios

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd nest_api_tracking
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

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=tracking_user
POSTGRES_PASSWORD=tracking_pass
POSTGRES_DATABASE=tracking_db
POSTGRES_SYNC=false  # true solo en desarrollo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600
REDIS_PASSWORD=

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
docker-compose up -d postgres redis
```

Esto iniciará:

- **PostgreSQL** en `localhost:5432`
- **Redis** en `localhost:6379`

## Ejecución

### Desarrollo

```bash
npm run start:dev
```

La API estará disponible en:

- **API base**: `http://localhost:3000/api/v1`
- **Documentación Swagger**: `http://localhost:3000/api`

### Producción con Docker

Para ejecutar todo el stack (API, PostgreSQL y Redis) con Docker:

```bash
# Construir y levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api
```

### Producción standalone

```bash
# Construir
npm run build

# Ejecutar
npm run start:prod
```

## Pruebas

### Pruebas unitarias

```bash
# Ejecutar todos los tests unitarios
npm test

# Tests en modo watch
npm run test:watch

# Tests con reporte de cobertura
npm run test:cov
```

### Pruebas E2E

Las pruebas end-to-end utilizan **Testcontainers** para PostgreSQL.

```bash
npm run test:e2e
```

**Requisitos:**

- Docker instalado y corriendo

### Calidad de código

```bash
# Ejecutar linter
npm run lint

# Formatear con Prettier
npm run format
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

**Estados válidos:**

- `CREATED` - Estado inicial del paquete
- `PICKED_UP` - Paquete recogido en origen
- `IN_TRANSIT` - En tránsito hacia destino
- `AT_FACILITY` - En instalación de distribución
- `OUT_FOR_DELIVERY` - En reparto final
- `DELIVERED` - Entregado exitosamente (estado terminal)

**Estados de excepción:**

- `PICKED_UP_EXCEPTION` - Problema en la recogida
- `IN_TRANSIT_EXCEPTION` - Problema en tránsito
- `AT_FACILITY_EXCEPTION` - Problema en instalación
- `OUT_FOR_DELIVERY_EXCEPTION` - Problema en reparto

**Transiciones válidas:**

- CREATED → PICKED_UP
- PICKED_UP → IN_TRANSIT | PICKED_UP_EXCEPTION
- IN_TRANSIT → AT_FACILITY | IN_TRANSIT_EXCEPTION
- AT_FACILITY → OUT_FOR_DELIVERY | AT_FACILITY_EXCEPTION
- OUT_FOR_DELIVERY → DELIVERED | OUT_FOR_DELIVERY_EXCEPTION

**Recuperación desde excepciones:**

- PICKED_UP_EXCEPTION → PICKED_UP | IN_TRANSIT
- IN_TRANSIT_EXCEPTION → IN_TRANSIT | AT_FACILITY
- AT_FACILITY_EXCEPTION → AT_FACILITY | OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY_EXCEPTION → OUT_FOR_DELIVERY | DELIVERED

### Consultas

**GET** `/api/v1/tracking/:trackingId`

Obtiene el historial completo de un paquete.

**GET** `/api/v1/shipments?status=IN_TRANSIT`

Lista unidades por estado. Requiere autenticación.

## Estructura del proyecto

El proyecto sigue una estructura modular basada en **Clean Architecture (Hexagonal)**:

```text
src/
├── main.ts                 # Punto de entrada de la API
├── app.module.ts           # Módulo raíz
│
├── config/                 # Configuración (variables de entorno, logger)
├── core/                   # Componentes transversales (filtros, logger global)
│
├── modules/
│   ├── auth/               # Módulo de autenticación
│   │   ├── application/    # Casos de uso
│   │   ├── domain/         # Entidades y lógica de negocio
│   │   ├── infrastructure/ # Repositorio PostgreSQL, JWT
│   │   └── presentation/   # Controller, DTOs, Guards
│   │
│   └── tracking/           # Módulo de seguimiento
│       ├── domain/         # Entidades, Value Objects, Ports
│       ├── application/    # Casos de uso
│       ├── infrastructure/ # Repositorio PostgreSQL, Cache Redis
│       └── presentation/   # Controller, DTOs, Mappers
│
└── shared/                 # Código compartido

docs/
├── adr/                    # Architecture Decision Records
└── c4/                     # Diagramas de arquitectura
```

## Arquitectura

### Capas y responsabilidades

1. **Domain** (núcleo):
   - Entidades y Value Objects con validación
   - Ports (interfaces) para repositorios y servicios externos
   - Excepciones de dominio

2. **Application** (orquestación):
   - Casos de uso que implementan los Input Ports
   - Coordinan el flujo entre capas

3. **Infrastructure** (adaptadores):
   - Repositorios con PostgreSQL/TypeORM
   - Cache con Redis
   - Providers de inyección de dependencias

4. **Presentation** (entrada HTTP):
   - Controllers REST
   - DTOs y Mappers

### Principios aplicados

- **Dependency Rule**: Las dependencias apuntan hacia el dominio
- **Ports & Adapters**: El dominio define interfaces, la infraestructura las implementa
- **DDD con Value Objects**: Objetos inmutables con validación de negocio

## Scripts disponibles

```bash
# Desarrollo
npm run start:dev          # API en modo desarrollo
npm run build              # Compilar TypeScript

# Producción
npm run start:prod         # API en producción

# Testing
npm test                   # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end

# Calidad de código
npm run lint               # Ejecutar ESLint
npm run format             # Formatear con Prettier

# Migraciones
npm run migrate:data       # Migrar datos (si aplica)
```

## Detalles de implementación

### Versionado de la API

Todos los endpoints están prefijados con `/api/v1`.

### Gestión de configuración

La aplicación utiliza `ConfigModule` de NestJS con validación mediante `Joi` en `src/config/env.validation.ts`.

### Manejo de errores

Filtros de excepciones globales en `src/core/filters`:

- **AllExceptionsFilter**: Captura excepciones no controladas
- **DomainExceptionFilter**: Traduce errores de dominio a respuestas HTTP
- **HttpExceptionFilter**: Centraliza el logging de excepciones HTTP

### Logging

Winston con formato estructurado:

- Desarrollo: Logs con colores en consola
- Producción: Formato JSON para sistemas de monitorización

### Cache

Redis se utiliza para cachear consultas frecuentes como el historial de tracking, mejorando el rendimiento de lectura.

## Troubleshooting

### Errores de conexión a PostgreSQL

Verifica que el servicio esté corriendo:

```bash
docker-compose ps postgres
```

Verifica las credenciales en `.env`.

### Errores de conexión a Redis

```bash
docker-compose ps redis
```

### Error: Invalid state transition

El sistema valida las transiciones de estado. Ejemplo:

- `CREATED` → `DELIVERED` (inválido - falta estados intermedios)
- `CREATED` → `PICKED_UP` → `IN_TRANSIT` → `AT_FACILITY` → `OUT_FOR_DELIVERY` → `DELIVERED` (válido)

### Tablas no creadas

En desarrollo, asegúrate de tener `POSTGRES_SYNC=true` en `.env`. En producción, usa migraciones.
