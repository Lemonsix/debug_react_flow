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
  const { config } = useBaseNode({
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
      <div className="flex flex-col p-3 gap-2 min-w-48">
        <div className="flex items-center gap-2">
          <SkullIcon className="w-6 h-6 text-red-500" />
          <div className="text-sm text-red-500 font-semibold">Eliminación</div>
        </div>

        <div className="text-xs text-slate-400">
          {data.slots.length} slot{data.slots.length !== 1 ? "s" : ""}{" "}
          disponible{data.slots.length !== 1 ? "s" : ""}
        </div>

        {/* Slots de eliminación */}
        <div className="space-y-1">
          {data.slots.map((slot, index) => {
            const isOccupied = slot.participantId;

            return (
              <div
                key={slot.index}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs
                  ${
                    isOccupied
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-slate-50 text-slate-500 border border-slate-200"
                  }`}
              >
                <span className="text-sm">💀</span>
                <span className="font-medium">Eliminado #{index + 1}</span>
                <span className="flex-1 text-right">
                  {isOccupied ? (
                    <span className="text-red-600 font-medium">
                      {slot.participantId}
                    </span>
                  ) : (
                    <span className="text-slate-400">Vacío</span>
                  )}
                </span>
              </div>
            );
          })}
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
          transform: "translateY(-50%)",
          position: "absolute",
        }}
      />
    </div>
  );
}
