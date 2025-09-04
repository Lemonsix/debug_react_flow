# Contexto Activo del Proyecto

## Estado Actual
- **Proyecto**: Editor de Torneos con React Flow
- **Modo**: ✅ **SISTEMA DE SLOTS EN SINKS IMPLEMENTADO** - Los nodos sink ahora tienen slots predefinidos para asignar equipos durante el torneo
- **Última tarea**: ✅ Implementación del sistema de slots en nodos sink para asignación de equipos

## ✅ **SISTEMA DE PODIO ÚNICO + ELK LAYOUT + NODOS NO-EDITABLES + EDGES DUALES + NODO ÚNICO DE ELIMINACIÓN + LÓGICA DE EDGES CORREGIDA IMPLEMENTADO**

### **Funcionalidades Implementadas**

1. **Modo No-Editable por Defecto**:
   - ✅ **Todos los Nodos No-Editables**: Por defecto, ningún nodo está en modo edición
   - ✅ **Edición Controlada**: Los usuarios deben activar la edición uno por uno
   - ✅ **Exclusividad de Edición**: Solo un nodo puede estar en modo edición a la vez
   - ✅ **Indicadores Visuales**: Botones de edición claramente visibles en cada nodo

2. **Sistema de Edición Inteligente**:
   - ✅ **Botones de Edición Permanentes**: Botón ✏️ visible en todos los nodos cuando no están editando
   - ✅ **Activación Manual**: Click en el botón ✏️ para activar la edición
   - ✅ **Desactivación Automática**: Al editar otro nodo, el anterior se desactiva automáticamente
   - ✅ **Feedback Visual**: Anillo azul y borde azul para nodos en modo edición

3. **Indicadores de Estado**:
   - ✅ **Toolbar Informativa**: Indicador "✏️ Editando nodo" en la parte superior
   - ✅ **Estilos Diferenciados**: Nodos en edición tienen anillo azul y borde azul
   - ✅ **Hover Effects**: Botones de edición con efectos hover mejorados
   - ✅ **Tooltips**: Información contextual en botones de edición

4. **Reset Automático al Aplicar Templates**:
   - ✅ **Prevención de Edición Automática**: Al aplicar un template, todos los nodos están en modo no-editable
   - ✅ **Detección de Cambios**: Sistema detecta automáticamente cuando se aplica un nuevo template
   - ✅ **Reset de Estado**: Estado de edición se resetea automáticamente al cambiar el grafo
   - ✅ **Consistencia**: Comportamiento uniforme independientemente de cómo se genere el grafo

5. **Sistema de Edges Duales**:
   - ✅ **Dos Edges por Nodo**: Cada nodo de match tiene edge para ganador y perdedor
   - ✅ **Lógica de Eliminación Directa**: Perdedores van a nodos de eliminación específicos
   - ✅ **Sistema Suizo Inteligente**: Perdedores van a matches de consolación contra equipos con mismo score
   - ✅ **Flujo Completo**: Todos los equipos tienen un camino definido hasta el final

6. **Espaciado Mejorado**:
   - ✅ **Más Espacio Entre Nodos**: Espaciado aumentado para mejor visualización
   - ✅ **Organización Jerárquica**: Nodos organizados en columnas con espaciado consistente
   - ✅ **Layout Optimizado**: Posicionamiento que facilita la lectura del flujo del torneo

7. **Nodo Único de Eliminación**:
   - ✅ **Un Solo Nodo de Eliminación**: Todos los perdedores van al mismo lugar
   - ✅ **Función Helper**: `createSingleEliminationNode()` para crear nodo único
   - ✅ **Consistencia Visual**: Demuestra claramente que todos los eliminados van al mismo destino
   - ✅ **Simplificación**: Reduce la complejidad visual del grafo

