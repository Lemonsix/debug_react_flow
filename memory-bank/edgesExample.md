# Ejemplo de Edges con Sistema BO1/BO3/BO5

## Esports Competitivos (CS2, Valorant, FIFA, etc.)

### Interfaz de Usuario
Cuando edites un edge en un esport competitivo, verás un selector simple con opciones predefinidas:

```
┌─────────────────────────┐
│ [Derrota ▼]             │
│  • Derrota              │
│  • Ganador BO1          │
│  • Ganador BO3          │
│  • Ganador BO5          │
└─────────────────────────┘
```

### Edge de Derrota (Default)
- **Selector**: "Derrota"
- **Condición interna**: `field: "default"`
- **Label mostrado**: "Derrota"
- **Tooltip**: "Los equipos que pierdan el match seguirán este flujo hacia la derrota"
- **Uso**: Para conectar equipos perdedores a nodos de eliminación

### Edge de Victoria BO1
- **Selector**: "Ganador BO1"
- **Condición interna**: `field: "score", operator: ">", value: 0`
- **Label mostrado**: "BO1"
- **Tooltip**: "Los equipos que ganen al menos 1 ronda (BO1) seguirán este flujo"
- **Uso**: Para victorias en Best of 1

### Edge de Victoria BO3
- **Selector**: "Ganador BO3"
- **Condición interna**: `field: "score", operator: ">", value: 1`
- **Label mostrado**: "BO3"
- **Tooltip**: "Los equipos que ganen al menos 2 rondas (BO3) seguirán este flujo"
- **Uso**: Para victorias en Best of 3

### Edge de Victoria BO5
- **Selector**: "Ganador BO5"
- **Condición interna**: `field: "score", operator: ">", value: 2`
- **Label mostrado**: "BO5"
- **Tooltip**: "Los equipos que ganen al menos 3 rondas (BO5) seguirán este flujo"
- **Uso**: Para victorias en Best of 5

## Fortnite (N Participantes)

### Interfaz de Usuario
Para Fortnite, tienes un selector personalizado con campos configurables:

```
┌─────────────────────────────────────┐
│ [Derrota ▼]                         │
│  • Derrota                          │
│  • Victoria por Posición            │
│  • Victoria por Score               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [≤] [10]                            │
│ Operador: ≥, ≤, ==, !=, >, <        │
│ Valor: Número positivo               │
└─────────────────────────────────────┘
```

### Edge Default
- **Condición**: `field: "default"`
- **Label mostrado**: "Derrota"
- **Tooltip**: "Los equipos que pierdan el match seguirán este flujo hacia la derrota"

### Edge de Score
- **Condición**: `field: "score", operator: ">=", value: 50`
- **Label mostrado**: "Score 50 o más"
- **Tooltip**: "Los participantes con score mayor o igual a 50 tomarán este flujo"

### Edge de Posición
- **Condición**: `field: "position", operator: "<=", value: 10`
- **Label mostrado**: "Top 10"
- **Tooltip**: "Los participantes en posición menor o igual a 10 continuarán por esta ruta"

### Edge de Score
- **Condición**: `field: "score", operator: ">=", value: 50`
- **Label mostrado**: "Score 50 o más"
- **Tooltip**: "Los participantes con score mayor o igual a 50 tomarán este flujo"

## Comportamiento de Edges Nuevos

### Creación Automática
Cuando se crea un nuevo edge:
- **Edge Default**: Se crea automáticamente con condición `field: "default"`
- **Edge Ganador**: Se crea con condición `field: "score", operator: ">=", value: 0`
- **Edición Automática**: Los edges nuevos se abren automáticamente para edición
- **Labels Descriptivos**: Los edges de score se muestran con labels descriptivos según el esport

### Inicialización Inteligente del Selector

El selector de condiciones se inicializa de manera inteligente:
- **Si es el primer edge del nodo**: Se inicia en "Derrota" (default)
- **Si ya existe un edge default**: Se inicia en "Victoria por Score" (para evitar duplicar "Derrota")
- **Lógica**: `field: isDefault ? "default" : (hasDefaultEdge ? "score" : "default")`

