export type NodeType = "match" | "sink";

export type MatchModalidad = "presencial" | "online";

export type MatchConfiguration = {
  capacity: number;
  modalidad: MatchModalidad;
  scheduledDate?: Date;
  scheduledTime?: string; // formato HH:mm
  title?: string; // título del match (ej: Final, Semifinal, Cuartos)
};

export type PhaseSink = {
  kind: string;
  podiumPos?: number;
  reason?: string;
};

// Nuevos tipos para funcionalidades de edición
export type ConditionOperator = ">=" | "<=" | "==" | "!=" | ">" | "<";

export type EdgeCondition = {
  operator: ConditionOperator;
  value: number;
  field: "points" | "position" | "score" | "default";
};

export type SinkType = "disqualification" | "qualification" | "podium";

export type SinkConfiguration = {
  sinkType: SinkType;
  position?: number; // Para podium positions
  reason?: string; // Para disqualifications
  threshold?: number; // Para qualifications
};

// Tipo que viene del backend de Go
export type GoBackendGraph = {
  nodes: Array<{
    id: string;
    phase_id: string;
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
    sink?: PhaseSink;
  }>;
  slots?: Array<{
    node_id: string;
    slot_index: number;
    participant_id?: string;
    source_node_id?: string;
    source_outcome?: string;
  }> | null;
};

// Tipo que usa el componente (simplificado)
export type GraphNode = {
  id: string;
  phaseId: string;
  type: NodeType;
  capacity: number;
  slots: Array<{
    index: number;
    participantId?: string;
    sourceNodeId?: string;
    sourceOutcome?: string;
  }>;
  status?: "empty" | "pending" | "ready" | "live" | "finished";
  config?: Record<string, unknown>;
  // Nuevas propiedades para edición
  editable?: boolean;
  sinkConfig?: SinkConfiguration;
  matchConfig?: MatchConfiguration;
  position?: { x: number; y: number };
};

export type GraphEdge = {
  id: string;
  fromNode: string;
  outcome: string;
  toNode?: string;
  sink?: PhaseSink;
  // Nuevas propiedades para condiciones editables
  condition?: EdgeCondition;
  editable?: boolean;
  // Nueva propiedad para lógica de switch
  isDefault?: boolean;
};

export type TournamentGraph = {
  version: 1;
  tournamentId: string;
  phaseId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  // Nuevas propiedades para configuración global
  editable?: boolean;
  esport?: string; // Movido a nivel grafo/torneo
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
