import { Position } from "@xyflow/react";
import type { GraphNode, EsportType } from "../../types";
import { useBaseNode } from "./BaseNode";
import { LabeledHandle } from "../LabeledHandle";
import { SkullIcon } from "lucide-react";

interface EliminationNodeProps {
  data: GraphNode;
  onChange?: (updates: Partial<GraphNode>) => void;
  isConnectable?: boolean;
  onStopEditing?: () => void;
  allNodes?: GraphNode[];
  esport: EsportType;
}

export function EliminationNode({
  data,
  onChange,
  isConnectable = true,
  onStopEditing,
  allNodes = [],
  esport,
}: EliminationNodeProps) {
  // Los nodos de eliminación no son editables
  const isEditing = false;

  // Usar el hook base para la lógica común
  const {
    config,
  } = useBaseNode({
    data,
    onChange,
    onStopEditing,
    allNodes,
    esport,
  });

  return (
    <div
      className={`
        flex flex-row bg-background border-2 min-w-48 ${
          config.border
        } rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isEditing ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
        ${
          isEditing
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
        }
       
      `}
      onClick={() => {
        // Los nodos de eliminación no se pueden editar
        return;
      }}
    >
      {/* Header del nodo */}
      <div className={`flex flex-row p-2 gap-2`}>
        <div
          className={`flex items-center ${
            data.type === "match" && !isEditing
              ? "justify-center"
              : "justify-between"
          } ${data.type === "match" && !isEditing ? "" : "mb-3"}`}
        >
          <div className="flex items-right">
           <SkullIcon className="w-10 h-10 text-red-500" />
          </div>
        </div>

        
      </div>

      {/* Handles para conexiones - solo entrada para eliminación */}
      <LabeledHandle
        key="elimination"
        id="elimination"
        title="Eliminación"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        isConnectableStart={false}
        isConnectableEnd={true}
        style={{ 
          width: 15, 
          height: 15,
          top: "50%",
          transform: 'translateY(-50%)',
          position: 'absolute'
        }}
      />
    </div>
  );
}
