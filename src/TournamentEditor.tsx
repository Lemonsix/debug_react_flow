import { useMemo, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import type { TournamentGraph, GraphNode, NodeType } from "./types";
import EditableNode from "./components/EditableNode";
import EditableEdge, { SimpleEdge } from "./components/EditableEdge";

const NODE_W = 400;
const NODE_H = 280;

// Tipos de nodos y edges
const nodeTypes = {
  editable: EditableNode,
};

const edgeTypes = {
  editable: EditableEdge,
  simple: SimpleEdge,
};

interface TournamentEditorProps {
  graph: TournamentGraph;
  editable?: boolean;
  onGraphChange?: (graph: TournamentGraph) => void;
}

export default function TournamentEditor({
  graph,
  editable = true,
  onGraphChange,
}: TournamentEditorProps) {
  const [isEditMode, setIsEditMode] = useState(editable);
  const [copiedNode, setCopiedNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Convertir grafo a formato React Flow
  const { rfNodes, rfEdges } = useMemo(() => {
    const rfNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: isEditMode ? "editable" : "default",
      data: { ...n, editable: isEditMode },
      position: n.position || { x: 0, y: 0 },
    }));

    const rfEdges: Edge[] = graph.edges
      .filter((e) => !!e.toNode)
      .map(
        (e): Edge => ({
          id: e.id,
          source: e.fromNode,
          target: e.toNode!,
          type: isEditMode ? "editable" : "simple",
          data: { ...e, editable: isEditMode },
          style: { strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed },
        })
      );

    // Aplicar layout con Dagre si no hay posiciones
    if (
      rfNodes.some(
        (n) => !n.position || (n.position.x === 0 && n.position.y === 0)
      )
    ) {
      const g = new dagre.graphlib.Graph();
      g.setGraph({
        rankdir: "LR",
        nodesep: 80,
        ranksep: 150,
        marginx: 60,
        marginy: 60,
      });
      g.setDefaultEdgeLabel(() => ({}));

      rfNodes.forEach((n) =>
        g.setNode(n.id, { width: NODE_W, height: NODE_H })
      );
      rfEdges.forEach((e) => g.setEdge(e.source, e.target));
      dagre.layout(g);

      rfNodes.forEach((n) => {
        const p = g.node(n.id);
        n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
      });
    }

    return { rfNodes, rfEdges };
  }, [graph, isEditMode]);

  // Estado para nodos y edges
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Actualizar cuando el grafo cambie, pero preservar posiciones actuales
  useMemo(() => {
    // Solo actualizar si es la primera carga o si el número de nodos cambió significativamente
    setNodes((currentNodes) => {
      // Si no hay nodos actuales, usar los nuevos
      if (currentNodes.length === 0) {
        return rfNodes;
      }

      // Si se agregaron nodos nuevos, mezclar manteniendo posiciones existentes
      const existingNodeIds = new Set(currentNodes.map((n) => n.id));
      const newNodes = rfNodes.filter((n) => !existingNodeIds.has(n.id));

      // Actualizar datos de nodos existentes pero mantener posiciones
      const updatedExistingNodes = currentNodes
        .map((currentNode) => {
          const rfNode = rfNodes.find((n) => n.id === currentNode.id);
          if (rfNode) {
            return {
              ...rfNode,
              position: currentNode.position, // Mantener posición actual
            };
          }
          return currentNode;
        })
        .filter((node) => rfNodes.some((n) => n.id === node.id)); // Solo mantener nodos que aún existen

      return [...updatedExistingNodes, ...newNodes];
    });

    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // Manejar conexiones entre nodos
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isEditMode) return;

      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: "editable",
        data: {
          id: `edge-${Date.now()}`,
          fromNode: params.source!,
          toNode: params.target!,
          outcome: "points >= 0",
          editable: true,
          condition: {
            field: "points" as const,
            operator: ">=" as const,
            value: 0,
          },
        },
        markerEnd: { type: MarkerType.ArrowClosed },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isEditMode, setEdges]
  );

  // Agregar nuevo nodo
  const addNewNode = useCallback(
    (nodeType: NodeType) => {
      const newId = `node-${Date.now()}`;
      const newNode: GraphNode = {
        id: newId,
        phaseId: graph.phaseId,
        type: nodeType,
        capacity: nodeType === "sink" ? 0 : 2,
        slots:
          nodeType === "sink"
            ? []
            : Array.from({ length: 2 }, (_, i) => ({ index: i })),
        editable: true,
        position: { x: 100, y: 100 },
        ...(nodeType === "sink" && {
          sinkConfig: {
            sinkType: "qualification" as const,
          },
        }),
      };

      const reactFlowNode: Node = {
        id: newId,
        type: "editable",
        data: newNode,
        position: { x: 100, y: 100 },
      };

      setNodes((nds) => [...nds, reactFlowNode]);

      if (onGraphChange) {
        const updatedGraph = {
          ...graph,
          nodes: [...graph.nodes, newNode],
        };
        onGraphChange(updatedGraph);
      }
    },
    [graph, setNodes, onGraphChange]
  );

  // Resetear layout
  const resetLayout = useCallback(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  // Manejar selección de nodos
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (isEditMode) {
        setSelectedNodeId(node.id);
        setSelectedEdgeId(null); // Deseleccionar edge si se selecciona nodo
      }
    },
    [isEditMode]
  );

  // Manejar selección de edges
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (isEditMode) {
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null); // Deseleccionar nodo si se selecciona edge
      }
    },
    [isEditMode]
  );

  // Copiar nodo seleccionado
  const copySelectedNode = useCallback(() => {
    if (selectedNodeId && isEditMode) {
      const nodeData = nodes.find((n) => n.id === selectedNodeId)?.data;
      if (nodeData) {
        setCopiedNode(nodeData);
      }
    }
  }, [selectedNodeId, nodes, isEditMode]);

  // Pegar nodo copiado
  const pasteNode = useCallback(() => {
    if (copiedNode && isEditMode) {
      const newId = `node-${Date.now()}`;

      // Calcular posición basada en la posición actual del nodo en React Flow, no en los datos del grafo
      const currentSelectedNode = nodes.find((n) => n.id === selectedNodeId);
      const basePosition = currentSelectedNode?.position ||
        copiedNode.position || { x: 100, y: 100 };

      const newNode: GraphNode = {
        ...copiedNode,
        id: newId,
        position: {
          x: basePosition.x + 50,
          y: basePosition.y + 50,
        },
        slots: copiedNode.slots.map((slot) => ({
          ...slot,
          participantId: undefined, // Limpiar participantes en la copia
          sourceNodeId: undefined,
          sourceOutcome: undefined,
        })),
      };

      const reactFlowNode: Node = {
        id: newId,
        type: "editable",
        data: newNode,
        position: {
          x: basePosition.x + 50,
          y: basePosition.y + 50,
        },
      };

      // Solo agregar el nuevo nodo, sin tocar los existentes
      setNodes((currentNodes) => [...currentNodes, reactFlowNode]);

      if (onGraphChange) {
        const updatedGraph = {
          ...graph,
          nodes: [...graph.nodes, newNode],
        };
        onGraphChange(updatedGraph);
      }

      // Seleccionar el nodo recién pegado
      setSelectedNodeId(newId);
    }
  }, [
    copiedNode,
    isEditMode,
    setNodes,
    graph,
    onGraphChange,
    nodes,
    selectedNodeId,
  ]);

  // Eliminar nodo seleccionado
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId && isEditMode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNodeId && edge.target !== selectedNodeId
        )
      );

      if (onGraphChange) {
        const updatedGraph = {
          ...graph,
          nodes: graph.nodes.filter((n) => n.id !== selectedNodeId),
          edges: graph.edges.filter(
            (e) => e.fromNode !== selectedNodeId && e.toNode !== selectedNodeId
          ),
        };
        onGraphChange(updatedGraph);
      }

      setSelectedNodeId(null);
    }
  }, [selectedNodeId, isEditMode, setNodes, setEdges, graph, onGraphChange]);

  // Eliminar edge seleccionado
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId && isEditMode) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));

      if (onGraphChange) {
        const updatedGraph = {
          ...graph,
          edges: graph.edges.filter((e) => e.id !== selectedEdgeId),
        };
        onGraphChange(updatedGraph);
      }

      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, isEditMode, setEdges, graph, onGraphChange]);

  // Manejar keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          copySelectedNode();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          pasteNode();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedNodeId) {
          deleteSelectedNode();
        } else if (selectedEdgeId) {
          deleteSelectedEdge();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditMode,
    copySelectedNode,
    pasteNode,
    deleteSelectedNode,
    deleteSelectedEdge,
    selectedNodeId,
    selectedEdgeId,
  ]);

  // Exportar configuración
  const exportConfiguration = useCallback(() => {
    const exportData = {
      ...graph,
      nodes: nodes.map((n) => ({
        ...n.data,
        position: n.position,
      })),
      edges: edges.map((e) => e.data),
      metadata: {
        ...graph.metadata,
        lastModified: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tournament-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [graph, nodes, edges]);

  return (
    <div className="h-[80vh] w-full rounded-lg border border-gray-200 bg-gray-50 relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        {/* Controles de modo */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`
              px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${
                isEditMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {isEditMode ? "✏️ Edit Mode" : "👁️ View Mode"}
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              {/* Botones para agregar nodos */}
              <div className="flex gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => addNewNode("match")}
                  className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                >
                  + Match
                </button>
                <button
                  onClick={() => addNewNode("aggregator")}
                  className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  + Aggregator
                </button>
                <button
                  onClick={() => addNewNode("sink")}
                  className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                >
                  + Sink
                </button>
              </div>

              {/* Exportar */}
              <button
                onClick={exportConfiguration}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 transition-colors"
              >
                💾 Export JSON
              </button>
            </>
          )}

          {/* Reset Layout */}
          <button
            onClick={resetLayout}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
          >
            ↻ Reset Layout
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={isEditMode}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-transparent"
      >
        <MiniMap pannable zoomable nodeColor="#6b7280" />
        <Controls />
        <Background />
      </ReactFlow>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-sm p-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Nodes: {nodes.length}</span>
          <span>Edges: {edges.length}</span>
          <span>Mode: {isEditMode ? "Edit" : "View"}</span>
          {graph.esport && <span>Esport: {graph.esport.toUpperCase()}</span>}
          {isEditMode && (
            <>
              {selectedNodeId && (
                <span>Selected Node: {selectedNodeId.slice(0, 8)}...</span>
              )}
              {selectedEdgeId && (
                <span>Selected Edge: {selectedEdgeId.slice(0, 8)}...</span>
              )}
              {copiedNode && (
                <span className="text-green-600">📋 Node copied</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Help text for shortcuts */}
      {isEditMode && (
        <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-2 text-xs text-blue-700">
          <div>
            💡 <strong>Keyboard Shortcuts:</strong>
          </div>
          <div>• Click node/edge to select</div>
          <div>• Ctrl+C to copy node</div>
          <div>• Ctrl+V to paste node</div>
          <div>• Delete to remove selected</div>
        </div>
      )}
    </div>
  );
}