### Campos Condicionales

Los campos de operador y valor solo se muestran cuando es necesario:
- **Para "Derrota"**: Solo se muestra el selector, sin campos adicionales
- **Para esports competitivos**: Solo se muestra el selector (BO1/BO3/BO5), sin campos adicionales
- **Para Fortnite**: Se muestran operador lógico y valor numérico para condiciones de victoria
- **Lógica**: `{condition.field !== "default" && esport === "fortnite" && (...)}`

### Eliminación de "Points"
- ❌ **Antes**: Los edges se creaban con `field: "points"` (obsoleto)
- ✅ **Ahora**: Los edges se crean con `field: "score"` (estándar)
- 🔄 **Migración**: Todos los edges existentes se actualizan automáticamente

### Sistema de "Ghost" Personalizado
- 🎯 **Visualización en Tiempo Real**: Mientras arrastras un edge, ves exactamente qué tipo se va a crear
- 🎨 **Colores Diferenciados**: 
  - 🔴 **Rojo punteado**: Edge default (derrota)
  - 🟢 **Verde sólido**: Edge de victoria para esports competitivos
  - 🔵 **Azul sólido**: Edge configurable para Fortnite
- 📝 **Labels Informativos**: Se muestra "Derrota", "Ganador" o "Victoria" según el contexto
- 🔄 **Detección Automática**: El sistema detecta automáticamente si será edge default o no

### Validación de Podios
- 🏆 **Un Solo Edge**: Los podios solo pueden tener 1 edge de entrada
- 🔄 **Reemplazo Automático**: Si se conecta un nuevo edge, el anterior se elimina automáticamente
- 📊 **Historial Completo**: Todas las eliminaciones se registran en el historial
- 🎯 **Lógica de Torneo**: Mantiene la integridad del flujo del torneo

## Implementación Técnica

### Sistema de "Ghost" Personalizado

#### **Componentes Clave**
1. **`CustomConnectionLine`**: Componente que renderiza la línea de conexión personalizada
2. **`useConnectionState`**: Hook que detecta el estado de la conexión
3. **Event Handlers**: `onConnectStart` y `onConnectEnd` para detectar el drag

#### **Lógica de Detección**
```typescript
// Determinar si el edge que se va a crear será default
const determineIfDefault = (sourceNodeId: string, allEdges: Edge[]): boolean => {
  // Si es el primer edge del nodo, será default
  const nodeEdges = allEdges.filter((edge) => edge.source === sourceNodeId);
  return nodeEdges.length === 0;
};
```

#### **Estilos Visuales**
```typescript
// Para edges default (derrota)
if (isDefault) {
  return {
    stroke: "#ef4444",        // Rojo
    strokeWidth: 3,
    strokeDasharray: "5,5",   // Línea punteada
  };
}

// Para esports competitivos (victoria)
if (esport !== "fortnite") {
  return {
    stroke: "#10b981",        // Verde
    strokeWidth: 3,
    strokeDasharray: "none",  // Línea sólida
  };
}

// Para Fortnite (configurable)
return {
  stroke: "#3b82f6",         // Azul
  strokeWidth: 3,
  strokeDasharray: "none",   // Línea sólida
};
```

#### **Labels Contextuales**
```typescript
const getConnectionLabel = () => {
  if (isDefault) return "Derrota";
  if (esport !== "fortnite") return "Ganador";
  return "Victoria";
};
```

### Inicialización Inteligente del Selector

#### **Lógica de Detección de Edge Default**
```typescript
// Determinar si ya existe un edge default para este nodo
const hasDefaultEdge = useMemo(() => {
  if (isDefault) return true; // Este edge es el default
  // Verificar si ya existe otro edge default para el mismo nodo source
  return allEdges.some(edge => 
    edge.source === edgeData.fromNode && 
    edge.id !== id && 
    (edge.data as GraphEdge)?.isDefault === true
  );
}, [isDefault, allEdges, edgeData.fromNode, id]);
```

