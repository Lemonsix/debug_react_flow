/**
 * Ejemplo del JSON exportado después de remover campos del sistema
 */

// Ejemplo de JSON exportado (limpio, sin campos del sistema)
export const exportedJsonExample = {
  nodes: [
    {
      id: "semifinal-1",
      type: "match",
      capacity: 2,
      slots: [
        {
          index: 0,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 1,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
      ],
      status: "empty",
      config: {
        capacity: 2,
        modalidad: "online",
        title: "Semifinal 1",
      },
    },
    {
      id: "final",
      type: "match",
      capacity: 2,
      slots: [
        {
          index: 0,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 1,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
      ],
      status: "empty",
      config: {
        capacity: 2,
        modalidad: "online",
        title: "Final",
      },
    },
    {
      id: "podium",
      type: "sink",
      slots: [
        {
          index: 0,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 1,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 2,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
      ],
      status: "empty",
      config: {
        sinkType: "podium",
        places: 3,
        slots: 3,
      },
    },
    {
      id: "eliminacion",
      type: "sink",
      slots: [
        // 5 slots calculados automáticamente (8 equipos - 3 podio = 5 eliminación)
        {
          index: 0,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 1,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 2,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 3,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
        {
          index: 4,
          participantId: undefined,
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        },
      ],
      status: "empty",
      config: {
        sinkType: "eliminacion",
        reason: "Eliminado",
        slots: 5,
      },
    },
  ],
  edges: [
    {
      id: "edge-1",
      fromNode: "semifinal-1",
      toNode: "final",
      // ❌ REMOVIDO: outcome: "Ganador"
      // ❌ REMOVIDO: editable: true
      // ❌ REMOVIDO: isDefault: false
      condition: {
        field: "score",
        operator: ">",
        value: 0,
      },
      targetHandle: "sink-final-0",
    },
    {
      id: "edge-2",
      fromNode: "final",
      toNode: "podium",
      // ❌ REMOVIDO: outcome: "Ganador"
      // ❌ REMOVIDO: editable: true
      // ❌ REMOVIDO: isDefault: false
      condition: {
        field: "default",
        operator: ">=",
        value: 0,
      },
      targetHandle: "sink-podium-0",
    },
    {
      id: "edge-3",
      fromNode: "final",
      toNode: "eliminacion",
      // ❌ REMOVIDO: outcome: "Perdedor"
      // ❌ REMOVIDO: editable: true
      // ❌ REMOVIDO: isDefault: true
      condition: {
        field: "default",
        operator: ">=",
        value: 0,
      },
    },
  ],
};

/**
 * Comparación: Antes vs Después
 */
export const comparisonExample = {
  // ❌ ANTES (con campos del sistema)
  before: {
    edges: [
      {
        id: "edge-1",
        fromNode: "semifinal-1",
        toNode: "final",
        outcome: "Ganador", // ❌ Campo del sistema
        condition: { field: "score", operator: ">", value: 0 },
        editable: true, // ❌ Campo del sistema
        isDefault: false, // ❌ Campo del sistema
        targetHandle: "sink-final-0",
      },
    ],
  },

  // ✅ DESPUÉS (limpio, solo datos esenciales)
  after: {
    edges: [
      {
        id: "edge-1",
        fromNode: "semifinal-1",
        toNode: "final",
        condition: { field: "score", operator: ">", value: 0 },
        targetHandle: "sink-final-0",
      },
    ],
  },
};

/**
 * Campos removidos de los edges en la exportación
 */
export const removedEdgeFields = [
  "outcome", // Etiqueta del edge (ej: "Ganador", "Perdedor")
  "editable", // Si el edge es editable en la UI
  "isDefault", // Si es un edge por defecto del sistema
];

/**
 * Campos removidos de los nodos en la exportación
 */
export const removedNodeFields = [
  "position", // Posición en el canvas (x, y)
  "editable", // Si el nodo es editable en la UI
];

/**
 * Beneficios de la limpieza del JSON
 */
export const benefits = {
  "Tamaño reducido": "JSON más pequeño sin campos del sistema",
  Claridad: "Solo datos esenciales del torneo",
  Portabilidad: "Fácil importar en otros sistemas",
  Limpieza: "Sin metadatos internos del editor",
  Enfoque: "Solo lógica del torneo, no de la UI",
};

/**
 * Estructura final del JSON exportado
 */
export const finalStructure = {
  nodes: [
    {
      id: "string", // ✅ ID único del nodo
      type: "match" | "sink", // ✅ Tipo de nodo
      capacity: "number", // ✅ Solo para matches
      slots: "array", // ✅ Slots del nodo
      status: "string", // ✅ Estado del nodo
      config: "object", // ✅ Configuración específica
    },
  ],
  edges: [
    {
      id: "string", // ✅ ID único del edge
      fromNode: "string", // ✅ Nodo origen
      toNode: "string", // ✅ Nodo destino
      condition: "object", // ✅ Condición del edge
      targetHandle: "string", // ✅ Handle específico (opcional)
    },
  ],
};
