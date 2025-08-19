export type NodeType = 'match' | 'aggregator' | 'sink';

export type PhaseSink = {
  kind: string;
  podiumPos?: number;
  reason?: string;
};

// Tipo que viene del backend de Go
export type GoBackendGraph = {
  nodes: Array<{
    id: string;
    phase_id: string;
    type: NodeType;
    esport: string;
    capacity: number;
    config: any;
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
  esport: string;
  capacity: number;
  slots: Array<{
    index: number;
    participantId?: string;
    sourceNodeId?: string;
    sourceOutcome?: string;
  }>;
  status?: 'empty' | 'pending' | 'ready' | 'live' | 'finished';
  config?: any;
};

export type GraphEdge = {
  id: string;
  fromNode: string;
  outcome: string;
  toNode?: string;
  sink?: PhaseSink;
};

export type TournamentGraph = {
  version: 1;
  tournamentId: string;
  phaseId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};
