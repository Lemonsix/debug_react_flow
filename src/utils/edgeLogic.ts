import type { Edge } from "@xyflow/react";
import type { GraphEdge, GraphNode } from "../types";

export interface EdgeSwitchLogic {
  isDefault: boolean;
  isEditable: boolean;
  color: string;
  label: string;
}

/**
 * Determina qué edge debe ser el default para un nodo
 * El primer edge (por orden de creación) debe ser default
 */
export function getDefaultEdgeForNode(
  nodeId: string,
  allEdges: Edge[]
): string | null {
  const nodeEdges = allEdges
    .filter((edge) => edge.source === nodeId)
    .sort((a, b) => {
      // Ordenar por timestamp de creación o ID
      const timestampA = extractTimestamp(a.id);
      const timestampB = extractTimestamp(b.id);
      return timestampA - timestampB;
    });

  return nodeEdges.length > 0 ? nodeEdges[0].id : null;
}

/**
 * Extrae timestamp del ID del edge para determinar orden de creación
 */
function extractTimestamp(edgeId: string): number {
  const match = edgeId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Determina el color del edge basado en el tipo de sink de destino
 */
export function getEdgeColor(targetNode: GraphNode | undefined): string {
  // Si no hay nodo destino, usar color por defecto
  if (!targetNode || targetNode.type !== "sink") {
    return "#AAAAAA"; // Color por defecto para edges normales
  }

  // Determinar color según el tipo de sink
  const sinkType = targetNode.sinkConfig?.sinkType;
  switch (sinkType) {
    case "disqualification":
      return "#fc5f53"; // Rojo para eliminación
    case "podium":
      return "#44c753"; // Verde para podio
    case "qualification":
      return "#2563EB"; // Azul para calificación
    default:
      return "#AAAAAA"; // Color por defecto
  }
}

/**
 * Determina la lógica completa del edge (default, editable, color, label)
 */
export function getEdgeSwitchLogic(
  edge: Edge,
  allEdges: Edge[],
  targetNode: GraphNode | undefined
): EdgeSwitchLogic {
  const sourceNodeId = edge.source;
  const defaultEdgeId = getDefaultEdgeForNode(sourceNodeId, allEdges);
  const isDefault = edge.id === defaultEdgeId;

  // Un edge es editable solo si NO es default, O si es el único edge del nodo
  const sourceEdges = allEdges.filter((e) => e.source === sourceNodeId);
  const isOnlyEdge = sourceEdges.length === 1;
  const isEditable = !isDefault || isOnlyEdge;

  const color = getEdgeColor(targetNode);

  // Label: mostrar "default" si es default o si el campo es "default", o la condición si no lo es
  let label = "default";
  const edgeData = edge.data as GraphEdge;

  if (edgeData?.condition?.field === "default" || isDefault) {
    label = "default";
  } else if (
    edgeData?.condition &&
    (edgeData.condition.field as string) !== "default"
  ) {
    label = `${edgeData.condition.field} ${edgeData.condition.operator} ${edgeData.condition.value}`;
  } else {
    label = edgeData?.outcome || "condition";
  }

  return {
    isDefault,
    isEditable,
    color,
    label,
  };
}

/**
 * Valida que siempre haya exactamente un edge default por nodo
 */
export function validateDefaultEdges(edges: Edge[]): void {
  const nodeGroups = new Map<string, Edge[]>();

  // Agrupar edges por nodo source
  edges.forEach((edge) => {
    const sourceId = edge.source;
    if (!nodeGroups.has(sourceId)) {
      nodeGroups.set(sourceId, []);
    }
    nodeGroups.get(sourceId)!.push(edge);
  });

  // Validar cada grupo
  nodeGroups.forEach((nodeEdges) => {
    if (nodeEdges.length === 0) return;

    const defaultEdges = nodeEdges.filter((edge) => {
      const edgeData = edge.data as GraphEdge;
      return edgeData?.isDefault === true;
    });

    // Si no hay default edge marcado, marcar el primero como default
    if (defaultEdges.length === 0 && nodeEdges.length > 0) {
      const firstEdge = nodeEdges.sort((a, b) => {
        const timestampA = extractTimestamp(a.id);
        const timestampB = extractTimestamp(b.id);
        return timestampA - timestampB;
      })[0];

      const edgeData = firstEdge.data as GraphEdge;
      edgeData.isDefault = true;
    }

    // Si hay múltiples default edges, mantener solo el primero
    if (defaultEdges.length > 1) {
      const sortedDefaults = defaultEdges.sort((a, b) => {
        const timestampA = extractTimestamp(a.id);
        const timestampB = extractTimestamp(b.id);
        return timestampA - timestampB;
      });

      // Desmarcar todos excepto el primero
      sortedDefaults.slice(1).forEach((edge) => {
        const edgeData = edge.data as GraphEdge;
        edgeData.isDefault = false;
      });
    }
  });
}
