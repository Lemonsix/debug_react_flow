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

## Esports Flexibles (Otros)

### Interfaz de Usuario
Para esports flexibles, mantienes la interfaz original con campos individuales:

```
┌─────────────────────────────────────────┐
│ [Default ▼] [≥] [0]                    │
│  • Default                             │
│  • Points                              │
│  • Position                            │
│  • Score                               │
└─────────────────────────────────────────┘
```

### Edge Default
- **Condición**: `field: "default"`
- **Label mostrado**: "default"
- **Tooltip**: "Los participantes que no cumplan con las otras condiciones del match irán por este flujo. Recomendado para derrotas"

### Edge de Puntos
- **Condición**: `field: "points", operator: ">=", value: 10`
- **Label mostrado**: "points >= 10"
- **Tooltip**: "Los participantes con puntos mayor o igual a 10 seguirán este camino"

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

### Torneo de Otros Esports
- **Match Grupal**: N equipos compiten
- **Edge Ganador**: Configurar manualmente `points >= 10`
- **Edge Perdedor**: Seleccionar "Default" → se muestra "default"
