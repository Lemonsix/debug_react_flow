import { useState, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";

export function useConnectionState() {
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    isDefault: boolean;
  } | null>(null);

  // Determinar si el edge que se va a crear será default
  const determineIfDefault = useCallback(
    (sourceNodeId: string, _allNodes: Node[], allEdges: Edge[]): boolean => {
      // Si es el primer edge del nodo, será default
      const nodeEdges = allEdges.filter((edge) => edge.source === sourceNodeId);
      return nodeEdges.length === 0;
    },
    []
  );

  // Iniciar conexión
  const startConnection = useCallback(
    (nodeId: string, allNodes: Node[], allEdges: Edge[]) => {
      const isDefault = determineIfDefault(nodeId, allNodes, allEdges);
      setConnectionStart({ nodeId, isDefault });
    },
    [determineIfDefault]
  );

  // Finalizar conexión
  const endConnection = useCallback(() => {
    setConnectionStart(null);
  }, []);

  return {
    connectionStart,
    startConnection,
    endConnection,
    determineIfDefault,
  };
}
