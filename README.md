# Debug Graph - Visualizador de Grafos de Torneos

Un proyecto de React + TypeScript para visualizar y debuggear grafos de torneos usando React Flow y Dagre para el layout automático.

## 🚀 Características

- **Visualización de Grafos**: Renderiza grafos de torneos con nodos y conexiones
- **Nodos Custom Detallados**: Muestra información completa de cada nodo y sus slots
- **Layout Automático**: Usa Dagre para posicionar automáticamente los nodos
- **Nodos Draggables**: Arrastra y posiciona nodos a tu gusto
- **Tipos de Nodos**: Soporta matches, agregadores y sinks (resultados finales)
- **React Flow**: Interfaz interactiva con zoom, pan y controles
- **Tailwind CSS**: Estilos modernos y responsivos
- **TypeScript**: Tipado completo para mejor desarrollo

## 🛠️ Tecnologías

- **React 19** - Framework de UI
- **React Flow 11** - Biblioteca para grafos interactivos
- **Dagre** - Layout automático de grafos
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utilitario
- **Vite** - Build tool y dev server

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd debug-graph

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

## 🎯 Uso

El proyecto incluye datos de ejemplo que muestran un torneo de CS2 con:

- **Cuartos de Final** (QF1, QF2) - Nodos de tipo "match"
- **Semifinal** (SF1) - Nodo de tipo "match"
- **Final** (F) - Nodo de tipo "match"
- **Sinks** - Resultados finales (1er y 2do lugar)

### Estructura de Datos

#### Estructura Compatible con Go
```typescript
interface GraphDTO {
  nodes: PhaseNode[];
  edges: PhaseEdge[];
  slots: PhaseNodeSlot[];
}

interface PhaseNode {
  id: string;           // UUID como string
  phase_id: string;     // UUID como string
  type: NodeType;
  esport: string;
  capacity: number;
  slots?: PhaseNodeSlot[];
  config: Record<string, unknown>;
}

interface PhaseNodeSlot {
  node_id: string;          // UUID como string
  slot_index: number;
  participant_id?: string;  // UUID como string
  source_node_id?: string;  // UUID como string
  source_outcome?: string;
}
```

#### Estructura para el Componente (Compatibilidad)
```typescript
interface TournamentGraph {
  version: 1;
  tournamentId: string;
  phaseId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### Tipos de Nodos

- **`match`**: Partidas del torneo (verde)
- **`aggregator`**: Nodos que agregan resultados (azul)
- **`sink`**: Resultados finales (gris)

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo en http://localhost:5173
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting con ESLint

## 📁 Estructura del Proyecto

```
src/
├── App.tsx              # Componente principal
├── TournamentGraphView.tsx  # Visualizador del grafo (con drag & drop)
├── types.ts             # Definiciones de tipos TypeScript
├── data.sample.ts       # Datos de ejemplo + conversor Go
└── index.css            # Estilos globales y Tailwind
```

## 🎨 Nodos Custom Detallados

### Información Visual Completa

- **Header del Nodo**: Tipo, esport y estado con colores diferenciados
- **Identificador**: ID del nodo en fuente monoespaciada
- **Contador de Slots**: Indicador visual del estado de llenado (verde/amarillo/gris)
- **Slots Individuales**: Cada slot muestra su contenido y origen
- **Estados de Slots**: Colores diferenciados para slots llenos y vacíos
- **Información de Origen**: Referencias a nodos fuente y outcomes

### Tipos de Nodos

- **Match Nodes**: Verde, muestran slots con participantes
- **Aggregator Nodes**: Azul, muestran slots de agregación
- **Sink Nodes**: Gris, muestran información de resultado final

### Colores de Estado

- **Finished**: Verde (completado)
- **Live**: Rojo (en vivo)
- **Ready**: Amarillo (listo)
- **Pending**: Azul (pendiente)

## 🖱️ Drag & Drop

### Funcionalidades Interactivas

- **Arrastrar Nodos**: Haz clic y arrastra cualquier nodo para reposicionarlo
- **Cursor Visual**: Los nodos muestran cursor de agarre (grab/grabbing)
- **Efectos Hover**: Sombra mejorada cuando pasas el mouse sobre un nodo
- **Reset Layout**: Botón en la esquina superior derecha para volver al layout automático
- **Conexiones Dinámicas**: Las líneas se ajustan automáticamente al mover nodos

### Controles Disponibles

- **Zoom**: Rueda del mouse o controles en pantalla
- **Pan**: Arrastra el fondo del grafo
- **Minimap**: Vista general navegable
- **Seleccionar**: Haz clic en nodos para seleccionarlos
- **Drag**: Arrastra nodos para reposicionarlos

## 🎨 Personalización

### Colores de Nodos
Los colores se pueden modificar en `TournamentGraphView.tsx`:

```typescript
const color =
  data.type === 'match' ? 'bg-emerald-600' :
  data.type === 'aggregator' ? 'bg-blue-600' :
  'bg-slate-600';
```

### Layout del Grafo
El layout se configura en la función `toRF`:

```typescript
g.setGraph({ 
  rankdir: 'LR',    // Dirección: Left to Right
  nodesep: 40,      // Separación entre nodos
  ranksep: 80       // Separación entre niveles
});
```

## 🐛 Debugging

El proyecto está diseñado para facilitar el debugging de grafos de torneos:

1. **Visualización Clara**: Cada nodo muestra su tipo, estado y capacidad
2. **Slots Visuales**: Ver el contenido de cada slot dentro de cada nodo
3. **Conexiones Visibles**: Las flechas muestran el flujo del torneo
4. **Información de Sinks**: Panel inferior muestra los resultados finales
5. **Layout Automático**: Posicionamiento inicial automático con Dagre
6. **Drag & Drop**: Arrastra nodos para reorganizar el layout a tu gusto
7. **Reset Layout**: Botón para volver al layout automático original

## 🔗 Integración con Backend de Go

El proyecto se integra fácilmente con tu backend de Go usando un conversor simple:

### Conversor Directo
```typescript
// JSON del backend de Go
const goData: GoBackendGraph = await fetch('/api/graph');

// Convertir al formato del componente
const componentData = convertGoToComponent(goData);

// Usar directamente
<TournamentGraphView graph={componentData} />
```

### Características de Integración
- **JSON Directo**: Usa el JSON exacto que viene de Go
- **Conversión Simple**: Solo transforma lo necesario
- **Sin Duplicación**: No mantiene estructuras separadas
- **Slots Automáticos**: Crea slots basados en la capacidad del nodo

### Estructura del Backend
```json
{
  "nodes": [
    {
      "id": "uuid",
      "phase_id": "uuid", 
      "type": "match",
      "esport": "cs2",
      "capacity": 2,
      "config": null
    }
  ],
  "edges": [...],
  "slots": null
}
```

## 📝 Licencia

Este proyecto es de uso interno para debugging y desarrollo.
