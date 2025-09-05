export type NodeType = "match" | "sink";

// Nuevos tipos para esports
export type EsportType =
  | "cs2"
  | "valorant"
  | "fifa"
  | "clash_royale"
  | "teamfight_tactics"
  | "fortnite";

export type EsportConfiguration = {
  maxTeamsPerMatch: number;
  edgeLabels: {
    winner: string;
    loser: string;
    bo1?: string;
    bo3?: string;
    bo5?: string;
  };
  validationRules: {
    allowMultipleTeams: boolean;
    requireEvenTeams: boolean;
    maxMatchesPerTeam?: number;
  };
};

export type MatchModalidad = "presencial" | "online";

export type MatchConfiguration = {
  capacity: number;
  modalidad: MatchModalidad;
  scheduledDate?: Date;
  scheduledTime?: string; // formato HH:mm
  title?: string; // título del match (ej: Final, Semifinal, Cuartos)
};

// =========================
// Conditions (disparadores)
// =========================
export type ConditionOperator = ">=" | "<=" | "==" | "!=" | ">" | "<";

export type DefaultCondition = {
  field: "default";
  operator: ">=";
  value: 0;
};

export type ScoreCondition = {
  field: "score";
  operator: ConditionOperator;
  value: number;
};

export type PositionCondition = {
  field: "position";
  operator: ConditionOperator;
  value: number;
};

export type EdgeCondition =
  | DefaultCondition
  | ScoreCondition
  | PositionCondition;

// =========================
// Allocation (asignación)
// =========================
export type EdgeAllocationMode = "DIRECT_SLOT" | "FILL_AVAILABLE" | "BAG";

export type DirectSlotAllocation = {
  mode: "DIRECT_SLOT";
  /**
   * Slot destino fijo. Úsalo cuando el nodo destino tiene slots semánticos
   * (p.ej. podio oro/plata/bronce).
   */
  toSlotIndex: number;
};

export type FillAvailableAllocation = {
  mode: "FILL_AVAILABLE"; // ocupar el primer slot libre (determinista por índice)
};

export type BagAllocation = {
  mode: "BAG"; // no ocupa slot; se almacena como entrada/cola del nodo destino
};

export type EdgeAllocation =
  | DirectSlotAllocation
  | FillAvailableAllocation
  | BagAllocation;

// =========================
// Edge Allocation por tipo de nodo destino
// =========================
export type EdgeAllocationByNodeType = {
  // Para nodos de eliminación: siempre BAG
  eliminacion: BagAllocation;
  // Para nodos de podio: siempre DIRECT_SLOT con posición específica
  podium: DirectSlotAllocation;
  // Para nodos match: siempre FILL_AVAILABLE
  match: FillAvailableAllocation;
};

// Helper para determinar el tipo de asignación basado en el nodo destino
export type EdgeAllocationStrategy = {
  fromNodeType: NodeType;
  toNodeType: NodeType;
  toNodeConfig?: SinkConfiguration | MatchConfiguration;
  allocation: EdgeAllocation;
};

// =========================
// Sinks
// =========================
export type SinkType = "podium" | "eliminacion";

export type SinkConfiguration = {
  sinkType: SinkType;
  position?: number; // Para podios: posición en el ranking (1, 2, 3...)
  places?: number; // Para podios: cantidad de lugares
  slots: number; // Número de slots disponibles en el sink
};

// =========================
// Go backend payload (first impl)
// =========================
export type GoBackendGraph = {
  nodes: Array<{
    id: string;
    type: NodeType;
    esport: string;
    capacity: number;
    config: Record<string, unknown> | null;
  }>;
  edges: Array<{
    id: string;
    fromNode: string;
    outcome: string;
    toNode?: string;

    // Primera implementación: condición + política de asignación obligatorias
    condition: EdgeCondition;
    allocation: EdgeAllocation;
  }>;
  slots?: Array<{
    node_id: string;
    slot_index: number;
    participant_id?: string;
    source_node_id?: string;
    source_outcome?: string;
  }> | null;
};

// =========================
// Config de nodos (UI)
// =========================
export type NodeConfiguration =
  | { type: "sink"; config: SinkConfiguration }
  | { type: "match"; config: MatchConfiguration };

// =========================
// Grafo que consume el UI
// =========================
export type GraphNode = {
  id: string;
  type: NodeType;
  // capacity solo para nodos match, no para sinks
  capacity?: number;
  slots: Array<{
    index: number;
    participantId?: string;
    sourceNodeId?: string;
    sourceOutcome?: string;
  }>;
  status?: "empty" | "pending" | "ready" | "live" | "finished";
  // Propiedad unificada para configuración de nodos
  config?: SinkConfiguration | MatchConfiguration;
  // Nuevas propiedades para edición
  editable?: boolean;
  position?: { x: number; y: number };
};

export type GraphEdge = {
  id: string;
  fromNode: string;
  outcome: string;
  toNode?: string;

  /** Dispara el flujo (ej: position <= 5, score > 0, default) */
  condition: EdgeCondition;

  /** Política de asignación en el nodo destino */
  allocation: EdgeAllocation;

  /**
   * UI-only: handle visual (p.ej. "sink-podium-0").
   * No tiene semántica; se puede derivar desde allocation DIRECT_SLOT.
   */
  targetHandle?: string;

  editable?: boolean;

  // Lógica de switch por defecto
  isDefault?: boolean;

  // Información del nodo destino para determinar asignación automática
  toNodeType?: NodeType;
  toNodeConfig?: SinkConfiguration | MatchConfiguration;
};

