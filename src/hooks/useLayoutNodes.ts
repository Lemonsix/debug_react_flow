import { useCallback } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { useReactFlow, type Node } from "@xyflow/react";

import { type GraphNode, isSinkConfiguration } from "../types";

const elk = new ELK();

// Hook simple siguiendo exactamente el patrón de React Flow
export default function useLayoutNodes() {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

  const getLayoutedElements = useCallback(
    (options = {}) => {
      const defaultOptions = {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT", // Dirección horizontal para torneos
        "elk.layered.spacing.nodeNodeBetweenLayers": "150", // Más espacio entre capas
        "elk.layered.spacing.edgeNodeBetweenLayers": "50", // Espacio entre edges y nodos
        "elk.spacing.nodeNode": "100", // Más espacio entre nodos
        "elk.spacing.componentComponent": "200", // Espacio entre componentes
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP", // Minimizar cruces
        "elk.layered.layering.strategy": "LONGEST_PATH", // Estrategia de capas
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX", // Posicionamiento de nodos
        "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST", // Romper ciclos
        "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES", // Considerar orden del modelo
      };

      const currentNodes = getNodes() as unknown as GraphNode[];
      const currentEdges = getEdges();

      if (currentNodes.length === 0) return;

      // Detectar complejidad del grafo y ajustar configuración
      const nodeCount = currentNodes.length;
      const edgeCount = currentEdges.length;
      const isComplexGraph = nodeCount > 8 || edgeCount > 12;

      // Configuración adaptativa basada en la complejidad
      const adaptiveOptions = isComplexGraph
        ? {
            "elk.layered.spacing.nodeNodeBetweenLayers": "200", // Más espacio para grafos complejos
            "elk.spacing.nodeNode": "120",
            "elk.spacing.componentComponent": "300",
            "elk.layered.crossingMinimization.strategy": "INTERACTIVE", // Mejor para grafos complejos
          }
        : {};

      const layoutOptions = {
        ...defaultOptions,
        ...adaptiveOptions,
        ...options,
      };

      const graph = {
        id: "root",
        layoutOptions: layoutOptions,
        children: currentNodes.map((node) => ({
          ...node,
          width: node.type === "sink" ? 120 : 150,
          height:
            node.type === "sink"
              ? Math.max(
                  80,
                  (node.config && isSinkConfiguration(node.config)
                    ? node.config.places || 3
                    : 3) * 30
                )
              : 80,
        })),
        edges: currentEdges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      };

      console.log(
        `Applying ELK layout to ${nodeCount} nodes, ${edgeCount} edges (complex: ${isComplexGraph})`
      );

      elk
        .layout(graph)
        .then(({ children }) => {
          if (children) {
            console.log("ELK layout completed successfully");

            // By mutating the children in-place we saves ourselves from creating a
            // needless copy of the nodes array.
            children.forEach(
              (node: {
                id: string;
                x?: number;
                y?: number;
                position?: { x: number; y: number };
              }) => {
                if (node.x !== undefined && node.y !== undefined) {
                  node.position = { x: node.x, y: node.y };
                }
              }
            );

            setNodes(children as unknown as Node[]);
            fitView();
          }
        })
        .catch((error) => {
          console.error("ELK layout failed:", error);
          // Fallback: mantener las posiciones actuales
        });
    },
    [getNodes, getEdges, setNodes, fitView]
  );

  return { getLayoutedElements };
}
