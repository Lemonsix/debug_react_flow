import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  getNodesBounds,
  getViewportForBounds,
  MarkerType,
  MiniMap,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnSelectionChangeFunc,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import EditableEdge, { SimpleEdge } from "./components/EditableEdge";
import EditableNode from "./components/EditableNode";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import type {
  EdgeCondition,
  GraphEdge,
  GraphNode,
  HistoryAction,
  HistoryActionType,
  HistoryState,
  NodeType,
  TournamentGraph,
} from "./types";
import { validateDefaultEdges } from "./utils/edgeLogic";
import {
  getNextAvailablePodiumPosition,
  validateTournamentStructure,
  detectCircularDependency,
  validateSinkDeletion,
} from "./utils/validation";

const NODE_W = 400;
const NODE_H = 280;
const MIN_DISTANCE = 150; // Distancia mínima para proximity connect

interface TournamentEditorProps {
  graph: TournamentGraph;
  editable?: boolean;
  onGraphChange?: (graph: TournamentGraph) => void;
}

// Componente interno que usa useReactFlow
function TournamentEditorInternal({
  graph,
  editable = true,
  onGraphChange,
}: TournamentEditorProps) {
  const reactFlowInstance = useReactFlow();
  const [copiedNode, setCopiedNode] = useState<
    | GraphNode
    | { nodes: GraphNode[]; edges: GraphEdge[]; timestamp: number }
    | null
  >(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryState>({
    actions: [],
    currentIndex: -1,
  });

  // Estado global para controlar qué elemento está siendo editado
  const [currentlyEditing, setCurrentlyEditing] = useState<{
    type: "node" | "edge" | null;
    id: string | null;
  }>({ type: null, id: null });

  // Estado para detectar cuando se está arrastrando un nodo
  const [isDraggingNode, setIsDraggingNode] = useState(false);

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
      type: editable ? "editable" : "readonly",
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

    // Validar y asegurar que la lógica de default esté correcta
    if (editable) {
      validateDefaultEdges(rfEdges);
    }

    // Aplicar layout automático si no hay posiciones
    if (
      rfNodes.some(
        (n) => !n.position || (n.position.x === 0 && n.position.y === 0)
      )
    ) {
      // Layout optimizado usando las mejores prácticas de React Flow
      rfNodes.forEach((node, index) => {
        if (
          !node.position ||
          (node.position.x === 0 && node.position.y === 0)
        ) {
          // Organizar en filas de máximo 4 nodos
          const nodesPerRow = 4;
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;

          node.position = {
            x: col * (NODE_W + 120), // Más espaciado horizontal
            y: row * (NODE_H + 100), // Más espaciado vertical
          };
        }
      });
    }

    return { rfNodes, rfEdges };
  }, [graph.nodes, graph.edges, editable]);

  // Estado para nodos y edges con manejo optimizado
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Función para auto-guardar y cerrar nodo en edición
  const autoSaveAndCloseEditing = useCallback(() => {
    if (currentlyEditing.type === "node" && currentlyEditing.id) {
      // Encontrar el nodo que se está editando
      const editingNode = nodes.find((n) => n.id === currentlyEditing.id);
      if (editingNode) {
        // Forzar el guardado del nodo activando el handleSave del nodo
        // Al actualizar con editable: false, el nodo se auto-guardará y cerrará
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === currentlyEditing.id
              ? {
                  ...node,
                  data: { ...node.data, editable: false },
                }
              : node
          )
        );
      }
      // Cerrar el modo de edición
      stopEditing();
    }
  }, [currentlyEditing, nodes, setNodes, stopEditing]);

  // Manejadores optimizados para cambios de nodos y edges
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Filtrar cambios de posición para el historial
      const positionChanges = changes.filter(
        (change) => change.type === "position" && change.dragging === false
      );

      // Aplicar cambios usando la utilidad de React Flow
      onNodesChange(changes);

      // Agregar cambios de posición al historial solo cuando termina el drag
      positionChanges.forEach((change) => {
        if (change.type === "position" && change.position) {
          addToHistory("MOVE_NODE", {
            nodeId: change.id,
            beforeState: nodes.find((n) => n.id === change.id)?.position,
            afterState: change.position,
          });
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onNodesChange, addToHistory]
    // Removemos 'nodes' de las dependencias ya que se accede dinámicamente para evitar re-renders
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Aplicar cambios usando la utilidad de React Flow
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Proximity Connect: Encontrar el nodo más cercano para conectar automáticamente
  const getClosestEdge = useCallback(
    (node: Node) => {
      // Usar nodos directamente en lugar de nodeLookup
      const draggedNode = nodes.find((n) => n.id === node.id);
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

      const closeNodeIsSource =
        closestNode.node.position.x < draggedNode.position.x;

      return {
        id: closeNodeIsSource
          ? `temp-${closestNode.node.id}-${node.id}`
          : `temp-${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
      };
    },
    [nodes]
  );

  // Manejar arrastre de nodos para mostrar conexión temporal
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!editable) return;

      // Activar estado de arrastre
      setIsDraggingNode(true);

      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          // Determinar si este sería el primer edge del nodo (y por tanto default)
          const existingEdgesFromSource = nextEdges.filter(
            (e) => e.source === closeEdge.source
          );
          const isFirstEdge = existingEdgesFromSource.length === 0;

          const tempEdge: Edge = {
            id: closeEdge.id,
            source: closeEdge.source,
            target: closeEdge.target,
            className: "temp",
            style: {
              stroke: "#3b82f6",
              strokeDasharray: "5,5",
              strokeWidth: 2,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
            data: {
              id: closeEdge.id,
              fromNode: closeEdge.source,
              toNode: closeEdge.target,
              outcome: isFirstEdge ? "default" : "points >= 0",
              editable: false,
              isDefault: isFirstEdge,
              condition: {
                field: isFirstEdge ? ("default" as const) : ("points" as const),
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

      // Desactivar estado de arrastre
      setIsDraggingNode(false);

      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        const nextEdges = es.filter((e) => e.className !== "temp");

        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target
          )
        ) {
          // Determinar si este será el primer edge del nodo (y por tanto default)
          const existingEdgesFromSource = nextEdges.filter(
            (e) => e.source === closeEdge.source
          );
          const isFirstEdge = existingEdgesFromSource.length === 0;

          const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: closeEdge.source,
            target: closeEdge.target,
            type: "editable",
            data: {
              id: `edge-${Date.now()}`,
              fromNode: closeEdge.source,
              toNode: closeEdge.target,
              outcome: isFirstEdge ? "default" : "points >= 0",
              editable: true,
              isDefault: isFirstEdge,
              condition: {
                field: isFirstEdge ? ("default" as const) : ("points" as const),
                operator: ">=" as const,
                value: 0,
              },
            },
            markerEnd: { type: MarkerType.ArrowClosed },
          };
          nextEdges.push(newEdge);

          // Validar que la lógica de default sea correcta
          validateDefaultEdges(nextEdges);

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
      setEdges((currentEdges) => {
        // Encontrar el edge que se está modificando
        const targetEdge = currentEdges.find((e) => e.id === edgeId);
        if (!targetEdge) return currentEdges;

        const sourceNodeId = targetEdge.source;
        const isBecomingDefault = condition.field === "default";
        const wasDefault = (targetEdge.data as GraphEdge)?.isDefault === true;
        const isStoppingBeingDefault = wasDefault && !isBecomingDefault;

        const updatedEdges = currentEdges.map((edge) => {
          if (edge.id === edgeId) {
            // Actualizar el edge objetivo
            return {
              ...edge,
              data: {
                ...edge.data,
                condition,
                isDefault: isBecomingDefault,
                outcome: isBecomingDefault
                  ? "default"
                  : `${condition.field} ${condition.operator} ${condition.value}`,
              },
            };
          } else if (edge.source === sourceNodeId && isBecomingDefault) {
            // Si el edge objetivo se está volviendo default, todos los otros edges del mismo nodo deben dejar de serlo
            const edgeData = edge.data as GraphEdge;
            return {
              ...edge,
              data: {
                ...edgeData,
                isDefault: false,
                condition: {
                  field: "points" as const,
                  operator: ">=" as const,
                  value: 0,
                },
                outcome: "points >= 0",
              },
            };
          }
          return edge;
        });

        // Si un edge default deja de serlo, necesitamos asegurar que otro edge del mismo nodo se convierta en default
        if (isStoppingBeingDefault) {
          const nodeEdges = updatedEdges.filter(
            (e) => e.source === sourceNodeId
          );
          const hasAnyDefault = nodeEdges.some(
            (e) => (e.data as GraphEdge)?.isDefault === true
          );

          if (!hasAnyDefault && nodeEdges.length > 0) {
            // Hacer default el primer edge (por timestamp) que no sea el que se está modificando
            const candidateEdge = nodeEdges
              .filter((e) => e.id !== edgeId)
              .sort((a, b) => {
                const timestampA = parseInt(a.id.split("-").pop() || "0");
                const timestampB = parseInt(b.id.split("-").pop() || "0");
                return timestampA - timestampB;
              })[0];

            if (candidateEdge) {
              const candidateIndex = updatedEdges.findIndex(
                (e) => e.id === candidateEdge.id
              );
              if (candidateIndex !== -1) {
                updatedEdges[candidateIndex] = {
                  ...candidateEdge,
                  data: {
                    ...candidateEdge.data,
                    isDefault: true,
                    condition: {
                      field: "default" as const,
                      operator: ">=" as const,
                      value: 0,
                    },
                    outcome: "default",
                  },
                };
              }
            }
          }
        }

        // Agregar al historial usando el estado actual
        addToHistory("EDIT_EDGE", {
          edgeId,
          beforeState: targetEdge.data,
          afterState: { ...targetEdge.data, condition },
        });

        return updatedEdges;
      });

      // Cerrar la edición del edge después de guardar
      stopEditing();
    },
    [setEdges, addToHistory, stopEditing]
    // Removemos 'edges' de las dependencias ya que usamos el estado actual en setEdges
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

  // Usar nodeTypes memoizados con dependencias estables
  const nodeTypes = useMemo(
    () => ({
      editable: (props: NodeProps) => {
        // Obtener nodos dinámicamente para evitar dependencias innecesarias
        const allGraphNodes = nodes.map((n) => n.data as GraphNode);

        return (
          <EditableNode
            key={props.id}
            data={props.data as GraphNode}
            onChange={(updates) => handleNodeChange(props.id, updates)}
            isConnectable={props.isConnectable}
            isEditing={isCurrentlyEditing("node", props.id)}
            onStartEditing={() => startEditing("node", props.id)}
            onStopEditing={stopEditing}
            allNodes={allGraphNodes}
          />
        );
      },
      readonly: (props: NodeProps) => (
        <EditableNode
          key={props.id}
          data={props.data as GraphNode}
          onChange={() => {}} // No-op en modo solo lectura
          isConnectable={false}
          isEditing={false}
          onStartEditing={() => {}} // No-op en modo solo lectura
          onStopEditing={() => {}} // No-op en modo solo lectura
          allNodes={[]} // No necesario en modo solo lectura
        />
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleNodeChange, isCurrentlyEditing, startEditing, stopEditing]
    // Removemos 'nodes' de las dependencias para evitar recálculos innecesarios durante el drag
  );

  const edgeTypes = useMemo(
    () => ({
      editable: (props: EdgeProps) => {
        // Obtener datos dinámicamente para evitar dependencias innecesarias
        const targetNode = nodes.find((n) => n.id === props.target)?.data as
          | GraphNode
          | undefined;

        return (
          <EditableEdge
            key={props.id}
            {...props}
            onConditionUpdate={handleEdgeConditionUpdate}
            isEditing={isCurrentlyEditing("edge", props.id)}
            onStartEditing={() => startEditing("edge", props.id)}
            onStopEditing={stopEditing}
            allEdges={edges}
            targetNode={targetNode}
          />
        );
      },
      simple: SimpleEdge,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleEdgeConditionUpdate, isCurrentlyEditing, startEditing, stopEditing]
    // Removemos 'edges' y 'nodes' de las dependencias para evitar recálculos innecesarios durante el drag
  );

  // Actualizar cuando el grafo cambie, pero preservar posiciones actuales
  useEffect(() => {
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

  // Función para crear automáticamente la estructura mínima del torneo
  const createMinimumTournamentStructure = useCallback(() => {
    if (!editable) return; // Solo crear en modo editable

    const currentNodes = nodes.map((n) => n.data as GraphNode);
    const timestamp = Date.now();

    // Verificar qué tipos de nodos faltan
    const hasMatch = currentNodes.some((n) => n.type === "match");
    const hasPodium = currentNodes.some(
      (n) => n.type === "sink" && n.sinkConfig?.sinkType === "podium"
    );
    const hasDisqualification = currentNodes.some(
      (n) => n.type === "sink" && n.sinkConfig?.sinkType === "disqualification"
    );

    const nodesToCreate: Node[] = [];

    // Crear match si no existe (en estado de edición)
    if (!hasMatch) {
      const matchId = `node-${timestamp}-match`;
      const matchNode: GraphNode = {
        id: matchId,
        phaseId: graph.phaseId,
        type: "match",
        capacity: 2,
        slots: Array.from({ length: 2 }, (_, i) => ({ index: i })),
        editable: true, // Match inicia en estado de edición
        position: { x: 200, y: 200 },
        matchConfig: {
          capacity: 2,
          modalidad: "presencial" as const,
          scheduledDate: undefined,
          scheduledTime: undefined,
        },
      };

      nodesToCreate.push({
        id: matchId,
        type: "editable",
        data: matchNode,
        position: { x: 200, y: 200 },
      });
    }

    // Crear podio si no existe (NO en estado de edición)
    if (!hasPodium) {
      const podiumId = `node-${timestamp}-podium`;
      const podiumNode: GraphNode = {
        id: podiumId,
        phaseId: graph.phaseId,
        type: "sink",
        capacity: 0,
        slots: [],
        editable: false, // Podio NO inicia en estado de edición
        position: { x: 800, y: 150 },
        sinkConfig: {
          sinkType: "podium",
          position: 1,
        },
      };

      nodesToCreate.push({
        id: podiumId,
        type: "editable",
        data: podiumNode,
        position: { x: 800, y: 150 },
      });
    }

    // Crear eliminación si no existe (NO en estado de edición)
    if (!hasDisqualification) {
      const disqualificationId = `node-${timestamp}-disqualification`;
      const disqualificationNode: GraphNode = {
        id: disqualificationId,
        phaseId: graph.phaseId,
        type: "sink",
        capacity: 0,
        slots: [],
        editable: false, // Eliminación NO inicia en estado de edición
        position: { x: 800, y: 300 },
        sinkConfig: {
          sinkType: "disqualification",
        },
      };

      nodesToCreate.push({
        id: disqualificationId,
        type: "editable",
        data: disqualificationNode,
        position: { x: 800, y: 300 },
      });
    }

    // Agregar todos los nodos de una vez
    if (nodesToCreate.length > 0) {
      setNodes((nds) => [...nds, ...nodesToCreate]);

      // Agregar al historial como una operación múltiple solo si estamos creando la estructura inicial
      if (currentNodes.length === 0 && nodesToCreate.length === 3) {
        addToHistory("ADD_NODE", {
          nodeIds: nodesToCreate.map((n) => n.id),
          afterState: nodesToCreate,
          isInitialStructure: true,
        });

        // Activar modo de edición para el match si estamos creando la estructura inicial
        const matchNode = nodesToCreate.find(
          (n) => (n.data as GraphNode).type === "match"
        );
        if (matchNode) {
          setTimeout(() => {
            startEditing("node", matchNode.id);
          }, 100);
        }
      }
    }
  }, [graph.phaseId, editable, setNodes, addToHistory, nodes, startEditing]);

  // Validar estructura mínima del torneo cuando se cargan los nodos
  useEffect(() => {
    const graphNodes = nodes.map((n) => n.data as GraphNode);

    // Si no hay nodos o la estructura no es válida, crear la estructura mínima
    if (
      nodes.length === 0 ||
      !validateTournamentStructure(graphNodes).isValid
    ) {
      createMinimumTournamentStructure();
    }
  }, [nodes, createMinimumTournamentStructure]);

  // Manejar conexiones entre nodos usando las mejores prácticas
  const onConnect = useCallback(
    (params: Connection) => {
      if (!editable || !params.source || !params.target) return;

      // Validar que no se cree una dependencia circular
      const circularCheck = detectCircularDependency(
        params.source,
        params.target,
        edges,
        nodes
      );

      if (circularCheck.hasCircle) {
        alert(
          circularCheck.error ||
            "Esta conexión crearía una dependencia circular."
        );
        return;
      }

      const newEdgeId = `edge-${Date.now()}`;

      // Determinar si este será el primer edge del nodo (y por tanto default)
      const existingEdgesFromSource = edges.filter(
        (e) => e.source === params.source
      );
      const isFirstEdge = existingEdgesFromSource.length === 0;

      const newEdge: Edge = {
        id: newEdgeId,
        source: params.source,
        target: params.target,
        animated: true,
        type: "editable",
        data: {
          id: newEdgeId,
          fromNode: params.source,
          toNode: params.target,
          outcome: isFirstEdge ? "default" : "points >= 0",
          editable: true,
          isDefault: isFirstEdge,
          condition: {
            field: isFirstEdge ? ("default" as const) : ("points" as const),
            operator: ">=" as const,
            value: 0,
          },
        },
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5 },
      };

      // Usar la utilidad addEdge de React Flow para mejor rendimiento
      setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        // Validar que la lógica de default sea correcta
        validateDefaultEdges(newEdges);
        return newEdges;
      });

      // Agregar al historial
      addToHistory("ADD_EDGE", {
        edgeId: newEdgeId,
        afterState: newEdge,
      });
    },
    [editable, setEdges, addToHistory, edges]
  );

  // Agregar nuevo nodo
  const addNewNode = useCallback(
    (nodeType: NodeType) => {
      // Auto-guardar y cerrar cualquier nodo en edición antes de crear uno nuevo
      autoSaveAndCloseEditing();

      const newId = `node-${Date.now()}`;

      // Para nodos sink de tipo podio, calcular la siguiente posición disponible
      let podiumPosition = 1;
      if (nodeType === "sink") {
        const currentGraphNodes = nodes.map((n) => n.data as GraphNode);
        podiumPosition = getNextAvailablePodiumPosition(currentGraphNodes);
      }

      const newNode: GraphNode = {
        id: newId,
        phaseId: graph.phaseId,
        type: nodeType,
        capacity: nodeType === "sink" ? 0 : 2,
        slots:
          nodeType === "sink"
            ? []
            : Array.from({ length: 2 }, (_, i) => ({ index: i })),
        editable: false, // Los nuevos nodos no se abren automáticamente en edición
        position: { x: 100, y: 100 },
        ...(nodeType === "sink" && {
          sinkConfig: {
            sinkType: "podium" as const,
            position: podiumPosition,
          },
        }),
        ...(nodeType === "match" && {
          matchConfig: {
            capacity: 2,
            modalidad: "presencial" as const,
            scheduledDate: undefined,
            scheduledTime: undefined,
          },
        }),
      };

      const reactFlowNode: Node = {
        id: newId,
        type: editable ? "editable" : "readonly",
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
    [
      graph.phaseId,
      editable,
      setNodes,
      addToHistory,
      nodes,
      autoSaveAndCloseEditing,
    ]
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
                ? {
                    ...e,
                    data: action.data.beforeState as Record<string, unknown>,
                  }
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
                ? {
                    ...e,
                    data: action.data.afterState as Record<string, unknown>,
                  }
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

  // Resetear layout usando las utilidades de React Flow
  const resetLayout = useCallback(() => {
    setNodes(rfNodes);

    // Fit view automáticamente después del reset usando la instancia de React Flow
    setTimeout(() => {
      const bounds = getNodesBounds(rfNodes);
      const viewport = getViewportForBounds(bounds, 300, 300, 0.1, 2, 0.1);
      reactFlowInstance.setViewport(viewport);
    }, 0);
  }, [rfNodes, setNodes, reactFlowInstance]);

  // Manejar selección múltiple con React Flow
  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      if (editable) {
        const nodeIds = selectedNodes.map((n) => n.id);
        const edgeIds = selectedEdges.map((e) => e.id);

        setSelectedNodes(nodeIds);
        setSelectedEdges(edgeIds);

        // Mantener compatibilidad con selección individual
        setSelectedNodeId(nodeIds.length === 1 ? nodeIds[0] : null);
        setSelectedEdgeId(edgeIds.length === 1 ? edgeIds[0] : null);
      }
    },
    [editable]
  );

  // Manejar selección de nodos (mantener para compatibilidad)
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (editable) {
        setSelectedNodeId(node.id);
        setSelectedEdgeId(null);
      }
    },
    [editable]
  );

  // Manejar selección de edges (mantener para compatibilidad)
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (editable) {
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null);
      }
    },
    [editable]
  );

  // Copiar nodos y edges seleccionados
  const copySelectedElements = useCallback(() => {
    if (editable && (selectedNodes.length > 0 || selectedNodeId)) {
      // Usar selección múltiple si hay elementos seleccionados, sino usar selección individual
      const nodeIdsToProcess =
        selectedNodes.length > 0
          ? selectedNodes
          : selectedNodeId
          ? [selectedNodeId]
          : [];

      if (nodeIdsToProcess.length === 0) return;

      // Obtener datos de los nodos seleccionados
      const nodesToCopy = nodeIdsToProcess
        .map((id) => {
          const node = nodes.find((n) => n.id === id);
          return node?.data as GraphNode;
        })
        .filter(Boolean);

      // Obtener edges que conectan nodos seleccionados (ambos extremos deben estar seleccionados)
      const edgesToCopy = edges
        .filter(
          (edge) =>
            nodeIdsToProcess.includes(edge.source) &&
            nodeIdsToProcess.includes(edge.target)
        )
        .map((edge) => edge.data as GraphEdge);

      // Guardar en estado para pegar después
      const clipboardData = {
        nodes: nodesToCopy,
        edges: edgesToCopy,
        timestamp: Date.now(),
      };

      setCopiedNode(
        clipboardData as
          | GraphNode
          | { nodes: GraphNode[]; edges: GraphEdge[]; timestamp: number }
      ); // Reutilizar el estado existente

      // Mostrar feedback visual
      console.log(
        `Copied ${nodesToCopy.length} node(s) and ${edgesToCopy.length} edge(s)`
      );
    }
  }, [selectedNodes, selectedNodeId, nodes, edges, editable]);

  // Pegar elementos copiados
  const pasteElements = useCallback(() => {
    if (copiedNode && editable) {
      // Auto-guardar y cerrar cualquier nodo en edición antes de pegar
      autoSaveAndCloseEditing();
      // Verificar si es datos múltiples o un solo nodo
      const clipboardData = copiedNode as {
        nodes?: GraphNode[];
        edges?: GraphEdge[];
        timestamp?: number;
      };
      const isMultipleElements =
        clipboardData.nodes && Array.isArray(clipboardData.nodes);

      if (isMultipleElements) {
        // Pegar múltiples nodos y edges
        const { nodes: nodesToPaste, edges: edgesToPaste } = clipboardData;
        const timestamp = Date.now();
        const nodeIdMapping: Record<string, string> = {};
        const newNodes: Node[] = [];

        // Determinar posición base
        const basePosition = selectedNodeId
          ? nodes.find((n) => n.id === selectedNodeId)?.position || {
              x: 100,
              y: 100,
            }
          : { x: 100, y: 100 };

        // Crear nuevos nodos
        nodesToPaste?.forEach((nodeData: GraphNode, index: number) => {
          const newId = `node-${timestamp}-${index}`;
          nodeIdMapping[nodeData.id] = newId;

          // Auto-incrementar posición de podio si es necesario
          let newSinkConfig = nodeData.sinkConfig;
          if (
            nodeData.type === "sink" &&
            nodeData.sinkConfig?.sinkType === "podium"
          ) {
            const currentGraphNodes = nodes.map((n) => n.data as GraphNode);
            const nextPosition =
              getNextAvailablePodiumPosition(currentGraphNodes);
            newSinkConfig = {
              ...nodeData.sinkConfig,
              position: nextPosition + index, // Incrementar para múltiples
            };
          }

          const newNode: GraphNode = {
            ...nodeData,
            id: newId,
            position: {
              x: basePosition.x + (index % 2) * 450 + 50, // Organizar en grid 2x2
              y: basePosition.y + Math.floor(index / 2) * 350 + 50,
            },
            sinkConfig: newSinkConfig,
            slots: nodeData.slots.map((slot) => ({
              ...slot,
              participantId: undefined, // Limpiar participantes
            })),
          };

          const reactFlowNode: Node = {
            id: newId,
            type: editable ? "editable" : "readonly",
            data: newNode,
            position: newNode.position!,
          };

          newNodes.push(reactFlowNode);
        });

        // Agregar nodos
        setNodes((nds) => nds.concat(newNodes));

        // Crear nuevos edges
        const newEdges: Edge[] = [];
        edgesToPaste?.forEach((edgeData: GraphEdge, index: number) => {
          const newSourceId = nodeIdMapping[edgeData.fromNode];
          const newTargetId = nodeIdMapping[edgeData.toNode || ""];

          if (newSourceId && newTargetId) {
            const newEdgeId = `edge-${timestamp}-${index}`;
            const newEdge: Edge = {
              id: newEdgeId,
              source: newSourceId,
              target: newTargetId,
              type: "editable",
              data: {
                ...edgeData,
                id: newEdgeId,
                fromNode: newSourceId,
                toNode: newTargetId,
              },
              markerEnd: { type: MarkerType.ArrowClosed },
            };
            newEdges.push(newEdge);
          }
        });

        // Agregar edges
        setEdges((eds) => eds.concat(newEdges));

        // Agregar al historial
        addToHistory("PASTE_MULTIPLE", {
          nodeIds: newNodes.map((n) => n.id),
          edgeIds: newEdges.map((e) => e.id),
          afterState: { nodes: newNodes, edges: newEdges } as Record<
            string,
            unknown
          >,
        });

        // Seleccionar los nuevos nodos
        setSelectedNodes(newNodes.map((n) => n.id));
        setSelectedNodeId(null);
      } else {
        // Pegar un solo nodo (lógica existente)
        const newId = `node-${Date.now()}`;

        // Calcular posición basada en la posición actual del nodo en React Flow, no en los datos del grafo
        const currentSelectedNode = nodes.find((n) => n.id === selectedNodeId);
        const singleNode = copiedNode as GraphNode;
        const basePosition = currentSelectedNode?.position ||
          singleNode.position || { x: 100, y: 100 };

        // Auto-incrementar posición de podio si se está copiando un sink de tipo podio
        let newSinkConfig = singleNode.sinkConfig;
        if (
          singleNode.type === "sink" &&
          singleNode.sinkConfig?.sinkType === "podium"
        ) {
          // Obtener todas las GraphNode actuales de los nodos de React Flow
          const currentGraphNodes = nodes.map((n) => n.data as GraphNode);
          const nextPosition =
            getNextAvailablePodiumPosition(currentGraphNodes);

          newSinkConfig = {
            ...singleNode.sinkConfig,
            position: nextPosition,
          };
        }

        const newNode: GraphNode = {
          ...singleNode,
          id: newId,
          editable: false, // Los nodos pegados no se abren automáticamente en edición
          position: {
            x: basePosition.x + 50,
            y: basePosition.y + 50,
          },
          sinkConfig: newSinkConfig,
          slots: singleNode.slots.map((slot) => ({
            ...slot,
            participantId: undefined, // Limpiar participantes en la copia
            sourceNodeId: undefined,
            sourceOutcome: undefined,
          })),
        };

        const reactFlowNode: Node = {
          id: newId,
          type: editable ? "editable" : "readonly",
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
    }
  }, [
    copiedNode,
    editable,
    setNodes,
    setEdges,
    nodes,
    selectedNodeId,
    addToHistory,
    autoSaveAndCloseEditing,
  ]);

  // Función unificada para validar eliminación de nodos
  const validateNodeDeletion = useCallback(
    (nodesToDelete: Node[]) => {
      if (nodesToDelete.length === 0) return { success: true };

      // Validar reglas específicas de eliminación de nodos sink
      const sinkValidation = validateSinkDeletion(nodesToDelete, nodes);
      if (!sinkValidation.isValid) {
        alert(sinkValidation.error);
        return { success: false };
      }

      // Validar que después de eliminar los nodos, el torneo mantenga su estructura mínima
      const nodeIdsToDelete = nodesToDelete.map((n) => n.id);
      const remainingNodes = nodes.filter(
        (n) => !nodeIdsToDelete.includes(n.id)
      );
      const graphNodes = remainingNodes.map((n) => n.data as GraphNode);

      // Verificar cada nodo que se va a eliminar
      for (const nodeToDelete of nodesToDelete) {
        const validation = validateTournamentStructure(
          graphNodes,
          nodeToDelete.data as GraphNode
        );
        if (!validation.isValid) {
          alert(validation.error);
          return { success: false };
        }
      }

      return { success: true };
    },
    [nodes]
  );

  // Eliminar elementos seleccionados
  const deleteSelectedElements = useCallback(() => {
    if (!editable) return;

    // Procesar selección múltiple si hay elementos seleccionados
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      const nodesToDelete = nodes.filter((n) => selectedNodes.includes(n.id));
      const edgesToDelete = edges.filter((e) => selectedEdges.includes(e.id));

      // Usar función unificada de validación
      const validationResult = validateNodeDeletion(nodesToDelete);
      if (!validationResult.success) return;

      // También eliminar edges conectados a los nodos que se van a eliminar
      const connectedEdges = edges.filter(
        (e) =>
          selectedNodes.includes(e.source) || selectedNodes.includes(e.target)
      );

      // Eliminar nodos y edges
      setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
      setEdges((eds) =>
        eds.filter(
          (e) =>
            !selectedEdges.includes(e.id) &&
            !selectedNodes.includes(e.source) &&
            !selectedNodes.includes(e.target)
        )
      );

      // Agregar al historial
      addToHistory("DELETE_MULTIPLE", {
        nodeIds: selectedNodes,
        edgeIds: [...selectedEdges, ...connectedEdges.map((e) => e.id)],
        beforeState: {
          nodes: nodesToDelete,
          edges: [...edgesToDelete, ...connectedEdges],
        } as Record<string, unknown>,
      });

      // Limpiar selección
      setSelectedNodes([]);
      setSelectedEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } else if (selectedNodeId) {
      // Eliminar nodo individual (lógica existente)
      const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
      if (!nodeToDelete) return;

      // Usar función unificada de validación (array con 1 elemento)
      const validationResult = validateNodeDeletion([nodeToDelete]);
      if (!validationResult.success) return;

      const connectedEdges = edges.filter(
        (e) => e.source === selectedNodeId || e.target === selectedNodeId
      );

      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
        )
      );

      addToHistory("DELETE_NODE", {
        nodeId: selectedNodeId,
        beforeState: nodeToDelete.data,
        edgesBeforeState: connectedEdges,
      });

      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      // Eliminar edge individual (lógica existente)
      const edgeToDelete = edges.find((e) => e.id === selectedEdgeId);
      if (!edgeToDelete) return;

      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));

      addToHistory("DELETE_EDGE", {
        edgeId: selectedEdgeId,
        beforeState: edgeToDelete,
      });

      setSelectedEdgeId(null);
    }
  }, [
    selectedNodes,
    selectedEdges,
    selectedNodeId,
    selectedEdgeId,
    editable,
    setNodes,
    setEdges,
    nodes,
    edges,
    addToHistory,
    validateNodeDeletion,
  ]);

  // Función para desactivar el menú contextual
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // Manejar keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          copySelectedElements();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          pasteElements();
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          redo();
        }
      } else if (e.key === "Delete") {
        e.preventDefault();
        deleteSelectedElements();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    editable,
    copySelectedElements,
    pasteElements,
    deleteSelectedElements,
    undo,
    redo,
  ]);

  // Exportar configuración
  const exportConfiguration = useCallback(() => {
    // Construir el grafo actualizado con el estado actual de React Flow
    const currentGraph: TournamentGraph = {
      ...graph,
      nodes: nodes.map((n) => ({
        ...(n.data as GraphNode),
        position: n.position,
        // Asegurar que la configuración de match se incluya
        ...((n.data as GraphNode).type === "match" &&
          (n.data as GraphNode).matchConfig && {
            matchConfig: (n.data as GraphNode).matchConfig,
          }),
      })),
      edges: edges.map((e) => ({
        ...(e.data as GraphEdge),
      })),
      metadata: {
        ...graph.metadata,
        lastModified: new Date().toISOString(),
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => addNewNode("match")}
                    className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                  >
                    + Match
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Un match es un nodo que representa una partida</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => addNewNode("sink")}
                    className="px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
                  >
                    + Podio
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agrega un nuevo podio al torneo</p>
                </TooltipContent>
              </Tooltip>
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
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onContextMenu={onContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 2 }}
        className={`bg-transparent ${
          isDraggingNode ? "cursor-grabbing" : "cursor-default"
        }`}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        elevateNodesOnSelect={true}
        selectNodesOnDrag={true}
        panOnDrag={[2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        colorMode="dark"
        multiSelectionKeyCode="Shift"
        selectionOnDrag={true}
        snapToGrid={true}
        snapGrid={[20, 20]}
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
              {selectedNodes.length > 0 && (
                <span className="text-blue-600 font-medium">
                  📦 Selected: {selectedNodes.length} node(s)
                  {selectedEdges.length > 0
                    ? `, ${selectedEdges.length} edge(s)`
                    : ""}
                </span>
              )}
              {selectedNodes.length === 0 && selectedNodeId && (
                <span>Selected Node: {selectedNodeId.slice(0, 8)}...</span>
              )}
              {selectedNodes.length === 0 && selectedEdgeId && (
                <span className="text-blue-600 font-medium">
                  🔗 Selected Edge: {selectedEdgeId.slice(0, 8)}...
                </span>
              )}
              {copiedNode && (
                <span className="text-green-600 font-medium">
                  📋 Copied:{" "}
                  {(copiedNode as { nodes?: GraphNode[] }).nodes
                    ? `${
                        (copiedNode as { nodes: GraphNode[] }).nodes.length
                      } elements`
                    : (copiedNode as GraphNode).type}{" "}
                  (Ctrl+V to paste)
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal envuelto con ReactFlowProvider para mejores prácticas
export default function TournamentEditor(props: TournamentEditorProps) {
  return (
    <ReactFlowProvider>
      <TournamentEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
