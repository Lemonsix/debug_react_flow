import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Edge,
  type Node,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import type { TournamentGraph, GraphNode } from "./types";

const NODE_W = 400;
const NODE_H = 280;

/** UI de nodo con estilo moderno inspirado en React Flow examples */
function GraphNodeCard({ data }: { data: GraphNode }) {
  const filled = data.slots.filter((s) => !!s.participantId).length;
  const cap = data.capacity;

  // Colores limpios y modernos como en React Flow examples
  const nodeTypeConfig = {
    match: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-500",
      handle: "bg-emerald-500",
    },
    aggregator: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      accent: "bg-blue-500",
      handle: "bg-blue-500",
    },
    sink: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      accent: "bg-purple-500",
      handle: "bg-purple-500",
    },
  };

  const config = nodeTypeConfig[data.type];

  const statusConfig = {
    finished: {
      color: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
    },
    live: {
      color: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
    },
    ready: {
      color: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
    pending: {
      color: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    },
    empty: {
      color: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    },
  };

  const status = statusConfig[data.status || "pending"];

  return (
    <div
      className={`
      relative bg-white border-2 ${config.border} rounded-lg shadow-sm
      hover:shadow-md transition-all duration-200
      cursor-grab active:cursor-grabbing
      min-w-80 max-w-80
    `}
    >
      {/* Header del nodo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`${config.accent} w-8 h-8 rounded-lg flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">
                {data.type === "match"
                  ? "M"
                  : data.type === "aggregator"
                  ? "A"
                  : "S"}
              </span>
            </div>
            <div>
              <div className={`font-semibold text-sm ${config.text}`}>
                {data.type.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {data.esport.toUpperCase()}
              </div>
            </div>
          </div>

          {data.status && (
            <div
              className={`
              px-2 py-1 rounded-full text-xs font-medium border
              ${status.color} ${status.text} ${status.border}
            `}
            >
              {data.status}
            </div>
          )}
        </div>

        {/* ID del nodo */}
        <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Node ID</div>
          <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">
            {data.id}
          </div>
          <div className="text-xs text-gray-500 mt-1">Phase ID</div>
          <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">
            {data.phaseId}
          </div>
        </div>
      </div>

      {/* Información de slots */}
      {data.type !== "sink" && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Capacity</span>
            <div
              className={`
              px-2 py-1 rounded text-xs font-semibold
              ${
                filled === cap
                  ? "bg-green-100 text-green-800"
                  : filled > 0
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }
            `}
            >
              {filled}/{cap}
            </div>
          </div>
        </div>
      )}

      {/* Slots visuales */}
      {data.type !== "sink" && data.slots && data.slots.length > 0 && (
        <div className="p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Slots</div>
          <div className="space-y-2">
            {data.slots.map((slot, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded border transition-colors
                  ${
                    slot.participantId
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`
                    w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                    ${
                      slot.participantId
                        ? "bg-green-500 text-white"
                        : "bg-gray-400 text-white"
                    }
                  `}
                  >
                    {slot.index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Slot {slot.index + 1}
                  </span>
                </div>

                {slot.participantId ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="text-xs text-green-600 font-medium mb-1">
                        Participant ID
                      </div>
                      <div className="text-green-700 font-mono text-xs break-all leading-relaxed">
                        {slot.participantId}
                      </div>
                    </div>
                    {slot.sourceNodeId && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          Source Node
                        </div>
                        <div className="text-blue-700 font-mono text-xs break-all leading-relaxed">
                          {slot.sourceNodeId}
                        </div>
                      </div>
                    )}
                    {slot.sourceOutcome && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded text-xs text-purple-700 font-medium">
                        Outcome: {slot.sourceOutcome}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm italic bg-gray-50 p-2 rounded border border-gray-200">
                    Empty slot
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información para nodos sink */}
      {data.type === "sink" && (
        <div className="p-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-purple-700 text-sm font-semibold mb-1">
              🏆 Final Result
            </div>
            <div className="text-purple-600 text-xs">
              Tournament destination
            </div>
          </div>
        </div>
      )}

      {/* Conectores limpios como en React Flow examples */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-gray-400 transition-colors"
        style={{ right: -6 }}
      />
    </div>
  );
}

/** Mapear JSON → React Flow con layout dagre */
function toRF(graph: TournamentGraph) {
  const rfNodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: "t_node",
    data: n,
    position: { x: 0, y: 0 },
  }));

  const rfEdges: Edge[] = graph.edges
    .filter((e) => !!e.toNode) // los sinks se renderizan como comentario o badge
    .map(
      (e): Edge => ({
        id: e.id,
        source: e.fromNode,
        target: e.toNode!,
        label: e.outcome,
        style: { strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: "#cbd5e1" },
        markerEnd: { type: "arrowclosed" as MarkerType },
      })
    );

  // dagre layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 80,
    ranksep: 150,
    marginx: 60,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  rfNodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  rfEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  rfNodes.forEach((n) => {
    const p = g.node(n.id);
    n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
  });

  return { rfNodes, rfEdges };
}

const nodeTypes = { t_node: GraphNodeCard };

export default function TournamentGraphView({
  graph,
}: {
  graph: TournamentGraph;
}) {
  const { rfNodes, rfEdges } = useMemo(() => toRF(graph), [graph]);

  // Estado para manejar nodos y edges draggables
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Actualizar nodos y edges cuando el graph cambie
  useMemo(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // Función para resetear las posiciones al layout original
  const resetLayout = () => {
    setNodes(rfNodes);
  };

  // Encontrar nodos sink para mostrar información
  const sinkNodes = graph.nodes.filter((n) => n.type === "sink");
  const sinkEdges = graph.edges.filter((e) => e.sink);

  return (
    <div className="h-[80vh] w-full rounded-lg border border-gray-200 bg-gray-50 relative">
      {/* Botón para resetear layout */}
      <button
        onClick={resetLayout}
        className="absolute top-4 right-4 z-10 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
      >
        ↻ Reset Layout
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-transparent"
      >
        <MiniMap pannable zoomable nodeColor="#6b7280" />
        <Controls />
        <Background />
      </ReactFlow>

      {/* Información de sinks con estilo limpio */}
      {sinkNodes.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-sm">🏆</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              Final Results
            </h3>
          </div>
          <div className="space-y-2">
            {sinkEdges.map((edge) => {
              const fromNode = graph.nodes.find((n) => n.id === edge.fromNode);
              const sink = edge.sink;
              if (!sink || !fromNode) return null;

              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="text-gray-600 font-mono text-xs">
                    {fromNode.id.slice(0, 8)}...
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-purple-700 text-xs font-medium">
                    {sink.kind === "podium"
                      ? `Position ${sink.podiumPos}`
                      : sink.kind}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