8. **Lógica de Edges Corregida**:
   - ✅ **Función `createEdge` Mejorada**: Ahora acepta parámetro `isDefault` para controlar el estado
   - ✅ **Edges de Ganador**: Marcados como `isDefault: true` con `field: "default"` para el flujo principal
   - ✅ **Edges de Perdedor**: Marcados como `isDefault: true` con `field: "default"` para eliminación
   - ✅ **Consistencia de Estados**: Los edges de eliminación ahora aparecen correctamente como "Derrota" en el formulario

### **Arquitectura Técnica**

#### **Estado de Edición Global**
- **Sistema Centralizado**: Estado `currentlyEditing` controla qué nodo está en edición
- **Exclusividad**: Solo un elemento (nodo o edge) puede estar en edición a la vez
- **Auto-Desactivación**: Al activar edición en un nodo, se desactiva automáticamente el anterior

#### **Sistema de Reset Automático**
- **Detección de Templates**: `useEffect` detecta cambios en `graph.tournamentId`
- **Reset Automático**: Función `stopEditing()` se ejecuta automáticamente al aplicar templates
- **Prevención de Estados Inconsistentes**: Evita que nodos aparezcan en modo edición por defecto
- **Integración con React Flow**: Funciona con el sistema interno de nodos y edges

#### **Sistema de Edges Duales**
- **Nodos de Eliminación**: Función `createEliminationNode()` para perdedores
- **Nodo Único de Eliminación**: Función `createSingleEliminationNode()` para crear un solo nodo
- **Función `createEdge` Mejorada**: Ahora acepta parámetro `isDefault` para controlar el estado del edge
- **Lógica por Tipo de Torneo**: 
  - **Eliminación Directa**: Perdedores → nodo único de eliminación → podio
  - **Sistema Suizo**: Perdedores → matches de consolación → nodo único de eliminación → podio
- **Flujo Completo**: Todos los equipos tienen un camino definido hasta el resultado final
- **Consistencia Visual**: Todos los eliminados van al mismo destino, simplificando el grafo
- **Estados Corregidos**: Los edges de eliminación ahora aparecen correctamente como "Derrota" en el formulario

#### **Componentes Modificados**
- `src/App.tsx` - Sistema de reset automático al aplicar templates
- `src/TournamentEditor.tsx` - Sistema de edición exclusiva + reset automático implementado
- `src/components/EditableNode.tsx` - Lógica de edición por defecto no-activa
- `src/components/nodes/MatchNode.tsx` - Botones de edición siempre visibles + ignorar data.editable
- `src/components/nodes/PodiumNode.tsx` - Botones de edición siempre visibles + ignorar data.editable
- `src/config/templates.ts` - Sistema completo de templates con edges duales, espaciado mejorado y lógica de edges corregida

#### **Funciones de Control**
- `startEditing()` - Activa edición con auto-desactivación del anterior
- `stopEditing()` - Desactiva cualquier edición activa
- `isCurrentlyEditing()` - Verifica si un elemento específico está editando
- `isAnyNodeEditing()` - Verifica si algún nodo está en modo edición
- **Reset Automático**: Se ejecuta automáticamente al detectar cambios en el grafo

### **Flujo de Usuario Implementado**

#### **Estado Inicial**
1. **Todos los nodos están en modo no-editable**
2. **Botones de edición ✏️ visibles en cada nodo**
3. **Ningún indicador de edición activa**

#### **Activación de Edición**
1. **Usuario hace click en botón ✏️ de un nodo**
2. **El nodo se activa en modo edición**
3. **Se muestra anillo azul y borde azul**
4. **Aparece indicador "✏️ Editando nodo" en toolbar**
5. **Se desactiva cualquier edición previa**

#### **Desactivación de Edición**
1. **Usuario hace click en botón ✏️ de otro nodo**
2. **El nodo anterior se desactiva automáticamente**
3. **El nuevo nodo se activa en modo edición**
4. **Indicadores visuales se actualizan**

