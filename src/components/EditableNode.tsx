import type { GraphNode, EsportType } from "../types";
import { isSinkConfiguration } from "../types";
import { MatchNode, PodiumNode, EliminationNode } from "./nodes";

interface EditableNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType;
}

export default function EditableNode({
  data,
  onChange,
  isConnectable = true,
  isEditing: globalIsEditing = false,
  onStartEditing,
  onStopEditing,
  allNodes = [],
  esport,
}: EditableNodeProps) {
  // Por defecto, todos los nodos están en modo no-editable
  // Solo se activa la edición cuando se llama explícitamente a onStartEditing
  // Renderizar el componente apropiado según el tipo de nodo
  if (data.type === "match") {
    return (
      <MatchNode
        data={data}
        onChange={onChange}
        isConnectable={isConnectable}
        isEditing={globalIsEditing}
        onStartEditing={onStartEditing}
        onStopEditing={onStopEditing}
        allNodes={allNodes}
        esport={esport}
      />
    );
  }

  if (data.type === "sink") {
    if (
      data.config &&
      isSinkConfiguration(data.config) &&
      data.config.sinkType === "podium"
    ) {
      return (
        <PodiumNode
          data={data}
          onChange={onChange}
          isConnectable={isConnectable}
          isEditing={globalIsEditing}
          onStartEditing={onStartEditing}
          onStopEditing={onStopEditing}
          allNodes={allNodes}
          esport={esport}
        />
      );
    } else {
      return (
        <EliminationNode
          data={data}
          onChange={onChange}
          isConnectable={isConnectable}
          onStopEditing={onStopEditing}
          allNodes={allNodes}
          esport={esport}
        />
      );
    }
  }

  // Fallback para tipos de nodo desconocidos
  return (
    <div className="flex flex-row bg-background border-2 min-w-48 border-gray-200 rounded-lg shadow-sm p-2">
      <div className="text-gray-500">Tipo de nodo desconocido: {data.type}</div>
    </div>
  );
}
