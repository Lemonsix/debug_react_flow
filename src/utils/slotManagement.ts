import type { GraphNode, GraphEdge } from "../types";

/**
 * Asigna un equipo a un slot específico de un nodo sink
 */
export function assignTeamToSlot(
  node: GraphNode,
  slotIndex: number,
  participantId: string,
  sourceNodeId?: string,
  sourceOutcome?: string
): GraphNode {
  if (node.type !== "sink") {
    throw new Error("Solo se pueden asignar equipos a nodos sink");
  }

  if (slotIndex < 0 || slotIndex >= node.slots.length) {
    throw new Error(
      `Índice de slot inválido: ${slotIndex}. El nodo tiene ${node.slots.length} slots`
    );
  }

  const updatedSlots = [...node.slots];
  updatedSlots[slotIndex] = {
    ...updatedSlots[slotIndex],
    participantId,
    sourceNodeId,
    sourceOutcome,
  };

  return {
    ...node,
    slots: updatedSlots,
  };
}

/**
 * Desasigna un equipo de un slot específico
 */
export function unassignTeamFromSlot(
  node: GraphNode,
  slotIndex: number
): GraphNode {
  if (node.type !== "sink") {
    throw new Error("Solo se pueden desasignar equipos de nodos sink");
  }

  if (slotIndex < 0 || slotIndex >= node.slots.length) {
    throw new Error(
      `Índice de slot inválido: ${slotIndex}. El nodo tiene ${node.slots.length} slots`
    );
  }

  const updatedSlots = [...node.slots];
  updatedSlots[slotIndex] = {
    ...updatedSlots[slotIndex],
    participantId: undefined,
    sourceNodeId: undefined,
    sourceOutcome: undefined,
  };

  return {
    ...node,
    slots: updatedSlots,
  };
}

/**
 * Encuentra el primer slot disponible en un nodo sink
 */
export function findFirstAvailableSlot(node: GraphNode): number | null {
  if (node.type !== "sink") {
    return null;
  }

  const availableSlot = node.slots.findIndex((slot) => !slot.participantId);
  return availableSlot === -1 ? null : availableSlot;
}

/**
 * Encuentra todos los slots ocupados en un nodo sink
 */
export function getOccupiedSlots(node: GraphNode): Array<{
  index: number;
  participantId: string;
  sourceNodeId?: string;
  sourceOutcome?: string;
}> {
  if (node.type !== "sink") {
    return [];
  }

  return node.slots
    .filter((slot) => slot.participantId)
    .map((slot) => ({
      index: slot.index,
      participantId: slot.participantId!,
      sourceNodeId: slot.sourceNodeId,
      sourceOutcome: slot.sourceOutcome,
    }));
}

/**
 * Encuentra todos los slots vacíos en un nodo sink
 */
export function getEmptySlots(node: GraphNode): Array<{
  index: number;
}> {
  if (node.type !== "sink") {
    return [];
  }

  return node.slots
    .filter((slot) => !slot.participantId)
    .map((slot) => ({
      index: slot.index,
    }));
}

/**
 * Verifica si un nodo sink tiene slots disponibles
 */
export function hasAvailableSlots(node: GraphNode): boolean {
  if (node.type !== "sink") {
    return false;
  }

  return node.slots.some((slot) => !slot.participantId);
}

/**
 * Obtiene el número de slots ocupados en un nodo sink
 */
export function getOccupiedSlotsCount(node: GraphNode): number {
  if (node.type !== "sink") {
    return 0;
  }

  return node.slots.filter((slot) => slot.participantId).length;
}

/**
 * Obtiene el número de slots vacíos en un nodo sink
 */
export function getEmptySlotsCount(node: GraphNode): number {
  if (node.type !== "sink") {
    return 0;
  }

  return node.slots.filter((slot) => !slot.participantId).length;
}

/**
 * Asigna un equipo al primer slot disponible
 */
export function assignTeamToFirstAvailableSlot(
  node: GraphNode,
  participantId: string,
  sourceNodeId?: string,
  sourceOutcome?: string
): GraphNode | null {
  const availableSlot = findFirstAvailableSlot(node);

  if (availableSlot === null) {
    return null; // No hay slots disponibles
  }

  return assignTeamToSlot(
    node,
    availableSlot,
    participantId,
    sourceNodeId,
    sourceOutcome
  );
}

/**
 * Simula el flujo de un torneo asignando equipos a slots según resultados
 */
export function simulateTournamentFlow(
  nodes: GraphNode[],
  matchResults: Array<{
    matchNodeId: string;
    winner: string;
    loser: string;
  }>
): GraphNode[] {
  const updatedNodes = [...nodes];

  for (const result of matchResults) {
    const matchNode = updatedNodes.find(
      (node) => node.id === result.matchNodeId
    );
    if (!matchNode || matchNode.type !== "match") {
      continue;
    }

    // Buscar nodos sink para asignar ganadores y perdedores
    const sinkNodes = updatedNodes.filter((node) => node.type === "sink");

    for (const sinkNode of sinkNodes) {
      if (hasAvailableSlots(sinkNode)) {
        // Asignar ganador al primer slot disponible
        const winnerAssignment = assignTeamToFirstAvailableSlot(
          sinkNode,
          result.winner,
          result.matchNodeId,
          "winner"
        );

        if (winnerAssignment) {
          const nodeIndex = updatedNodes.findIndex(
            (node) => node.id === sinkNode.id
          );
          updatedNodes[nodeIndex] = winnerAssignment;
        }

        // Asignar perdedor al siguiente slot disponible
        const loserAssignment = assignTeamToFirstAvailableSlot(
          sinkNode,
          result.loser,
          result.matchNodeId,
          "loser"
        );

        if (loserAssignment) {
          const nodeIndex = updatedNodes.findIndex(
            (node) => node.id === sinkNode.id
          );
          updatedNodes[nodeIndex] = loserAssignment;
        }

        break; // Solo asignar a un sink por match
      }
    }
  }

  return updatedNodes;
}