#### **Aplicación de Templates**
1. **Usuario selecciona y confirma un template**
2. **Se genera nuevo grafo con todos los nodos**
3. **Sistema detecta automáticamente el cambio**
4. **Estado de edición se resetea automáticamente**
5. **Todos los nodos aparecen en modo no-editable**
6. **Botones de edición ✏️ visibles en cada nodo**

#### **Sistema de Edges Duales**
1. **Cada nodo de match tiene dos edges de salida**
2. **Edge "Ganador"**: Conecta al siguiente match del torneo
3. **Edge "Perdedor"**: 
   - **Eliminación Directa**: Va al nodo único de eliminación
   - **Sistema Suizo**: Va a match de consolación contra equipo con mismo score, luego al nodo único de eliminación
4. **Flujo Completo**: Todos los equipos llegan a un resultado final
5. **Nodo Único de Eliminación**: Todos los perdedores van al mismo lugar, simplificando la visualización

### **Beneficios de la Implementación**

#### **Experiencia de Usuario**
- **Prevención de Errores**: No hay ediciones accidentales
- **Control Total**: Usuario decide cuándo y qué editar
- **Feedback Claro**: Estado de edición siempre visible
- **Flujo Intuitivo**: Un nodo a la vez, sin confusión
- **Consistencia**: Comportamiento uniforme al aplicar templates
- **Visualización Clara**: Espaciado mejorado facilita la lectura del torneo

#### **Mantenibilidad**
- **Código Limpio**: Lógica de edición centralizada
- **Estados Consistentes**: Comportamiento predecible
- **Fácil Debugging**: Estado de edición siempre claro
- **Escalabilidad**: Fácil agregar nuevos tipos de nodos
- **Prevención de Bugs**: Reset automático evita estados inconsistentes

#### **Integración con Templates**
- **Flujo Perfecto**: Templates se aplican sin interferir con el estado de edición
- **Experiencia Consistente**: Usuario siempre ve nodos en modo no-editable
- **No Confusión**: No hay nodos que aparezcan editando por sorpresa
- **Control Total**: Usuario decide cuándo activar la edición

#### **Sistema de Edges Duales**
- **Lógica Completa**: Todos los equipos tienen un camino definido
- **Flexibilidad**: Diferentes tipos de torneos con lógicas específicas
- **Escalabilidad**: Fácil agregar nuevos tipos de torneos
- **Visualización Clara**: Flujo del torneo fácil de seguir
- **Nodo Único de Eliminación**: Simplifica la visualización mostrando que todos los eliminados van al mismo lugar
- **Consistencia**: Comportamiento uniforme en todos los templates
- **Estados Corregidos**: Los edges de eliminación ahora aparecen correctamente como "Derrota" en el formulario
- **Lógica Unificada**: Función `createEdge` mejorada para controlar estados de manera consistente

---

## ✅ **SISTEMA DE PODIO ÚNICO + ELK LAYOUT IMPLEMENTADO - FUNCIONALIDAD COMPLETA**

### **Funcionalidades Implementadas**

1. **Sistema de Podio Único**:
   - ✅ **Un Solo Nodo Podio**: En lugar de múltiples nodos podio, ahora hay un solo nodo con N handles
   - ✅ **Handles Dinámicos**: Cada posición del podio (1er, 2do, 3er lugar) tiene su propio handle
   - ✅ **Configuración Flexible**: El nodo podio se adapta automáticamente al número de posiciones configurado
   - ✅ **IDs Únicos**: Cada handle tiene un ID único (`sink-{nodeId}-{position}`) para conexiones precisas

2. **ELK Layout Integrado**:
   - ✅ **Posicionamiento Automático**: Algoritmo ELK layered para distribución automática de nodos
   - ✅ **Configuración Optimizada**: Opciones de layout basadas en la documentación oficial de ELK
   - ✅ **Ports Inteligentes**: Sistema de ports para handles de entrada/salida con posicionamiento fijo
   - ✅ **Eliminación de Cruces**: Algoritmo de minimización de cruces de edges
   - ✅ **Estrategia de Capas**: Organización en capas con espaciado optimizado

