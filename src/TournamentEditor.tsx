import { useMemo, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeProps,
  type EdgeProps,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import type {
  TournamentGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  HistoryAction,
  HistoryActionType,
  HistoryState,
  EdgeCondition,
} from "./types";
import EditableNode from "./components/EditableNode";
import EditableEdge, { SimpleEdge } from "./components/EditableEdge";

// Tipo local para edges editables
interface EditableEdgeData extends GraphEdge {
  label?: string;
}

const NODE_W = 400;
const NODE_H = 280;
const MIN_DISTANCE = 150; // Distancia mínima para proximity connect

// Tipos de nodos y edges serán definidos dentro del componente

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
  const [copiedNode, setCopiedNode] = useState<GraphNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState>({
    actions: [],
    currentIndex: -1,
  });

  // Estado global para controlar qué elemento está siendo editado
  const [currentlyEditing, setCurrentlyEditing] = useState<{
    type: "node" | "edge" | null;
    id: string | null;
  }>({ type: null, id: null });

  // Funciones para manejar el estado de edición global
  const startEditing = useCallback((type: "node" | "edge", id: string) => {
    setCurrentlyEditing({ type, id });
  }, []);

  const stopEditing = useCallback(() => {
    setCurrentlyEditing({ type: null, id: null });
  }, []);

  const isCurrentlyEditing = useCallback(
    (type: "node" | "edge", id: string) => {
      return currentlyEditing.type === type && currentlyEditing.id === id;
    },
    [currentlyEditing]
  );

  // Sistema de historial
  const addToHistory = useCallback(
    (actionType: HistoryActionType, data: Record<string, unknown>) => {
      const action: HistoryAction = {
        id: `action-${Date.now()}`,
        type: actionType,
        timestamp: Date.now(),
        data,
      };

      setHistory((prev) => {
        // Truncar el historial desde el índice actual
        const newActions = prev.actions.slice(0, prev.currentIndex + 1);
        newActions.push(action);

        // Mantener solo los últimos 50 actions
        if (newActions.length > 50) {
          newActions.shift();
        }

        return {
          actions: newActions,
          currentIndex: newActions.length - 1,
        };
      });
    },
    []
  );

  // Convertir grafo a formato React Flow
  const { rfNodes, rfEdges } = useMemo(() => {
    const rfNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: editable ? "editable" : "default",
      data: { ...n, editable },
      position: n.position || { x: 0, y: 0 },
    }));

    const rfEdges: Edge[] = graph.edges
      .filter((e) => !!e.toNode)
      .map(
        (e): Edge => ({
          id: e.id,
          source: e.fromNode,
          target: e.toNode!,
          type: editable ? "editable" : "simple",
          data: { ...e, editable },
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
  }, [graph, editable]);

  // Estado para nodos y edges
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Proximity Connect: Encontrar el nodo más cercano para conectar automáticamente
  const getClosestEdge = useCallback((node: Node) => {
    // Usar nodos directamente en lugar de nodeLookup
    const draggedNode = nodes.find(n => n.id === node.id);
    if (!draggedNode) return null;

    const closestNode = nodes.reduce(
      (res, n) => {
        if (n.id !== draggedNode.id) {
          const dx = n.position.x - draggedNode.position.x;
          const dy = n.position.y - draggedNode.position.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {
            res.distance = d;
            res.node = n;
          }
        }

        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null as Node | null,
      }
    );

    if (!closestNode.node) {
      return null;
    }

    const closeNodeIsSource = closestNode.node.position.x < draggedNode.position.x;

    return {
      id: closeNodeIsSource
        ? `temp-${closestNode.node.id}-${node.id}`
        : `temp-${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
    };
  }, [nodes]);

  // Manejar arrastre de nodos para mostrar conexión temporal
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!editable) return;

      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          const tempEdge: Edge = {
            id: closeEdge.id,
            source: closeEdge.source,
            target: closeEdge.target,
            className: 'temp',
            style: { stroke: '#3b82f6', strokeDasharray: '5,5', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            data: {
              id: closeEdge.id,
              fromNode: closeEdge.source,
              toNode: closeEdge.target,
              outcome: "points >= 0",
              editable: false,
              condition: {
                field: "points" as const,
                operator: ">=" as const,
                value: 0,
              },
            },
          };
          nextEdges.push(tempEdge);
        }

        return nextEdges;
      });
    },
    [editable, getClosestEdge, setEdges]
  );

  // Finalizar arrastre y crear conexión real si está cerca
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!editable) return;

      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== 'temp');

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: closeEdge.source,
            target: closeEdge.target,
            type: "editable",
            data: {
              id: `edge-${Date.now()}`,
              fromNode: closeEdge.source,
              toNode: closeEdge.target,
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
          nextEdges.push(newEdge);

          // Agregar al historial
          addToHistory("ADD_EDGE", {
            edgeId: newEdge.id,
            afterState: newEdge,
          });
        }

        return nextEdges;
      });
    },
    [editable, getClosestEdge, setEdges, addToHistory]
  );

  // Función para actualizar condiciones de edges
  const handleEdgeConditionUpdate = useCallback(
    (edgeId: string, condition: EdgeCondition) => {
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  condition,
                },
              }
            : edge
        )
      );

      // Agregar al historial
      addToHistory("EDIT_EDGE", {
        edgeId,
        beforeState: edges.find((e) => e.id === edgeId)?.data,
        afterState: { ...edges.find((e) => e.id === edgeId)?.data, condition },
      });

      // Cerrar la edición del edge después de guardar
      stopEditing();
    },
    [setEdges, edges, addToHistory, stopEditing]
  );

  // Función para manejar cambios en nodos
  const handleNodeChange = useCallback(
    (nodeId: string, updates: Partial<GraphNode>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: { ...node.data, ...updates },
              }
            : node
        )
      );

      // Si el nodo se guarda, cerrar la edición
      if (updates.editable === false) {
        stopEditing();
      }
    },
    [setNodes, stopEditing]
  );

  const nodeTypes = useMemo(
    () => ({
      editable: (props: NodeProps<GraphNode>) => (
        <EditableNode
          data={props.data}
          onChange={(updates) => handleNodeChange(props.id, updates)}
          isConnectable={props.isConnectable}
          isEditing={isCurrentlyEditing("node", props.id)}
          onStartEditing={() => startEditing("node", props.id)}
          onStopEditing={stopEditing}
        />
      ),
    }),
    [handleNodeChange, isCurrentlyEditing, startEditing, stopEditing]
  );

  const edgeTypes = useMemo(
    () => ({
      editable: (props: EdgeProps<EditableEdgeData>) => (
        <EditableEdge
          {...props}
          onConditionUpdate={handleEdgeConditionUpdate}
          isEditing={isCurrentlyEditing("edge", props.id)}
          onStartEditing={() => startEditing("edge", props.id)}
          onStopEditing={stopEditing}
        />
      ),
      simple: SimpleEdge,
    }),
    [handleEdgeConditionUpdate, isCurrentlyEditing, startEditing, stopEditing]
  );

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

    // Solo actualizar edges si realmente cambiaron (no solo por agregar nodos)
    setEdges((currentEdges) => {
      // Si no hay edges actuales, usar los nuevos
      if (currentEdges.length === 0) {
        return rfEdges;
      }

      // Si el número de edges cambió, actualizar
      if (currentEdges.length !== rfEdges.length) {
        return rfEdges;
      }

      // Si los IDs de edges son diferentes, actualizar
      const currentEdgeIds = new Set(currentEdges.map((e) => e.id));
      const newEdgeIds = new Set(rfEdges.map((e) => e.id));
      const edgesChanged =
        currentEdgeIds.size !== newEdgeIds.size ||
        [...currentEdgeIds].some((id) => !newEdgeIds.has(id));

      if (edgesChanged) {
        return rfEdges;
      }

      // Mantener edges actuales si no cambiaron
      return currentEdges;
    });
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // Manejar conexiones entre nodos
  const onConnect = useCallback(
    (params: Connection) => {
      if (!editable) return;

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

      // Agregar al historial
      addToHistory("ADD_EDGE", {
        edgeId: newEdge.id,
        afterState: newEdge,
      });
    },
    [editable, setEdges, addToHistory]
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
            sinkType: "podium" as const,
            position: 1,
          },
        }),
        ...(nodeType === "match" && {
          matchConfig: {
            capacity: 2,
            modality: "presencial" as const,
            scheduledDate: undefined,
            scheduledTime: undefined,
          },
        }),
      };

      const reactFlowNode: Node = {
        id: newId,
        type: "editable",
        data: newNode,
        position: { x: 100, y: 100 },
      };

      // Solo agregar el nodo a React Flow, no actualizar el grafo global hasta export
      setNodes((nds) => [...nds, reactFlowNode]);

      // Agregar al historial
      addToHistory("ADD_NODE", {
        nodeId: newId,
        afterState: reactFlowNode,
      });
    },
    [graph, setNodes, addToHistory]
  );

  // Undo
  const undo = useCallback(() => {
    if (history.currentIndex < 0) return;

    const action = history.actions[history.currentIndex];

    switch (action.type) {
      case "ADD_NODE":
      case "PASTE_NODE":
        // Eliminar el nodo agregado
        if (action.data.nodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== action.data.nodeId));
        }
        break;

      case "DELETE_NODE":
        // Restaurar el nodo eliminado
        if (action.data.beforeState) {
          setNodes((nds) => [...nds, action.data.beforeState as Node]);
          if (action.data.edgesBeforeState) {
            setEdges((eds) => [
              ...eds,
              ...(action.data.edgesBeforeState as Edge[]),
            ]);
          }
        }
        break;

      case "EDIT_NODE":
        // Restaurar estado anterior del nodo
        if (action.data.nodeId && action.data.beforeState) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === action.data.nodeId
                ? { ...n, data: action.data.beforeState as GraphNode }
                : n
            )
          );
        }
        break;

      case "ADD_EDGE":
        // Eliminar el edge agregado
        if (action.data.edgeId) {
          setEdges((eds) => eds.filter((e) => e.id !== action.data.edgeId));
        }
        break;

      case "DELETE_EDGE":
        // Restaurar el edge eliminado
        if (action.data.beforeState) {
          setEdges((eds) => [...eds, action.data.beforeState as Edge]);
        }
        break;

      case "EDIT_EDGE":
        // Restaurar estado anterior del edge
        if (action.data.edgeId && action.data.beforeState) {
          setEdges((eds) =>
            eds.map((e) =>
              e.id === action.data.edgeId
                ? { ...e, data: action.data.beforeState as unknown }
                : e
            )
          );
        }
        break;

      case "MOVE_NODE":
        // Restaurar posición anterior
        if (action.data.nodeId && action.data.beforeState) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === action.data.nodeId
                ? {
                    ...n,
                    position: action.data.beforeState as {
                      x: number;
                      y: number;
                    },
                  }
                : n
            )
          );
        }
        break;
    }

    setHistory((prev) => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
  }, [history, setNodes, setEdges]);

  // Redo
  const redo = useCallback(() => {
    if (history.currentIndex >= history.actions.length - 1) return;

    const nextIndex = history.currentIndex + 1;
    const action = history.actions[nextIndex];

    switch (action.type) {
      case "ADD_NODE":
      case "PASTE_NODE":
        // Re-agregar el nodo
        if (action.data.afterState) {
          setNodes((nds) => [...nds, action.data.afterState as Node]);
        }
        break;

      case "DELETE_NODE":
        // Re-eliminar el nodo
        if (action.data.nodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== action.data.nodeId));
          if (action.data.edgeIds && Array.isArray(action.data.edgeIds)) {
            setEdges((eds) =>
              eds.filter(
                (e) => !(action.data.edgeIds as string[]).includes(e.id)
              )
            );
          }
        }
        break;

      case "EDIT_NODE":
        // Re-aplicar edición del nodo
        if (action.data.nodeId && action.data.afterState) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === action.data.nodeId
                ? { ...n, data: action.data.afterState as GraphNode }
                : n
            )
          );
        }
        break;

      case "ADD_EDGE":
        // Re-agregar el edge
        if (action.data.afterState) {
          setEdges((eds) => [...eds, action.data.afterState as Edge]);
        }
        break;

      case "DELETE_EDGE":
        // Re-eliminar el edge
        if (action.data.edgeId) {
          setEdges((eds) => eds.filter((e) => e.id !== action.data.edgeId));
        }
        break;

      case "EDIT_EDGE":
        // Re-aplicar edición del edge
        if (action.data.edgeId && action.data.afterState) {
          setEdges((eds) =>
            eds.map((e) =>
              e.id === action.data.edgeId
                ? { ...e, data: action.data.afterState as unknown }
                : e
            )
          );
        }
        break;

      case "MOVE_NODE":
        // Re-aplicar movimiento
        if (action.data.nodeId && action.data.afterState) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === action.data.nodeId
                ? {
                    ...n,
                    position: action.data.afterState as {
                      x: number;
                      y: number;
                    },
                  }
                : n
            )
          );
        }
        break;
    }

    setHistory((prev) => ({ ...prev, currentIndex: nextIndex }));
  }, [history, setNodes, setEdges]);

  // Resetear layout
  const resetLayout = useCallback(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  // Manejar selección de nodos
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (editable) {
        setSelectedNodeId(node.id);
        setSelectedEdgeId(null); // Deseleccionar edge si se selecciona nodo
      }
    },
    [editable]
  );

  // Manejar selección de edges
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (editable) {
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null); // Deseleccionar nodo si se selecciona edge
      }
    },
    [editable]
  );

  // Copiar nodo seleccionado
  const copySelectedNode = useCallback(() => {
    if (selectedNodeId && editable) {
      const nodeData = nodes.find((n) => n.id === selectedNodeId)?.data;
      if (nodeData) {
        setCopiedNode(nodeData);
      }
    }
  }, [selectedNodeId, nodes, editable]);

  // Pegar nodo copiado
  const pasteNode = useCallback(() => {
    if (copiedNode && editable) {
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

      // Solo agregar el nuevo nodo, sin tocar los existentes ni el grafo global
      setNodes((currentNodes) => [...currentNodes, reactFlowNode]);

      // Agregar al historial
      addToHistory("PASTE_NODE", {
        nodeId: newId,
        afterState: reactFlowNode,
      });

      // Seleccionar el nodo recién pegado
      setSelectedNodeId(newId);
    }
  }, [copiedNode, editable, setNodes, nodes, selectedNodeId, addToHistory]);

  // Eliminar nodo seleccionado
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId && editable) {
      // Guardar estado antes de eliminar
      const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
      const edgesToDelete = edges.filter(
        (e) => e.source === selectedNodeId || e.target === selectedNodeId
      );

      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNodeId && edge.target !== selectedNodeId
        )
      );

      // Agregar al historial
      if (nodeToDelete) {
        addToHistory("DELETE_NODE", {
          nodeId: selectedNodeId,
          beforeState: nodeToDelete,
          edgesBeforeState: edgesToDelete,
          edgeIds: edgesToDelete.map((e) => e.id),
        });
      }

      setSelectedNodeId(null);
    }
  }, [
    selectedNodeId,
    editable,
    setNodes,
    setEdges,
    nodes,
    edges,
    addToHistory,
  ]);

  // Eliminar edge seleccionado
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId && editable) {
      // Guardar estado antes de eliminar
      const edgeToDelete = edges.find((e) => e.id === selectedEdgeId);

      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));

      // Agregar al historial
      if (edgeToDelete) {
        addToHistory("DELETE_EDGE", {
          edgeId: selectedEdgeId,
          beforeState: edgeToDelete,
        });
      }

      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, editable, setEdges, edges, addToHistory]);

  // Manejar keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          copySelectedNode();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          pasteNode();
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          redo();
        }
      } else if (e.key === "Delete") {
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
    editable,
    copySelectedNode,
    pasteNode,
    deleteSelectedNode,
    deleteSelectedEdge,
    selectedNodeId,
    selectedEdgeId,
    undo,
    redo,
  ]);

  // Exportar configuración
  const exportConfiguration = useCallback(() => {
    // Construir el grafo actualizado con el estado actual de React Flow
    const currentGraph = {
      ...graph,
      nodes: nodes.map((n) => ({
        ...n.data,
        position: n.position,
        // Asegurar que la configuración de match se incluya
        ...(n.data.type === "match" && n.data.matchConfig && {
          matchConfig: n.data.matchConfig,
        }),
      })),
      edges: edges.map((e) => ({
        ...e.data,
      })),
      metadata: {
        ...graph.metadata,
        lastModified: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
      },
    };

    // Actualizar el grafo global con el estado actual
    if (onGraphChange) {
      onGraphChange(currentGraph);
    }

    const blob = new Blob([JSON.stringify(currentGraph, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tournament-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [graph, nodes, edges, onGraphChange]);

  return (
    <div className="h-[80vh] w-full rounded-lg border border-gray-200 bg-gray-50 relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {editable && (
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

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={editable}
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
          <span>Mode: {editable ? "Edit" : "View"}</span>
          <span>
            History: {history.currentIndex + 1}/{history.actions.length}
          </span>
          {graph.esport && <span>Esport: {graph.esport.toUpperCase()}</span>}
          {editable && (
            <>
              {selectedNodeId && (
                <span>Selected Node: {selectedNodeId.slice(0, 8)}...</span>
              )}
              {selectedEdgeId && (
                <span className="text-blue-600 font-medium">
                  🔗 Selected Edge: {selectedEdgeId.slice(0, 8)}... (Press Delete to remove)
                </span>
              )}
              {copiedNode && (
                <span className="text-green-600">📋 Node copied</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Help text for shortcuts */}
      {editable && (
        <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-2 text-xs text-blue-700">
          <div>
            💡 <strong>Controls:</strong>
          </div>
          <div>• Click node/edge to select</div>
          <div>• Drag nodes to move them</div>
          <div>• Drag near other nodes to auto-connect</div>
          <div>• Use handles (⚪) to connect manually</div>
          <div>• Click edges to select (animated dashed lines)</div>
          <div>• Ctrl+C to copy node</div>
          <div>• Ctrl+V to paste node</div>
          <div>• Ctrl+Z to undo</div>
          <div>• Ctrl+Y to redo</div>
          <div>• Delete key to remove selected item</div>
        </div>
      )}
    </div>
  );
}
