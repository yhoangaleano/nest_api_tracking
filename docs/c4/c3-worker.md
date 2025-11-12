# C3: Diagrama de componentes (worker consumidor)

**Estado:** Aceptado
**Fecha:** 2025-11-12

## 1. Descripción

Este diagrama de nivel 3 (componentes) detalla la estructura interna del contenedor `Worker (consumidor)`.

Su responsabilidad es procesar de forma segura y resiliente los mensajes de la cola (ADR 002). Este diagrama ilustra cómo las capas de Arquitectura Limpia (ADR 001) colaboran para aplicar la lógica de negocio y persistir el resultado.

## 2. Diagrama (Mermaid)

```mermaid
%%{ init : { "theme" : "default" } }%%
C4Component
    title "Diagrama de componentes (C3) del worker (consumidor)"

    %% Contenedores externos (con los que interactúa)
    ContainerQueue(queue, "Cola de mensajes", "RabbitMQ", "Fuente de eventos de checkpoint")
    ContainerDb(db, "Base de datos", "MongoDB", "Almacén de unidades y checkpoints")

    %% Límite del contenedor worker
    System_Boundary(worker, "Worker (consumidor)") {

        %% Componente de entrada (escucha RabbitMQ)
        Component(consumer, "Checkpoint consumer", "NestJS Service", "Recibe mensajes AMQP")

        %% Componente de aplicación (orquestador)
        Component(use_case, "RegisterCheckpoint use case", "NestJS Service", "Orquesta el caso de uso")

        %% Componente de dominio (lógica pura)
        Component(entity, "Unit entity", "TypeScript Class", "Contiene la máquina de estados (ADR 004)")

        %% Abstracción e implementación de persistencia
        Component(repo_interface, "IUnitRepository", "TypeScript Interface", "Abstracción del repositorio")
        Component(repo_impl, "MongoUnit repository", "NestJS Service", "Implementación de IUnitRepository")
    }

    %% --- Relaciones (flujo de procesamiento del checkpoint) ---

    %% 1. Ingesta
    Rel(queue, consumer, "Entrega mensaje", "AMQP")

    %% 2. Orquestación
    Rel(consumer, use_case, "Usa", "Llama a execute()")

    %% 3. Lógica del caso de uso (aplicación)
    Rel(use_case, repo_interface, "Usa", "1. Carga la entidad (findByTrackingId)")
    Rel(use_case, entity, "Usa", "2. Aplica lógica de negocio (addCheckpoint)")
    Rel(use_case, repo_interface, "Usa", "3. Persiste la entidad (save)")

    %% 4. Implementación de infraestructura (ADR 001)
    Rel(repo_impl, repo_interface, "Implementa")
    Rel(repo_impl, db, "Lee y escribe", "Mongoose")
```
