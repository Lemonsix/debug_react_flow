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

### Eliminación de "Points"
- ❌ **Antes**: Los edges se creaban con `field: "points"` (obsoleto)
- ✅ **Ahora**: Los edges se crean con `field: "score"` (estándar)
- 🔄 **Migración**: Todos los edges existentes se actualizan automáticamente

## Implementación Técnica

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
