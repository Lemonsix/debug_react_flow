# Tournament Graph Editor - Project Brief

## Objetivo Principal
Convertir el visualizador actual de grafos de torneos en un editor interactivo completo que permita diseñar flujos de torneos mediante una interfaz visual usando React Flow.

## Contexto del Proyecto
- **Base actual**: Visualizador de grafos de torneos usando React Flow y Dagre para layout
- **Tecnologías**: React, TypeScript, React Flow, Tailwind CSS, Dagre
- **Arquitectura**: Frontend con tipos bien definidos para nodos, edges y grafos

## Funcionalidades Requeridas

### 1. Nodos Editables
- Convertir nodos en formularios interactivos
- Configurar tipo de nodo: `match`, `aggregator`, `sink`
- Ajustar número de slots (N slots por nodo)
- Para nodos `sink`: configurar subtipo (descalificación, calificación, podio)

### 2. Edges con Condiciones
- Edges editables con formularios
- Condiciones de victoria/derrota
- Operadores: `puntos >= n`, `puntos <= n`
- Filtrado lógico para dirigir flujo entre nodos

### 3. Creación Interactiva
- Agregar nuevos nodos al grafo
- Conectar nodos arrastrando entre handles
- Eliminar nodos y edges existentes

### 4. Persistencia
- Botón de guardado global
- Exportar configuración completa como JSON
- Mantener compatibilidad con estructura existente

## Flujo de Trabajo
1. Los equipos se colocan en nodos `match`
2. Disputan el match según reglas del nodo
3. Los resultados se filtran por condiciones de edges
4. Fluyen hacia otros nodos `match`, `aggregator` o `sink`
5. Los `sink` son terminales finales del torneo

## Consideraciones Técnicas
- Mantener tipos TypeScript existentes pero extenderlos
- Preservar layout automático con Dagre
- Interfaz intuitiva con validación en tiempo real
- Compatibilidad con datos del backend Go existente