/**
 * Calcula la cantidad de equipos basándose en los matches iniciales
 * Los matches iniciales son aquellos que no tienen un match anterior conectado
 */
export function calculateTeamCount(
  nodes: GraphNode[],
  edges: GraphEdge[]
): number {
  const matchNodes = nodes.filter((node) => node.type === "match");

  // Encontrar matches iniciales (que no tienen edges de entrada)
  const initialMatches = matchNodes.filter((matchNode) => {
    const hasIncomingEdges = edges.some(
      (edge) => edge.toNode === matchNode.id && edge.outcome !== "default"
    );
    return !hasIncomingEdges;
  });

  // La cantidad de equipos es la suma de la capacidad de todos los matches iniciales
  const totalTeams = initialMatches.reduce((total, match) => {
    return total + (match.capacity || 0);
  }, 0);

  return totalTeams;
}

/**
 * Calcula la cantidad de slots de eliminación necesarios
 * Fórmula: Cantidad de equipos - Cantidad de slots del podio
 */
export function calculateEliminationSlots(
  nodes: GraphNode[],
  edges: GraphEdge[]
): number {
  const teamCount = calculateTeamCount(nodes, edges);

  // Encontrar nodos de podio y sumar sus slots
  const podiumNodes = nodes.filter(
    (node) =>
      node.type === "sink" &&
      node.config &&
      "sinkType" in node.config &&
      node.config.sinkType === "podium"
  );

  const podiumSlots = podiumNodes.reduce((total, podium) => {
    if (podium.config && "slots" in podium.config) {
      return total + (podium.config.slots || 0);
    }
    return total;
  }, 0);

  const eliminationSlots = teamCount - podiumSlots;

  // Asegurar que no sea negativo
  return Math.max(0, eliminationSlots);
}

/**
 * Calcula automáticamente los slots para todos los nodos sink
 */
export function calculateSinkSlots(
  nodes: GraphNode[],
  edges: GraphEdge[]
): {
  podiumSlots: number;
  eliminationSlots: number;
  teamCount: number;
} {
  const teamCount = calculateTeamCount(nodes, edges);
  const eliminationSlots = calculateEliminationSlots(nodes, edges);

  // Calcular slots del podio (suma de todos los nodos de podio)
  const podiumNodes = nodes.filter(
    (node) =>
      node.type === "sink" &&
      node.config &&
      "sinkType" in node.config &&
      node.config.sinkType === "podium"
  );

  const podiumSlots = podiumNodes.reduce((total, podium) => {
    if (podium.config && "slots" in podium.config) {
      return total + (podium.config.slots || 0);
    }
    return total;
  }, 0);

  return {
    teamCount,
    podiumSlots,
    eliminationSlots,
  };
}

/**
 * Actualiza un nodo de eliminación con la cantidad correcta de slots
 */
export function updateEliminationNodeSlots(
  node: GraphNode,
  requiredSlots: number
): GraphNode {
  if (node.type !== "sink") {
    throw new Error("Solo se pueden actualizar slots de nodos sink");
  }

  // Generar slots automáticamente
  const generatedSlots = Array.from({ length: requiredSlots }, (_, index) => ({
    index,
    participantId: undefined,
    sourceNodeId: undefined,
    sourceOutcome: undefined,
  }));

  return {
    ...node,
    slots: generatedSlots,
    config: {
      ...node.config,
      slots: requiredSlots,
    } as typeof node.config,
  };
}

/**
 * Valida que la configuración de slots sea correcta
 */
export function validateSlotConfiguration(
  nodes: GraphNode[],
  edges: GraphEdge[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    teamCount: number;
    podiumSlots: number;
    eliminationSlots: number;
    totalSinkSlots: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { teamCount, podiumSlots, eliminationSlots } = calculateSinkSlots(
    nodes,
    edges
  );

  // Calcular slots totales en sinks
  const sinkNodes = nodes.filter((node) => node.type === "sink");
  const totalSinkSlots = sinkNodes.reduce((total, sink) => {
    return total + sink.slots.length;
  }, 0);

  // Validaciones
  if (teamCount === 0) {
    errors.push(
      "No se encontraron matches iniciales para calcular la cantidad de equipos"
    );
  }

  if (podiumSlots === 0) {
    warnings.push("No se encontraron nodos de podio");
  }

  if (eliminationSlots < 0) {
    errors.push(
      `Los slots del podio (${podiumSlots}) exceden la cantidad de equipos (${teamCount})`
    );
  }

  if (totalSinkSlots !== teamCount) {
    warnings.push(
      `Los slots totales en sinks (${totalSinkSlots}) no coinciden con la cantidad de equipos (${teamCount})`
    );
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    stats: {
      teamCount,
      podiumSlots,
      eliminationSlots,
      totalSinkSlots,
    },
  };
}