// =========================
// Export / Graph wrappers
// =========================
export type TournamentData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type TournamentGraph = {
  version: 1;
  tournamentId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  // Nuevas propiedades para configuración global
  editable?: boolean;
  esport: EsportType; // Ahora es obligatorio
  metadata?: {
    createdAt?: string;
    lastModified?: string;
    author?: string;
    description?: string;
  };
};

// =========================
// Historial
// =========================
export type HistoryActionType =
  | "ADD_NODE"
  | "PASTE_NODE"
  | "PASTE_MULTIPLE"
  | "DELETE_NODE"
  | "DELETE_MULTIPLE"
  | "EDIT_NODE"
  | "ADD_EDGE"
  | "DELETE_EDGE"
  | "EDIT_EDGE"
  | "MOVE_NODE";

export type HistoryAction = {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  data: Record<string, unknown>;
};

export type HistoryState = {
  actions: HistoryAction[];
  currentIndex: number;
};

// =========================
// Type guards helpers
// =========================
export function isSinkConfiguration(
  config: unknown
): config is SinkConfiguration {
  return Boolean(config && typeof config === "object" && "sinkType" in config);
}

export function isMatchConfiguration(
  config: unknown
): config is MatchConfiguration {
  return Boolean(config && typeof config === "object" && "capacity" in config);
}

export function isDirectSlotAllocation(
  a: EdgeAllocation
): a is DirectSlotAllocation {
  return a?.mode === "DIRECT_SLOT";
}

// =========================
// Helper functions para determinar asignación automática
// =========================

/**
 * Determina automáticamente el tipo de asignación basado en el nodo destino
 */
export function getEdgeAllocationForNodeType(
  toNodeType: NodeType,
  toNodeConfig?: SinkConfiguration | MatchConfiguration
): EdgeAllocation {
  if (
    toNodeType === "sink" &&
    toNodeConfig &&
    isSinkConfiguration(toNodeConfig)
  ) {
    // Para sinks, determinar por tipo de sink
    if (toNodeConfig.sinkType === "eliminacion") {
      return { mode: "BAG" };
    } else if (toNodeConfig.sinkType === "podium") {
      // Para podio, usar DIRECT_SLOT con la posición correspondiente
      const position = toNodeConfig.position || 1;
      return {
        mode: "DIRECT_SLOT",
        toSlotIndex: position - 1, // Convertir posición (1-based) a índice (0-based)
      };
    }
  } else if (toNodeType === "match") {
    // Para nodos match, usar FILL_AVAILABLE
    return { mode: "FILL_AVAILABLE" };
  }

  // Fallback por defecto
  return { mode: "FILL_AVAILABLE" };
}

/**
 * Crea una estrategia de asignación completa para un edge
 */
export function createEdgeAllocationStrategy(
  fromNodeType: NodeType,
  toNodeType: NodeType,
  toNodeConfig?: SinkConfiguration | MatchConfiguration
): EdgeAllocationStrategy {
  return {
    fromNodeType,
    toNodeType,
    toNodeConfig,
    allocation: getEdgeAllocationForNodeType(toNodeType, toNodeConfig),
  };
}

/**
 * Valida si una asignación es apropiada para el tipo de nodo destino
 */
export function validateEdgeAllocation(
  allocation: EdgeAllocation,
  toNodeType: NodeType,
  toNodeConfig?: SinkConfiguration | MatchConfiguration
): { isValid: boolean; reason?: string } {
  const expectedAllocation = getEdgeAllocationForNodeType(
    toNodeType,
    toNodeConfig
  );

  if (allocation.mode !== expectedAllocation.mode) {
    return {
      isValid: false,
      reason: `Tipo de asignación incorrecto. Esperado: ${expectedAllocation.mode}, actual: ${allocation.mode}`,
    };
  }

  // Validación adicional para DIRECT_SLOT
  if (
    allocation.mode === "DIRECT_SLOT" &&
    expectedAllocation.mode === "DIRECT_SLOT"
  ) {
    const actualSlot = (allocation as DirectSlotAllocation).toSlotIndex;
    const expectedSlot = (expectedAllocation as DirectSlotAllocation)
      .toSlotIndex;

    if (actualSlot !== expectedSlot) {
      return {
        isValid: false,
        reason: `Slot incorrecto. Esperado: ${expectedSlot}, actual: ${actualSlot}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Crea un edge con asignación automática basada en el nodo destino
 */
export function createEdgeWithAutoAllocation(
  id: string,
  fromNode: string,
  outcome: string,
  toNode: string,
  toNodeType: NodeType,
  toNodeConfig?: SinkConfiguration | MatchConfiguration,
  condition: EdgeCondition = { field: "default", operator: ">=", value: 0 },
  additionalProps: Partial<GraphEdge> = {}
): GraphEdge {
  const allocation = getEdgeAllocationForNodeType(toNodeType, toNodeConfig);

  return {
    id,
    fromNode,
    outcome,
    toNode,
    condition,
    allocation,
    toNodeType,
    toNodeConfig,
    editable: true,
    ...additionalProps,
  };
}

/**
 * Actualiza la asignación de un edge basándose en el nodo destino
 */
export function updateEdgeAllocationForNodeType(
  edge: GraphEdge,
  toNodeType: NodeType,
  toNodeConfig?: SinkConfiguration | MatchConfiguration
): GraphEdge {
  const newAllocation = getEdgeAllocationForNodeType(toNodeType, toNodeConfig);

  return {
    ...edge,
    toNodeType,
    toNodeConfig,
    allocation: newAllocation,
  };
}