3. **Templates Actualizados**:
   - ✅ **Eliminación Directa**: 4, 8 y 16 equipos con podio único de 3 posiciones
   - ✅ **Sistema Suizo**: 16 equipos con podio único de 3 posiciones
   - ✅ **Eliminación Doble**: 8 y 16 equipos con podio único de 3 posiciones
   - ✅ **Conexiones Simplificadas**: Edges conectan directamente a los handles del podio único

### **Arquitectura Técnica**

#### **Hook de ELK Layout**
- `src/hooks/useLayoutNodes.ts` - Hook personalizado para integración con ELK
- **Configuración Optimizada**: Basada en [documentación oficial de ELK](https://www.eclipse.org/elk/reference/algorithms/org-eclipse-elk-layered.html)
- **Algoritmo Layered**: Dirección RIGHT con espaciado optimizado entre capas
- **Ports Fijos**: `org.eclipse.elk.portConstraints: 'FIXED_ORDER'` para reducir cruces

#### **Sistema de Ports**
- **Nodos Match**: Ports para handles de entrada (WEST) y salida (EAST)
- **Nodos Sink**: Ports para cada posición del podio (WEST)
- **IDs Únicos**: Sistema de nomenclatura consistente para todos los ports

#### **Componentes Modificados**
- `src/components/nodes/PodiumNode.tsx` - Actualizado para manejar múltiples handles
- `src/config/templates.ts` - Todos los templates actualizados para usar podio único
- `src/TournamentEditor.tsx` - Integración del hook de ELK layout

### **Configuración ELK Implementada**

```typescript
const layoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.spacing.componentComponent': '80',
  'elk.spacing.nodeNode': '50',
  'elk.spacing.edgeEdge': '10',
  'elk.spacing.edgeNode': '20',
};
```

### **Beneficios de la Implementación**

#### **Sistema de Podio Único**
- **Menos Nodos**: Reducción significativa en el número de nodos del grafo
- **Conexiones Más Limpias**: Edges más directos y fáciles de seguir
- **Mantenimiento Simplificado**: Un solo nodo para configurar en lugar de múltiples
- **Escalabilidad**: Fácil agregar más posiciones al podio sin crear nodos adicionales

#### **ELK Layout**
- **Posicionamiento Automático**: Los nodos se organizan automáticamente de manera óptima
- **Eliminación de Cruces**: Algoritmo inteligente para minimizar cruces de edges
- **Organización en Capas**: Estructura clara y jerárquica del torneo
- **Espaciado Optimizado**: Distancias consistentes y visualmente agradables

## Funcionalidades Implementadas Anteriormente

### ✅ **SISTEMA DE TEMPLATES IMPLEMENTADO - FUNCIONALIDAD COMPLETA**

**Templates Disponibles:**
- **Eliminación Directa**: 4, 8 y 16 equipos con podio único de 3 posiciones
- **Sistema Suizo**: 16 equipos con podio único de 3 posiciones
- **Eliminación Doble**: 8 y 16 equipos con podio único de 3 posiciones

**Características del Sistema:**
- ✅ **Selector Inteligente**: Filtrado por esport y categoría
- ✅ **Generación Automática**: Estructuras completas con nodos, edges y posicionamiento
- ✅ **Modal de Confirmación**: Información detallada y advertencias antes de aplicar
- ✅ **Integración Completa**: Funciona con el sistema existente de esports
- ✅ **UI Moderna**: Componentes shadcn/ui para mejor experiencia visual

### **Estructura de Archivos Final**

```
src/
├── types.ts                    # ✅ Tipos extendidos para edición + esports
├── App.tsx                     # ✅ Aplicación principal con sistema de templates
├── TournamentEditor.tsx        # ✅ Editor interactivo principal + ELK layout + edición controlada
├── TournamentGraphView.tsx     # ✅ Visualizador original (mantenido)
├── data.sample.ts             # ✅ Datos de muestra (existente)
├── config/
│   ├── esports.ts             # ✅ Configuraciones y validaciones por esport
│   └── templates.ts            # ✅ Sistema completo de templates con podio único
├── components/
│   ├── FormComponents.tsx      # ✅ Componentes de formulario base + validación esport
│   ├── EditableNode.tsx        # ✅ Nodos editables + validación esport + edición controlada
│   ├── EditableEdge.tsx        # ✅ Edges con condiciones + sistema BO1/BO3/BO5
│   ├── TemplateSelector.tsx    # ✅ Selector visual de templates
│   ├── TemplateConfirmModal.tsx # ✅ Modal de confirmación de templates
│   └── nodes/                  # ✅ Componentes de nodos separados
│       ├── BaseNode.tsx        # Hook personalizado con lógica común
│       ├── MatchNode.tsx       # Nodos de match (editables) + botones siempre visibles
│       ├── PodiumNode.tsx      # ✅ Nodos de podio con múltiples handles + botones siempre visibles
│       ├── EliminationNode.tsx # Nodos de eliminación (solo lectura)
│       └── index.ts            # Exportaciones centralizadas
├── components/ui/              # ✅ Componentes UI de shadcn
│   ├── card.tsx                # Componente Card
│   ├── badge.tsx               # Componente Badge
│   └── dialog.tsx              # Componente Dialog
├── hooks/                      # ✅ Hooks personalizados
│   ├── useConnectionState.ts   # Hook para estado de conexión
│   └── useLayoutNodes.ts       # ✅ Hook para ELK layout
├── utils/
│   └── validation.ts           # ✅ Funciones de validación
└── memory-bank/               # ✅ Documentación completa
    ├── projectbrief.md
    ├── productContext.md
    ├── systemPatterns.md
    ├── techContext.md
    ├── activeContext.md
    ├── progress.md
    └── edgesExample.md         # ✅ Documentación del sistema de edges
```

## Estado Final
🎉 **SISTEMA DE PODIO ÚNICO + ELK LAYOUT + NODOS NO-EDITABLES COMPLETAMENTE IMPLEMENTADO**

El sistema ahora incluye:
- **Podio Único**: Un solo nodo con múltiples handles para todas las posiciones
- **ELK Layout**: Posicionamiento automático y optimizado de nodos
- **Edición Controlada**: Todos los nodos no-editables por defecto, edición uno a uno
- **Templates Actualizados**: Todos los templates funcionan con el nuevo sistema
- **Integración Completa**: Funciona con el sistema existente de esports y templates
- **Performance Mejorada**: Menos nodos y mejor organización visual
- **UX Optimizada**: Prevención de ediciones accidentales y control total del usuario

## ✅ **SISTEMA DE SLOTS EN SINKS IMPLEMENTADO - FUNCIONALIDAD COMPLETA**

### **Funcionalidades Implementadas**

1. **Estructura de Slots en Sinks**:
   - ✅ **SinkConfiguration Extendida**: Ahora incluye propiedad `slots: number` para definir cantidad de slots
   - ✅ **Generación Automática**: Los nodos sink generan automáticamente slots según su configuración
   - ✅ **Slots Predefinidos**: Cada slot tiene índice, participantId, sourceNodeId y sourceOutcome
   - ✅ **Compatibilidad**: Mantiene compatibilidad con estructura existente

2. **Visualización de Slots**:
   - ✅ **PodiumNode Mejorado**: Muestra slots del podio con medallas (🥇🥈🥉) y estado de ocupación
   - ✅ **EliminationNode Mejorado**: Muestra slots de eliminación con iconos (💀) y estado de ocupación
   - ✅ **Indicadores Visuales**: Slots ocupados en verde, vacíos en gris
   - ✅ **Contador de Slots**: Muestra cantidad de slots disponibles en cada nodo

3. **Funciones de Gestión de Slots**:
   - ✅ **assignTeamToSlot()**: Asigna equipo a slot específico
   - ✅ **unassignTeamFromSlot()**: Desasigna equipo de slot específico
   - ✅ **findFirstAvailableSlot()**: Encuentra primer slot disponible
   - ✅ **getOccupiedSlots()**: Obtiene slots ocupados
   - ✅ **getEmptySlots()**: Obtiene slots vacíos
   - ✅ **hasAvailableSlots()**: Verifica si hay slots disponibles
   - ✅ **simulateTournamentFlow()**: Simula flujo completo del torneo

4. **Templates Actualizados**:
   - ✅ **Nodos de Podio**: Generan slots automáticamente según número de lugares
   - ✅ **Nodos de Eliminación**: Generan slots automáticamente (por defecto 1 slot)
   - ✅ **Configuración Flexible**: Permite especificar número de slots por nodo
   - ✅ **Compatibilidad**: Todos los templates existentes funcionan con nueva estructura

### **Arquitectura Técnica**

#### **Tipos Actualizados**
- `SinkConfiguration` - Agregada propiedad `slots: number`
- `GraphNode` - Mantiene estructura de slots existente
- Funciones helper en `src/utils/slotManagement.ts`

#### **Componentes Modificados**
- `src/types.ts` - SinkConfiguration extendida
- `src/config/templates.ts` - Funciones de creación actualizadas
- `src/components/nodes/PodiumNode.tsx` - Visualización de slots del podio
- `src/components/nodes/EliminationNode.tsx` - Visualización de slots de eliminación
- `src/utils/slotManagement.ts` - Funciones de gestión de slots

#### **Funciones de Gestión**
```typescript
// Asignar equipo a slot específico
assignTeamToSlot(node, slotIndex, participantId, sourceNodeId, sourceOutcome)

// Asignar al primer slot disponible
assignTeamToFirstAvailableSlot(node, participantId, sourceNodeId, sourceOutcome)

// Simular flujo completo del torneo
simulateTournamentFlow(nodes, matchResults)
```

### **Beneficios de la Implementación**

#### **Gestión de Torneos**
- **Asignación Automática**: Equipos se asignan automáticamente a slots según resultados
- **Seguimiento Visual**: Estado de cada posición del podio y eliminación visible
- **Flexibilidad**: Número de slots configurable por nodo
- **Trazabilidad**: Cada asignación incluye origen (nodo y resultado)

#### **Experiencia de Usuario**
- **Visualización Clara**: Slots ocupados y vacíos claramente diferenciados
- **Información Contextual**: Medallas para podio, iconos para eliminación
- **Estado en Tiempo Real**: Contadores de slots disponibles
- **Interfaz Intuitiva**: Fácil identificar qué equipos están en qué posiciones

#### **Desarrollo**
- **API Completa**: Funciones helper para todas las operaciones de slots
- **Type Safety**: Tipos TypeScript para todas las operaciones
- **Simulación**: Función para simular flujo completo del torneo
- **Extensibilidad**: Fácil agregar nuevos tipos de sinks con slots

## Próximos Pasos Sugeridos

1. **Testing de Slots**: Verificar que la asignación de equipos funcione correctamente
2. **Integración con Backend**: Conectar sistema de slots con backend Go
3. **Persistencia**: Guardar estado de slots en base de datos
4. **Validación**: Agregar validaciones para evitar asignaciones duplicadas
5. **UI de Asignación**: Crear interfaz para asignar equipos manualmente
6. **Simulación Avanzada**: Mejorar función de simulación con más opciones
7. **Testing**: Verificar que todos los templates generen correctamente slots
8. **Documentación**: Crear guía de uso del sistema de slots