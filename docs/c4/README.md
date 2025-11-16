# Guía de los diagramas de arquitectura (C4)

Esta sección contiene los diagramas de arquitectura del sistema de tracking, siguiendo el **modelo C4** para visualizar el software en diferentes niveles de abstracción.

Los diagramas están pensados para ser leídos en orden, desde la visión más general (contexto) hasta la más detallada (componentes).

## 1. Nivel 1: Contexto del sistema

Este diagrama muestra la visión más amplia del sistema, viéndolo como una caja negra. Se enfoca en cómo interactúa con los usuarios (actores) y otros sistemas.

- **Diagrama:** [`c1.md`](./c1.md)

## 2. Nivel 2: Contenedores

Este diagrama hace "zoom" dentro del sistema para mostrar los bloques de alto nivel que lo componen. Un "contenedor" en este contexto es una unidad desplegable o ejecutable, como una aplicación web, una base de datos o una cola de mensajes.

- **Diagrama:** [`c2.md`](./c2.md)

## 3. Nivel 3: Componentes

Estos diagramas hacen "zoom" dentro de cada contenedor para mostrar los componentes o módulos principales que los forman. Ayudan a entender cómo se estructura internamente cada aplicación.

- **API web (productor):** [`c3.md`](./c3.md)
- **Worker (consumidor):** [`c3-worker.md`](./c3-worker.md)

## 4. Nivel 4: Código

El modelo C4 incluye un cuarto nivel para diagramas de clases o código. Este nivel **se ha omitido intencionadamente**. A este grado de detalle, el propio código fuente es la mejor y más precisa fuente de verdad, y cualquier diagrama se desactualizaría rápidamente.
