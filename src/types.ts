export type NodeType = "match" | "sink";

// Nuevos tipos para esports
export type EsportType =
  | "cs2"
  | "valorant"
  | "fifa"
  | "clash-royale"
  | "teamfight-tactics"
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

// Nuevos tipos para funcionalidades de edición
export type ConditionOperator = ">=" | "<=" | "==" | "!=" | ">" | "<";

export type EdgeCondition = {
  operator: ConditionOperator;
  value: number;
  field: "position" | "score" | "default";
};

export type SinkType = "podium" | "eliminacion";

export type SinkConfiguration = {
  sinkType: SinkType;
  position?: number; // Para podios: posición en el ranking (1, 2, 3...)
  places?: number; // Para podios: cantidad de lugares (ej: 3 para 1º, 2º, 3º)
};

// Tipo que viene del backend de Go
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
  }>;
  slots?: Array<{
    node_id: string;
    slot_index: number;
    participant_id?: string;
    source_node_id?: string;
    source_outcome?: string;
  }> | null;
};

// Tipo para configuración de nodos (union discriminada)
export type NodeConfiguration =
  | { type: "sink"; config: SinkConfiguration }
  | { type: "match"; config: MatchConfiguration };

// Tipo que usa el componente (simplificado)
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
  // Propiedad para conectar a handles específicos (ej: handles del podio)
  targetHandle?: string;
  // Nuevas propiedades para condiciones editables
  condition?: EdgeCondition;
  editable?: boolean;
  // Nueva propiedad para lógica de switch
  isDefault?: boolean;
};

// Tipo para exportación del torneo (solo datos esenciales)
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

// Tipos para el sistema de historial
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

// Funciones helper para type guards
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
