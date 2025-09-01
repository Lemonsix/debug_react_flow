import { useEffect } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  type Edge,
  type Node,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";

import { type GraphNode, isSinkConfiguration } from "../types";

// elk layouting options can be found here:
// https://www.eclipse.org/elk/reference/algorithms/org-eclipse-elk-layered.html
const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.layered.spacing.edgeNodeBetweenLayers": "40",
  "elk.layered.spacing.nodeNodeBetweenLayers": "60",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
  "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  "elk.layered.nodePlacement.bk.fixedAlignment": "NONE",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
  "elk.layered.spacing.edgeEdge": "10",
  "elk.layered.spacing.nodeNode": "20",
  "elk.spacing.componentComponent": "80",
  "elk.spacing.nodeNode": "50",
  "elk.spacing.edgeEdge": "10",
  "elk.spacing.edgeNode": "20",
  "elk.spacing.labelLabel": "10",
  "elk.spacing.labelNode": "15",
  "elk.spacing.labelEdge": "15",
};

const elk = new ELK();

// uses elkjs to give each node a layouted position
export const getLayoutedNodes = async (nodes: GraphNode[], edges: Edge[]) => {
  const graph = {
    id: "root",
    layoutOptions,
    children: nodes.map((n) => {
      // Para nodos de match, crear ports para los handles
      const ports = [];

      if (n.type === "match") {
        // Agregar port principal del nodo
        ports.push({ id: n.id });

        // Agregar ports para los handles de entrada/salida
        for (let i = 0; i < n.capacity; i++) {
          ports.push({
            id: `match-${n.id}-${i}`,
            properties: {
              side: "WEST", // Handles de entrada a la izquierda
            },
          });
        }

        // Agregar ports para handles de salida
        ports.push({
          id: `match-${n.id}-out`,
          properties: {
            side: "EAST", // Handles de salida a la derecha
          },
        });
      } else if (n.type === "sink") {
        // Para nodos sink (podio), crear ports para cada posición
        ports.push({ id: n.id });

        const places =
          n.config && isSinkConfiguration(n.config) ? n.config.places || 3 : 3;
        for (let i = 0; i < places; i++) {
          ports.push({
            id: `sink-${n.id}-${i}`,
            properties: {
              side: "WEST", // Handles de entrada a la izquierda
            },
          });
        }
      }

      return {
        id: n.id,
        width: n.type === "sink" ? 120 : 150,
        height:
          n.type === "sink"
            ? Math.max(
                80,
                (n.config && isSinkConfiguration(n.config)
                  ? n.config.places || 3
                  : 3) * 30
              )
            : 80,
        properties: {
          "org.eclipse.elk.portConstraints": "FIXED_ORDER",
        },
        ports,
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.sourceHandle || e.source],
      targets: [e.targetHandle || e.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layoutedNode = layoutedGraph.children?.find(
      (lgNode) => lgNode.id === node.id
    );

    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? 0,
        y: layoutedNode?.y ?? 0,
      },
    };
  });

  return layoutedNodes;
};

export default function useLayoutNodes() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();

  useEffect(() => {
    if (nodesInitialized) {
      const layoutNodes = async () => {
        const layoutedNodes = await getLayoutedNodes(
          getNodes() as unknown as GraphNode[],
          getEdges()
        );

        setNodes(layoutedNodes as unknown as Node[]);
        fitView();
      };

      layoutNodes();
    }
  }, [nodesInitialized, getNodes, getEdges, setNodes, fitView]);

  return null;
}