#### **Inicialización Condicional del Estado**
```typescript
const [condition, setCondition] = useState<EdgeCondition>(
  edgeData?.condition || {
    field: isDefault ? "default" : (hasDefaultEdge ? "score" : "default"),
    operator: isDefault ? ">=" : (hasDefaultEdge ? ">" : ">="),
    value: isDefault ? 0 : (hasDefaultEdge ? 0 : 0),
  }
);
```

#### **Lógica del Selector para Esports Competitivos**
```typescript
value={
  condition.field === "default" 
    ? "default"
    : condition.field === "score" && condition.operator === ">" && condition.value === 0
    ? "bo1"
    : condition.field === "score" && condition.operator === ">" && condition.value === 1
    ? "bo3"
    : condition.field === "score" && condition.operator === ">" && condition.value === 2
    ? "bo5"
    : "default"
}
```

#### **Aplicación en Cancelar Edición**
```typescript
const handleCancel = useCallback(() => {
  setCondition(
    edgeData?.condition || {
      field: isDefault ? "default" : (hasDefaultEdge ? "score" : "default"),
      operator: ">=",
      value: 0,
    }
  );
  onStopEditing?.();
}, [edgeData?.condition, onStopEditing, isDefault, hasDefaultEdge]);
```

#### **Campos Condicionales**
```typescript
// Solo mostrar operador y valor si no es default (para cualquier esport)
{condition.field !== "default" && (
  <>
    <select value={condition.operator} onChange={...}>
      <option value=">=">&ge;</option>
      <option value="<=">&le;</option>
      {/* ... más opciones ... */}
    </select>
    
    <input 
      type="text" 
      value={condition.value} 
      onChange={...}
      placeholder="0"
    />
  </>
)}
```

#### **Sincronización Inteligente del Estado**
```typescript
useEffect(() => {
  if (edgeData?.condition && !isEditing) {
    setCondition(edgeData.condition);
  } else if (!edgeData?.condition && !isEditing) {
    // Si no hay condición y no estamos editando, usar la lógica inteligente
    setCondition({
      field: isDefault ? "default" : (hasDefaultEdge ? "score" : "default"),
      operator: ">=",
      value: 0,
    });
  }
}, [edgeData?.condition, isEditing, isDefault, hasDefaultEdge]);
```

### Validación de Podios

#### **Función de Validación**
```typescript
export function validatePodiumEdges(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { valid: boolean; edgesToRemove: GraphEdge[] } {
  const podiums = nodes.filter(
    (node) => node.type === "sink" && node.sinkConfig?.sinkType === "podium"
  );

  const edgesToRemove: GraphEdge[] = [];

  podiums.forEach((podium) => {
    const edgesToPodium = edges.filter((edge) => edge.toNode === podium.id);
    
    if (edgesToPodium.length > 1) {
      // Ordenar por timestamp para encontrar el más reciente
      const sortedEdges = edgesToPodium.sort((a, b) => {
        const timestampA = parseInt(a.id.split('-')[1] || '0');
        const timestampB = parseInt(b.id.split('-')[1] || '0');
        return timestampB - timestampA; // Orden descendente
      });
      
      // Mantener solo el edge más reciente, eliminar los anteriores
      edgesToRemove.push(...sortedEdges.slice(1));
    }
  });

  return {
    valid: edgesToRemove.length === 0,
    edgesToRemove,
  };
}
```

#### **Integración en onConnect**
```typescript
// Validación especial para podios: solo permitir 1 edge de entrada
const targetNode = nodes.find((n) => n.id === params.target);
if (targetNode?.data.type === "sink" && 
    (targetNode.data as GraphNode).sinkConfig?.sinkType === "podium") {
  
  // Usar la función de utilidad para validar podios
  const graphNodes = nodes.map((n) => n.data as GraphNode);
  const graphEdges = newEdges.map((e) => e.data as GraphEdge);
  const podiumValidation = validatePodiumEdges(graphNodes, graphEdges);
  
  if (!podiumValidation.valid && podiumValidation.edgesToRemove.length > 0) {
    // Eliminar los edges anteriores
    newEdges = newEdges.filter((e) => !podiumValidation.edgesToRemove.includes(e.data as GraphEdge));
    
    // Agregar al historial la eliminación de edges
    podiumValidation.edgesToRemove.forEach((edge) => {
      addToHistory("DELETE_EDGE", {
        edgeId: edge.id,
        beforeState: edge,
      });
    });
  }
}
```

