import type { GraphNode } from "../types";

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