### Lógica de Labels
```typescript
// Para esports competitivos
if (esport !== "default") {
  if (currentCondition.field === "score" && currentCondition.operator === ">") {
    if (currentCondition.value === 0) return "BO1";
    if (currentCondition.value === 1) return "BO3";
    if (currentCondition.value === 2) return "BO5";
  }
}

// Para esport default
if (currentCondition?.field === "default" || isDefault) {
  if (esport !== "default") {
    return "Derrota"; // En lugar de "default"
  }
  return "default";
}
```

### Mapeo del Selector a Condiciones
```typescript
// Cuando el usuario selecciona "Ganador BO1"
if (value === "bo1") {
  setCondition({
    field: "score",
    operator: ">",
    value: 0,
  });
}

// Cuando el usuario selecciona "Ganador BO3"
if (value === "bo3") {
  setCondition({
    field: "score",
    operator: ">",
    value: 1,
  });
}

// Cuando el usuario selecciona "Ganador BO5"
if (value === "bo5") {
  setCondition({
    field: "score",
    operator: ">",
    value: 2,
  });
}

// Cuando el usuario selecciona "Derrota"
if (value === "default") {
  setCondition({
    field: "default",
    operator: ">=",
    value: 0,
  });
}
```

### Configuración de Edges
```typescript
// Edge de victoria BO1
{
  field: "score",
  operator: ">",
  value: 0
}

// Edge de victoria BO3
{
  field: "score",
  operator: ">",
  value: 1
}

// Edge de victoria BO5
{
  field: "score",
  operator: ">",
  value: 2
}

// Edge de derrota
{
  field: "default"
}
```

## Beneficios de la Implementación

1. **Claridad Visual**: Los edges muestran información relevante al esport
2. **Interfaz Intuitiva**: Selector simple para esports competitivos
3. **Consistencia**: Sistema uniforme para todos los esports competitivos
4. **Flexibilidad**: Los esports flexibles mantienen su sistema original
5. **Automático**: Los labels se generan automáticamente según la condición
6. **Separación de Responsabilidades**: UI simple, lógica compleja interna

## Casos de Uso

### Torneo de CS2
- **Match Final**: 2 equipos compiten
- **Edge Ganador**: Seleccionar "Ganador BO3" → se muestra "BO3" (score > 1)
- **Edge Perdedor**: Seleccionar "Derrota" → se muestra "Derrota"

### Torneo de Valorant
- **Match Semifinal**: 2 equipos compiten
- **Edge Ganador**: Seleccionar "Ganador BO5" → se muestra "BO5" (score > 2)
- **Edge Perdedor**: Seleccionar "Derrota" → se muestra "Derrota"

### Torneo de Fortnite
- **Match Battle Royale**: N equipos compiten (configurable)
- **Edge Ganador**: 
  - **Victoria por Posición**: Configurable (position <= N, position >= N, etc.)
  - **Victoria por Score**: Configurable (score >= N, score <= N, etc.)
- **Edge Perdedor**: Seleccionar "Derrota" → se muestra "Derrota"

#### **Labels Descriptivos para Fortnite**

**Por Posición:**
- `position <= 10` → **"Top 10"**
- `position < 10` → **"Top 9"**
- `position >= 5` → **"Posición 5 o mejor"**
- `position > 5` → **"Posición 6 o mejor"**
- `position == 1` → **"Posición 1"**
- `position != 1` → **"No posición 1"**

**Por Score:**
- `score >= 50` → **"Score 50 o más"**
- `score > 50` → **"Score 51 o más"**
- `score <= 100` → **"Score 100 o menos"**
- `score < 100` → **"Score 99 o menos"**
- `score == 75` → **"Score exacto 75"**
- `score != 75` → **"Score diferente de 75"**
